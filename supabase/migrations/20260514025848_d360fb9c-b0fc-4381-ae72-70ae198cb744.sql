CREATE OR REPLACE FUNCTION public.get_marketplace_listing(_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'listing', to_jsonb(l.*),
    'seller', jsonb_build_object(
      'shop_name', s.shop_name,
      'phone', s.phone,
      'address', s.address,
      'booking_slug', s.booking_slug,
      'map_url', s.map_url,
      'map_lat', s.map_lat,
      'map_lng', s.map_lng
    )
  )
  FROM public.marketplace_listings l
  LEFT JOIN public.shop_settings s ON s.user_id = l.seller_id
  WHERE l.id = _id AND l.active = true
$function$;