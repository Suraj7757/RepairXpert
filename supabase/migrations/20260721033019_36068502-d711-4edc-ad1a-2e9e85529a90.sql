
-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  gstin text,
  notes text,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own suppliers" ON public.suppliers FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS suppliers_user_idx ON public.suppliers(user_id) WHERE deleted = false;
CREATE TRIGGER suppliers_updated BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  status text NOT NULL DEFAULT 'draft', -- draft | ordered | received | cancelled
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  ordered_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchase_orders" ON public.purchase_orders FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS po_user_status_idx ON public.purchase_orders(user_id, status);
CREATE TRIGGER po_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own po items" ON public.purchase_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.purchase_orders p WHERE p.id = po_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders p WHERE p.id = po_id AND p.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS po_items_po_idx ON public.purchase_order_items(po_id);

-- Stock Movements ledger
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  item_name text,
  delta integer NOT NULL, -- positive = in, negative = out
  reason text NOT NULL,   -- purchase | sale | adjustment | repair_use | return
  reference_type text,
  reference_id text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stock movements read" ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "own stock movements insert" ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS stock_mv_item_idx ON public.stock_movements(inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_mv_user_idx ON public.stock_movements(user_id, created_at DESC);

-- Auto-log inventory quantity changes into stock_movements
CREATE OR REPLACE FUNCTION public._log_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _delta int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _delta := COALESCE(NEW.quantity,0);
    IF _delta <> 0 THEN
      INSERT INTO public.stock_movements(user_id, inventory_item_id, item_name, delta, reason, note)
      VALUES (NEW.user_id, NEW.id, NEW.name, _delta, 'initial', 'Initial stock');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _delta := COALESCE(NEW.quantity,0) - COALESCE(OLD.quantity,0);
    IF _delta <> 0 THEN
      INSERT INTO public.stock_movements(user_id, inventory_item_id, item_name, delta, reason, note)
      VALUES (NEW.user_id, NEW.id, NEW.name, _delta, 'adjustment', 'Qty change via inventory update');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS inventory_stock_log ON public.inventory;
CREATE TRIGGER inventory_stock_log
  AFTER INSERT OR UPDATE OF quantity ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public._log_stock_movement();

-- Receive PO: bumps inventory & logs movement
CREATE OR REPLACE FUNCTION public.receive_purchase_order(_po_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _po record; _it record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _po FROM public.purchase_orders WHERE id = _po_id FOR UPDATE;
  IF _po.id IS NULL THEN RAISE EXCEPTION 'PO not found'; END IF;
  IF _po.user_id <> auth.uid() AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _po.status = 'received' THEN RAISE EXCEPTION 'Already received'; END IF;

  FOR _it IN SELECT * FROM public.purchase_order_items WHERE po_id = _po_id LOOP
    IF _it.inventory_item_id IS NOT NULL THEN
      UPDATE public.inventory
        SET quantity = quantity + _it.quantity,
            cost_price = CASE WHEN _it.cost_price > 0 THEN _it.cost_price ELSE cost_price END
        WHERE id = _it.inventory_item_id;
    END IF;
    INSERT INTO public.stock_movements(user_id, inventory_item_id, item_name, delta, reason, reference_type, reference_id, note)
    VALUES (_po.user_id, _it.inventory_item_id, _it.item_name, _it.quantity, 'purchase', 'purchase_order', _po.po_number, 'Received from '||COALESCE(_po.supplier_name,'supplier'));
  END LOOP;

  UPDATE public.purchase_orders SET status='received', received_at=now() WHERE id=_po_id;
END $$;
