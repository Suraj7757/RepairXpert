
-- 1) Add fulfillment fields to marketplace_orders
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS fulfillment_method text NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS pickup_date date;

-- 2) Link a marketplace listing to its source inventory item (for auto-sync)
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS inventory_item_id uuid;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_inventory_item
  ON public.marketplace_listings(inventory_item_id);

-- 3) Trigger function: keep marketplace_listings in sync with inventory
CREATE OR REPLACE FUNCTION public._sync_inventory_to_marketplace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _existing uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_listings SET active = false WHERE inventory_item_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Soft-deleted or zero stock => hide from marketplace
  IF NEW.deleted = true OR COALESCE(NEW.quantity,0) <= 0 THEN
    UPDATE public.marketplace_listings
       SET active = false, stock = COALESCE(NEW.quantity,0), updated_at = now()
     WHERE inventory_item_id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT id INTO _existing FROM public.marketplace_listings WHERE inventory_item_id = NEW.id;
  IF _existing IS NULL THEN
    INSERT INTO public.marketplace_listings (
      seller_id, inventory_item_id, title, category, description,
      price, mrp, stock, moq, active, seller_type
    ) VALUES (
      NEW.user_id, NEW.id, NEW.name, COALESCE(LOWER(NEW.category),'general'),
      COALESCE('SKU: '||NEW.sku,''),
      NEW.sell_price, GREATEST(NEW.sell_price, NEW.cost_price), NEW.quantity, 1, true, 'shopkeeper'
    );
  ELSE
    UPDATE public.marketplace_listings
       SET title = NEW.name,
           category = COALESCE(LOWER(NEW.category),'general'),
           price = NEW.sell_price,
           mrp = GREATEST(NEW.sell_price, NEW.cost_price),
           stock = NEW.quantity,
           active = true,
           updated_at = now()
     WHERE id = _existing;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_marketplace_sync ON public.inventory;
CREATE TRIGGER trg_inventory_marketplace_sync
AFTER INSERT OR UPDATE OR DELETE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public._sync_inventory_to_marketplace();

-- 4) Backfill existing in-stock inventory rows into marketplace
INSERT INTO public.marketplace_listings (
  seller_id, inventory_item_id, title, category, description,
  price, mrp, stock, moq, active, seller_type
)
SELECT i.user_id, i.id, i.name, COALESCE(LOWER(i.category),'general'),
       COALESCE('SKU: '||i.sku,''),
       i.sell_price, GREATEST(i.sell_price, i.cost_price), i.quantity,
       1, true, 'shopkeeper'
FROM public.inventory i
LEFT JOIN public.marketplace_listings m ON m.inventory_item_id = i.id
WHERE i.deleted = false AND i.quantity > 0 AND m.id IS NULL;
