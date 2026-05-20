-- Add 'Refunded' to payment_method enum if it doesn't already exist
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'Refunded';
