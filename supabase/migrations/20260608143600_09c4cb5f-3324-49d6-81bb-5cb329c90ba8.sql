
CREATE TABLE public.shop_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'general',
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  duration_minutes integer DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  bookable boolean NOT NULL DEFAULT true,
  icon text DEFAULT 'wrench',
  image_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_services TO authenticated;
GRANT ALL ON public.shop_services TO service_role;
ALTER TABLE public.shop_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active services" ON public.shop_services FOR SELECT
  USING (active = true OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owner manages services" ON public.shop_services FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_shop_services_updated_at BEFORE UPDATE ON public.shop_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid REFERENCES public.shop_services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  customer_name text NOT NULL,
  customer_mobile text NOT NULL,
  customer_address text DEFAULT '',
  preferred_date timestamptz,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  estimated_price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_bookings TO authenticated;
GRANT INSERT ON public.service_bookings TO anon;
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a service booking" ON public.service_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(customer_name) > 0 AND length(customer_mobile) >= 7);
CREATE POLICY "Shop owner views own bookings" ON public.service_bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Shop owner updates own bookings" ON public.service_bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Shop owner deletes own bookings" ON public.service_bookings FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS public_listing boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.public_shops_directory(_search text DEFAULT NULL, _limit int DEFAULT 60)
RETURNS TABLE (
  user_id uuid, shop_name text, address text, phone text,
  booking_slug text, booking_enabled boolean,
  map_lat double precision, map_lng double precision,
  product_count bigint, service_count bigint,
  rating_avg numeric, rating_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.user_id, s.shop_name, s.address, s.phone, s.booking_slug, s.booking_enabled,
    s.map_lat, s.map_lng,
    COALESCE((SELECT count(*) FROM public.marketplace_listings l WHERE l.seller_id = s.user_id AND l.active = true), 0) AS product_count,
    COALESCE((SELECT count(*) FROM public.shop_services sv WHERE sv.user_id = s.user_id AND sv.active = true), 0) AS service_count,
    COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.shop_reviews r WHERE r.user_id = s.user_id AND r.status = 'approved'), 0) AS rating_avg,
    COALESCE((SELECT count(*) FROM public.shop_reviews r WHERE r.user_id = s.user_id AND r.status = 'approved'), 0) AS rating_count
  FROM public.shop_settings s
  WHERE COALESCE(s.public_listing, true) = true
    AND s.shop_name IS NOT NULL AND length(s.shop_name) > 0
    AND (_search IS NULL OR _search = ''
         OR s.shop_name ILIKE '%'||_search||'%'
         OR s.address ILIKE '%'||_search||'%')
  ORDER BY rating_count DESC NULLS LAST, s.shop_name ASC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.get_public_shop_details(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'shop', jsonb_build_object(
      'user_id', s.user_id, 'shop_name', s.shop_name, 'address', s.address,
      'phone', s.phone, 'booking_slug', s.booking_slug, 'booking_enabled', s.booking_enabled,
      'map_lat', s.map_lat, 'map_lng', s.map_lng, 'map_url', s.map_url, 'upi_id', s.upi_id
    ),
    'services', COALESCE((
      SELECT jsonb_agg(to_jsonb(sv.*) ORDER BY sv.name)
      FROM public.shop_services sv
      WHERE sv.user_id = s.user_id AND sv.active = true
    ), '[]'::jsonb),
    'products', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'title', l.title, 'price', l.price, 'mrp', l.mrp,
        'stock', l.stock, 'category', l.category, 'images', l.images
      ) ORDER BY l.created_at DESC)
      FROM public.marketplace_listings l
      WHERE l.seller_id = s.user_id AND l.active = true
      LIMIT 100
    ), '[]'::jsonb),
    'rating', public.get_shop_rating_summary(s.user_id)
  )
  FROM public.shop_settings s
  WHERE s.booking_slug = _slug AND COALESCE(s.public_listing, true) = true
  LIMIT 1;
$$;
