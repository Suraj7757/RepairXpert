-- Shopkeeper applications table
CREATE TABLE IF NOT EXISTS public.shopkeeper_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  state text,
  address text,
  business_type text DEFAULT 'Mobile Repair',
  gst_number text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.shopkeeper_applications ENABLE ROW LEVEL SECURITY;

-- User can see their own application
CREATE POLICY "user_view_own_application"
  ON public.shopkeeper_applications FOR SELECT
  USING (auth.uid() = user_id);

-- User can insert their own application
CREATE POLICY "user_insert_own_application"
  ON public.shopkeeper_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow super admin (by email stored in profiles) to manage all
-- We use a service-level approach: admin updates via admin UI which uses service key via edge fn
-- For now, allow authenticated users who are admins to view all
CREATE POLICY "admin_manage_applications"
  ON public.shopkeeper_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND account_type = 'shopkeeper'
      AND user_id IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      )
    )
  );
