-- 1. Ensure profiles has shop_id, email, phone if they do not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS shop_id uuid;

-- 2. Create qr_codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name text NOT NULL,
  upi_id text NOT NULL,
  image text, -- base64 data URL or external asset URL
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Policies for qr_codes
DROP POLICY IF EXISTS "Users can manage their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can manage their own QR codes" ON public.qr_codes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Create invoices table (to list generated invoices in UI)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  shop_id uuid, -- For compatibility with both multi-tenant approaches
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_mobile text,
  amount numeric NOT NULL,
  status text DEFAULT 'unpaid',
  payment_method text DEFAULT 'cash',
  jobs_details jsonb, -- Details of jobs/items billed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;
CREATE POLICY "Users can manage their own invoices" ON public.invoices
  FOR ALL TO authenticated 
  USING (
    auth.uid() = user_id 
  ) 
  WITH CHECK (
    auth.uid() = user_id 
  );
