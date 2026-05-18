
-- 1. Wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer or seller views order history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_orders o
    WHERE o.id = order_status_history.order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ) OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_osh_order ON public.order_status_history(order_id, created_at DESC);

-- 3. Seller status update RPC
CREATE OR REPLACE FUNCTION public.update_marketplace_order_status(_order_id uuid, _status text, _note text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _order record;
  _it jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _status NOT IN ('placed','confirmed','packed','shipped','out_for_delivery','delivered','completed','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', _status;
  END IF;

  SELECT * INTO _order FROM public.marketplace_orders WHERE id = _order_id FOR UPDATE;
  IF _order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _order.seller_id <> auth.uid() AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Only seller can update this order';
  END IF;
  IF _order.fulfillment_status = _status THEN RETURN; END IF;

  -- restore stock if cancelling a non-cancelled order
  IF _status = 'cancelled' AND COALESCE(_order.fulfillment_status,'') <> 'cancelled' THEN
    FOR _it IN SELECT * FROM jsonb_array_elements(COALESCE(_order.items,'[]'::jsonb)) LOOP
      UPDATE public.marketplace_listings
        SET stock = stock + COALESCE((_it->>'quantity')::int, 0)
        WHERE id = (_it->>'listing_id')::uuid;
    END LOOP;
  END IF;

  UPDATE public.marketplace_orders
    SET fulfillment_status = _status,
        payment_status = CASE WHEN _status IN ('delivered','completed') AND payment_method = 'cod' THEN 'paid' ELSE payment_status END,
        updated_at = now()
    WHERE id = _order_id;

  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
    VALUES (_order_id, _order.fulfillment_status, _status, auth.uid(), COALESCE(_note,''));
END;
$$;

-- 4. Extend track_order to include marketplace orders
CREATE OR REPLACE FUNCTION public.track_order(_tracking_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'type','job','tracking_id',rj.job_id,'customer_name',rj.customer_name,
    'device_brand',rj.device_brand,'device_model',rj.device_model,'problem',rj.problem_description,
    'status',rj.status,'estimated_cost',rj.estimated_cost,'created_at',rj.created_at,'delivered_at',rj.delivered_at
  ) INTO result FROM public.repair_jobs rj
  WHERE rj.job_id = _tracking_id AND rj.deleted = false
    AND (rj.status != 'Delivered' OR rj.delivered_at > now() - interval '3 days')
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
    'type','sell','tracking_id',s.sell_id,'item_name',s.item_name,'quantity',s.quantity,
    'total',s.total,'status',s.status,'created_at',s.created_at
  ) INTO result FROM public.sells s
  WHERE s.sell_id = _tracking_id AND s.deleted = false AND s.created_at > now() - interval '30 days'
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
    'type','marketplace','tracking_id',mo.order_number,'customer_name',mo.buyer_name,
    'items',mo.items,'total',mo.total,'status',mo.fulfillment_status,
    'payment_status',mo.payment_status,'payment_method',mo.payment_method,
    'fulfillment_method',mo.fulfillment_method,'created_at',mo.created_at,
    'shop_name',(SELECT shop_name FROM public.shop_settings WHERE user_id = mo.seller_id)
  ) INTO result FROM public.marketplace_orders mo
  WHERE mo.order_number = _tracking_id
    AND mo.created_at > now() - interval '60 days'
  LIMIT 1;

  RETURN result;
END;
$$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_listings_active_cat ON public.marketplace_listings(active, category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_active_price ON public.marketplace_listings(active, price) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_mo_buyer_created ON public.marketplace_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mo_seller_created ON public.marketplace_orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mo_order_number ON public.marketplace_orders(order_number);
