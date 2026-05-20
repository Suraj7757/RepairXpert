-- Migration to support role-based multi-tenancy

-- Role enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'shopkeeper', 'customer');
  END IF;
END$$;

-- Create Shops table first since profiles and transactional tables reference it
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Har transactional table mein shop_id
ALTER TABLE public.repair_jobs ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Invoices table check (invoices may or may not exist, let's make sure if we create it or if it's there)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Employees/Staff check
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and setup policies
ALTER TABLE public.repair_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopkeeper_own_repairs" ON public.repair_jobs;
CREATE POLICY "shopkeeper_own_repairs" ON public.repair_jobs
FOR ALL TO authenticated
USING (
  auth.uid() IN (SELECT owner_id FROM public.shops WHERE id = repair_jobs.shop_id)
  OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
  OR
  user_id = auth.uid()
);

-- RLS policies for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shopkeeper_own_customers" ON public.customers;
CREATE POLICY "shopkeeper_own_customers" ON public.customers
FOR ALL TO authenticated
USING (
  auth.uid() IN (SELECT owner_id FROM public.shops WHERE id = customers.shop_id)
  OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
  OR
  user_id = auth.uid()
);

-- RLS policies for inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shopkeeper_own_inventory" ON public.inventory;
CREATE POLICY "shopkeeper_own_inventory" ON public.inventory
FOR ALL TO authenticated
USING (
  auth.uid() IN (SELECT owner_id FROM public.shops WHERE id = inventory.shop_id)
  OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
  OR
  user_id = auth.uid()
);

-- AI Diagnostics table
CREATE TABLE IF NOT EXISTS public.ai_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_model TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  image_url TEXT,
  diagnosis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_diagnostics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_diagnostics" ON public.ai_diagnostics;
CREATE POLICY "user_own_diagnostics" ON public.ai_diagnostics
FOR ALL TO authenticated
USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- Loyalty points column in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Loyalty points ledger table
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_ledger" ON public.loyalty_ledger;
CREATE POLICY "user_own_ledger" ON public.loyalty_ledger
FOR ALL TO authenticated
USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));
