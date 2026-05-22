-- Staff tracking, attendance, earnings & daily targets
-- Migration: 20260522170000_staff_tracking.sql

-- Staff attendance (check-in / check-out)
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff earnings per job / payment
CREATE TABLE IF NOT EXISTS staff_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID,
  payment_id UUID,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_percent NUMERIC(5,2),
  type TEXT DEFAULT 'commission', -- 'commission', 'bonus', 'salary', 'deduction'
  description TEXT,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff daily targets
CREATE TABLE IF NOT EXISTS staff_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  target_revenue NUMERIC(10,2) DEFAULT 0,
  achieved_revenue NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: shop owner can manage their staff data
CREATE POLICY "shop_owner_attendance" ON staff_attendance
  FOR ALL USING (auth.uid() = shop_user_id);

CREATE POLICY "staff_own_attendance" ON staff_attendance
  FOR SELECT USING (auth.uid() = staff_user_id);

CREATE POLICY "staff_insert_attendance" ON staff_attendance
  FOR INSERT WITH CHECK (auth.uid() = staff_user_id);

CREATE POLICY "staff_update_attendance" ON staff_attendance
  FOR UPDATE USING (auth.uid() = staff_user_id);

CREATE POLICY "shop_owner_earnings" ON staff_earnings
  FOR ALL USING (auth.uid() = shop_user_id);

CREATE POLICY "staff_own_earnings" ON staff_earnings
  FOR SELECT USING (auth.uid() = staff_user_id);

CREATE POLICY "shop_owner_targets" ON staff_targets
  FOR ALL USING (auth.uid() = shop_user_id);

CREATE POLICY "staff_own_targets" ON staff_targets
  FOR SELECT USING (auth.uid() = staff_user_id);
