-- Add missing is_marketplace_listed column referenced across UI (Inventory, SellerListings, Marketplace, LiveMarketplaceShowcase)
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS is_marketplace_listed boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS inventory_marketplace_listed_idx
  ON public.inventory (is_marketplace_listed) WHERE is_marketplace_listed = true;

-- Update sync trigger to respect the flag (hide from marketplace when unchecked)
CREATE OR REPLACE FUNCTION public._sync_inventory_to_marketplace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _existing uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_listings SET active = false WHERE inventory_item_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Hide from marketplace when soft-deleted, out of stock, or flag off
  IF NEW.deleted = true OR COALESCE(NEW.quantity,0) <= 0 OR COALESCE(NEW.is_marketplace_listed, true) = false THEN
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
$function$;