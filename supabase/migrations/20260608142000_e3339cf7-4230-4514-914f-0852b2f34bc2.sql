
-- AI quotes log
CREATE TABLE public.ai_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device TEXT NOT NULL,
  problem TEXT NOT NULL,
  image_url TEXT,
  quote JSONB NOT NULL,
  selected_shop_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_quotes TO authenticated;
GRANT ALL ON public.ai_quotes TO service_role;
ALTER TABLE public.ai_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own ai quotes" ON public.ai_quotes FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "users insert own ai quotes" ON public.ai_quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own ai quotes" ON public.ai_quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Customer addresses
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  line1 TEXT NOT NULL,
  city TEXT,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own addresses" ON public.customer_addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nearby shops RPC (haversine in km)
CREATE OR REPLACE FUNCTION public.nearby_shops(_lat double precision, _lng double precision, _radius_km double precision DEFAULT 25)
RETURNS TABLE(
  user_id UUID,
  shop_name TEXT,
  address TEXT,
  phone TEXT,
  booking_slug TEXT,
  booking_enabled BOOLEAN,
  map_lat DOUBLE PRECISION,
  map_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, s.shop_name, s.address, s.phone, s.booking_slug, s.booking_enabled,
         s.map_lat, s.map_lng,
         CASE
           WHEN _lat IS NULL OR _lng IS NULL OR s.map_lat IS NULL OR s.map_lng IS NULL THEN NULL
           ELSE 6371 * 2 * asin(sqrt(
             power(sin(radians((s.map_lat - _lat) / 2)), 2) +
             cos(radians(_lat)) * cos(radians(s.map_lat)) *
             power(sin(radians((s.map_lng - _lng) / 2)), 2)
           ))
         END AS distance_km
  FROM public.shop_settings s
  WHERE s.booking_enabled = true
    AND (
      _lat IS NULL OR _lng IS NULL OR s.map_lat IS NULL OR s.map_lng IS NULL
      OR 6371 * 2 * asin(sqrt(
        power(sin(radians((s.map_lat - _lat) / 2)), 2) +
        cos(radians(_lat)) * cos(radians(s.map_lat)) *
        power(sin(radians((s.map_lng - _lng) / 2)), 2)
      )) <= _radius_km
    )
  ORDER BY distance_km NULLS LAST
  LIMIT 20;
$$;
GRANT EXECUTE ON FUNCTION public.nearby_shops(double precision, double precision, double precision) TO authenticated, anon;
