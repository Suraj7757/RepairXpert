
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS supplier text DEFAULT '',
  ADD COLUMN IF NOT EXISTS supplier_phone text DEFAULT '';

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS qr_receiver text DEFAULT '';

CREATE OR REPLACE FUNCTION public.track_order(_tracking_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  _order record;
  _history jsonb;
BEGIN
  SELECT jsonb_build_object(
    'type','job','tracking_id',rj.job_id,'customer_name',rj.customer_name,
    'device_brand',rj.device_brand,'device_model',rj.device_model,'problem',rj.problem_description,
    'status',rj.status,'estimated_cost',rj.estimated_cost,'created_at',rj.created_at,'delivered_at',rj.delivered_at,
    'user_id', rj.user_id
  ) INTO result FROM public.repair_jobs rj
  WHERE rj.job_id = _tracking_id AND rj.deleted = false
    AND (rj.status != 'Delivered' OR rj.delivered_at > now() - interval '3 days')
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
    'type','sell','tracking_id',s.sell_id,'item_name',s.item_name,'quantity',s.quantity,
    'total',s.total,'status',s.status,'created_at',s.created_at,
    'user_id', s.user_id
  ) INTO result FROM public.sells s
  WHERE s.sell_id = _tracking_id AND s.deleted = false AND s.created_at > now() - interval '30 days'
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT * INTO _order FROM public.marketplace_orders
  WHERE order_number = _tracking_id AND created_at > now() - interval '60 days'
  LIMIT 1;

  IF _order.id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'to_status', h.to_status,
      'from_status', h.from_status,
      'note', h.note,
      'created_at', h.created_at
    ) ORDER BY h.created_at DESC), '[]'::jsonb)
    INTO _history
    FROM public.order_status_history h
    WHERE h.order_id = _order.id;

    result := jsonb_build_object(
      'type','marketplace',
      'tracking_id', _order.order_number,
      'customer_name', _order.buyer_name,
      'items', _order.items,
      'total', _order.total,
      'status', _order.fulfillment_status,
      'payment_status', _order.payment_status,
      'payment_method', _order.payment_method,
      'fulfillment_method', _order.fulfillment_method,
      'qr_receiver', _order.qr_receiver,
      'created_at', _order.created_at,
      'shop_name', (SELECT shop_name FROM public.shop_settings WHERE user_id = _order.seller_id),
      'history', _history
    );
    RETURN result;
  END IF;

  RETURN NULL;
END;
$function$;
