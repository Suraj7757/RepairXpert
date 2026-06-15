ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'Re-work';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'Returned';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'Cancelled';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'Diagnosed';