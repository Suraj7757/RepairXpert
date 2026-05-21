
-- 1. Profiles missing columns (referenced by AuthContext)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS shop_id uuid,
  ADD COLUMN IF NOT EXISTS role text;

-- 2. system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read config" ON public.system_config;
CREATE POLICY "Anyone authenticated can read config" ON public.system_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage config" ON public.system_config;
CREATE POLICY "Admins manage config" ON public.system_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.system_config (id, value) VALUES ('maintenance', '{"enabled": false}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

-- 3. shopkeeper_applications table
CREATE TABLE IF NOT EXISTS public.shopkeeper_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text NOT NULL,
  state text DEFAULT '',
  address text DEFAULT '',
  business_type text NOT NULL DEFAULT 'Mobile Repair',
  gst_number text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shopkeeper_applications_user_unique
  ON public.shopkeeper_applications(user_id)
  WHERE status IN ('pending', 'approved');

ALTER TABLE public.shopkeeper_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own application" ON public.shopkeeper_applications;
CREATE POLICY "Users view own application" ON public.shopkeeper_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own application" ON public.shopkeeper_applications;
CREATE POLICY "Users create own application" ON public.shopkeeper_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users delete own rejected application" ON public.shopkeeper_applications;
CREATE POLICY "Users delete own rejected application" ON public.shopkeeper_applications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'rejected');

DROP POLICY IF EXISTS "Admins view all applications" ON public.shopkeeper_applications;
CREATE POLICY "Admins view all applications" ON public.shopkeeper_applications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update applications" ON public.shopkeeper_applications;
CREATE POLICY "Admins update applications" ON public.shopkeeper_applications
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete applications" ON public.shopkeeper_applications;
CREATE POLICY "Admins delete applications" ON public.shopkeeper_applications
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_apps_updated_at
  BEFORE UPDATE ON public.shopkeeper_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Secure approval RPC
CREATE OR REPLACE FUNCTION public.approve_shopkeeper_application(
  _app_id uuid,
  _approve boolean,
  _reason text DEFAULT ''
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _app record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO _app FROM public.shopkeeper_applications WHERE id = _app_id FOR UPDATE;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _app.status <> 'pending' THEN RAISE EXCEPTION 'Already %', _app.status; END IF;

  IF _approve THEN
    UPDATE public.shopkeeper_applications
      SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
      WHERE id = _app_id;

    UPDATE public.profiles
      SET account_type = 'shopkeeper', display_name = COALESCE(NULLIF(_app.owner_name,''), display_name)
      WHERE user_id = _app.user_id;

    DELETE FROM public.user_roles WHERE user_id = _app.user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (_app.user_id, 'shopkeeper'::app_role);

    INSERT INTO public.shop_settings (user_id, shop_name, phone, address)
      VALUES (_app.user_id, _app.shop_name, _app.phone, COALESCE(_app.address, ''))
      ON CONFLICT (user_id) DO UPDATE SET shop_name = EXCLUDED.shop_name, phone = EXCLUDED.phone, address = EXCLUDED.address;

    INSERT INTO public.job_counter (user_id, counter) VALUES (_app.user_id, 0) ON CONFLICT DO NOTHING;
    INSERT INTO public.sell_counter (user_id, counter) VALUES (_app.user_id, 0) ON CONFLICT DO NOTHING;

    INSERT INTO public.activity_log (user_id, entity_type, action, entity_id, entity_name, details)
      VALUES (auth.uid(), 'shopkeeper_application', 'approved', _app_id, _app.shop_name,
              jsonb_build_object('approved_user_id', _app.user_id));
  ELSE
    UPDATE public.shopkeeper_applications
      SET status = 'rejected', rejection_reason = COALESCE(_reason, ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
      WHERE id = _app_id;

    INSERT INTO public.activity_log (user_id, entity_type, action, entity_id, entity_name, details)
      VALUES (auth.uid(), 'shopkeeper_application', 'rejected', _app_id, _app.shop_name,
              jsonb_build_object('reason', _reason, 'rejected_user_id', _app.user_id));
  END IF;
END;
$$;

-- 5. shop_settings unique constraint for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_settings_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.shop_settings ADD CONSTRAINT shop_settings_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END$$;
