
-- ============ PHASE 0: SECURITY ============
-- Remove user self-update on wallets (force admin RPC route)
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- ============ PHASE 1: MARKETPLACE TABLES ============

CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  seller_type text NOT NULL DEFAULT 'shopkeeper', -- shopkeeper | wholesaler
  title text NOT NULL,
  category text DEFAULT 'general',
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  mrp numeric DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  moq integer NOT NULL DEFAULT 1,
  images text[] DEFAULT ARRAY[]::text[],
  location text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_listings_active ON public.marketplace_listings(active) WHERE active = true;
CREATE INDEX idx_listings_category ON public.marketplace_listings(category);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active listings"
  ON public.marketplace_listings FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Seller views own listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Seller manages own listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id AND public.is_not_banned())
  WITH CHECK (auth.uid() = seller_id AND public.is_not_banned());

CREATE POLICY "Admin manages all listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== Marketplace Orders =====
CREATE TABLE public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('MO' || UPPER(substr(md5(random()::text), 1, 8))),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  buyer_name text DEFAULT '',
  buyer_mobile text DEFAULT '',
  buyer_address text DEFAULT '',
  payment_method text DEFAULT 'cod', -- cod | upi | wallet
  payment_status text DEFAULT 'pending', -- pending | paid | failed | refunded
  fulfillment_status text DEFAULT 'placed', -- placed | accepted | packed | shipped | delivered | cancelled
  tracking_id text,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_morders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_morders_seller ON public.marketplace_orders(seller_id);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer manages own orders"
  ON public.marketplace_orders FOR ALL
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Seller views received orders"
  ON public.marketplace_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Seller updates received orders"
  ON public.marketplace_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Admin manages all marketplace orders"
  ON public.marketplace_orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== Cart =====
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own cart"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== Wishlist =====
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own wishlist"
  ON public.wishlists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== Updated_at triggers =====
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_morders_updated BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Atomic place-order RPC =====
CREATE OR REPLACE FUNCTION public.place_marketplace_order(
  _seller_id uuid,
  _items jsonb,        -- [{listing_id, quantity}]
  _buyer_name text,
  _buyer_mobile text,
  _buyer_address text,
  _payment_method text DEFAULT 'cod',
  _shipping numeric DEFAULT 0,
  _notes text DEFAULT ''
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _buyer uuid := auth.uid();
  _order_id uuid;
  _it jsonb;
  _listing record;
  _qty integer;
  _line_total numeric;
  _subtotal numeric := 0;
  _enriched jsonb := '[]'::jsonb;
BEGIN
  IF _buyer IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Empty cart'; END IF;

  -- validate + lock rows + compute totals
  FOR _it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := COALESCE((_it->>'quantity')::int, 1);
    SELECT * INTO _listing FROM public.marketplace_listings
      WHERE id = (_it->>'listing_id')::uuid AND active = true
      FOR UPDATE;
    IF _listing.id IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
    IF _listing.seller_id <> _seller_id THEN RAISE EXCEPTION 'Items must be from one seller'; END IF;
    IF _listing.stock < _qty THEN RAISE EXCEPTION 'Out of stock: %', _listing.title; END IF;

    _line_total := _listing.price * _qty;
    _subtotal := _subtotal + _line_total;
    _enriched := _enriched || jsonb_build_array(jsonb_build_object(
      'listing_id', _listing.id,
      'title', _listing.title,
      'price', _listing.price,
      'quantity', _qty,
      'line_total', _line_total
    ));

    UPDATE public.marketplace_listings
      SET stock = stock - _qty
      WHERE id = _listing.id;
  END LOOP;

  INSERT INTO public.marketplace_orders (
    buyer_id, seller_id, items, subtotal, shipping, total,
    buyer_name, buyer_mobile, buyer_address, payment_method, notes
  ) VALUES (
    _buyer, _seller_id, _enriched, _subtotal, _shipping, _subtotal + _shipping,
    _buyer_name, _buyer_mobile, _buyer_address, _payment_method, _notes
  ) RETURNING id INTO _order_id;

  -- Clear cart for these items
  DELETE FROM public.cart_items
   WHERE user_id = _buyer
     AND listing_id IN (SELECT (i->>'listing_id')::uuid FROM jsonb_array_elements(_items) i);

  RETURN _order_id;
END;
$$;

-- ===== Public listing detail (anonymous browsable) =====
CREATE OR REPLACE FUNCTION public.get_marketplace_listing(_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'listing', to_jsonb(l.*),
    'seller', jsonb_build_object(
      'shop_name', s.shop_name,
      'phone', s.phone,
      'address', s.address,
      'booking_slug', s.booking_slug
    )
  )
  FROM public.marketplace_listings l
  LEFT JOIN public.shop_settings s ON s.user_id = l.seller_id
  WHERE l.id = _id AND l.active = true
$$;
