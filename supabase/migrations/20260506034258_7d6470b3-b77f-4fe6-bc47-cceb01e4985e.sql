-- Strict super-admin identity: only this email gets platform admin/god-mode access
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'krs715665@gmail.com'
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- Re-scope the existing role helper so admin means super-admin only.
-- Other roles continue to work from public.user_roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _role = 'admin'::app_role THEN public.is_super_admin(_user_id)
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Future signups: only the main email becomes admin. Shopkeepers stay normal shopkeepers.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _acct text;
  _role app_role;
BEGIN
  _acct := COALESCE(NEW.raw_user_meta_data->>'account_type', 'shopkeeper');
  IF _acct NOT IN ('shopkeeper','wholesaler','customer') THEN
    _acct := 'shopkeeper';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, referral_code, tracking_id, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'RD' || UPPER(SUBSTR(md5(NEW.id::text), 1, 6)),
    'RX' || UPPER(SUBSTR(md5(NEW.id::text || NOW()::text), 1, 6)),
    _acct
  );

  _role := CASE
    WHEN lower(COALESCE(NEW.email, '')) = 'krs715665@gmail.com' THEN 'admin'::app_role
    WHEN _acct = 'wholesaler' THEN 'wholesaler'::app_role
    WHEN _acct = 'customer' THEN 'customer'::app_role
    ELSE 'shopkeeper'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trial', NOW() + INTERVAL '7 days');

  IF _acct = 'shopkeeper' THEN
    INSERT INTO public.job_counter (user_id, counter) VALUES (NEW.id, 0);
    INSERT INTO public.sell_counter (user_id, counter) VALUES (NEW.id, 0);
    INSERT INTO public.shop_settings (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Existing data cleanup: remove admin role from every email except the one super-admin.
WITH non_super_admins AS (
  SELECT ur.user_id
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'::app_role
    AND lower(coalesce(au.email, '')) <> 'krs715665@gmail.com'
)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'shopkeeper'::app_role
FROM non_super_admins
ON CONFLICT DO NOTHING;

WITH non_super_admins AS (
  SELECT ur.user_id
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'::app_role
    AND lower(coalesce(au.email, '')) <> 'krs715665@gmail.com'
)
DELETE FROM public.user_roles ur
USING non_super_admins nsa
WHERE ur.user_id = nsa.user_id
  AND ur.role = 'admin'::app_role;

WITH super_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(coalesce(email, '')) = 'krs715665@gmail.com'
)
DELETE FROM public.user_roles ur
USING super_user su
WHERE ur.user_id = su.id
  AND ur.role <> 'admin'::app_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(coalesce(email, '')) = 'krs715665@gmail.com'
ON CONFLICT DO NOTHING;