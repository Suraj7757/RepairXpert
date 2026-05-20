-- Add email and phone columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update handle_new_user trigger to populate email and phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 BEGIN
   INSERT INTO public.profiles (user_id, display_name, email, phone, referral_code, tracking_id)
   VALUES (
     NEW.id,
     COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
     NEW.email,
     NEW.phone,
     'RD' || UPPER(SUBSTR(md5(NEW.id::text), 1, 6)),
     'RX' || UPPER(SUBSTR(md5(NEW.id::text || NOW()::text), 1, 6))
   );
   INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
   INSERT INTO public.job_counter (user_id, counter) VALUES (NEW.id, 0);
   INSERT INTO public.sell_counter (user_id, counter) VALUES (NEW.id, 0);
   INSERT INTO public.shop_settings (user_id) VALUES (NEW.id);
   INSERT INTO public.wallets (user_id) VALUES (NEW.id);
   INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at) 
   VALUES (NEW.id, 'free', 'trial', NOW() + INTERVAL '7 days');
   RETURN NEW;
 END;
 $function$;
