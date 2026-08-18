GRANT EXECUTE ON FUNCTION public.is_not_banned() TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon;

CREATE OR REPLACE FUNCTION public.public_shop_cards(_ids uuid[])
RETURNS TABLE(user_id uuid, shop_name text, address text, phone text, booking_slug text, booking_enabled boolean, map_lat numeric, map_lng numeric, map_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.user_id, s.shop_name, s.address, s.phone, s.booking_slug, s.booking_enabled,
         s.map_lat, s.map_lng, s.map_url
  FROM public.shop_settings s
  WHERE s.user_id = ANY(_ids)
    AND COALESCE(s.public_listing, true) = true
$$;

GRANT EXECUTE ON FUNCTION public.public_shop_cards(uuid[]) TO anon, authenticated;