-- Repair missing marketplace listing table in environments where the
-- original marketplace migration was not applied or the table was removed.
-- Safe to run repeatedly: existing rows are retained and missing columns/indexes
-- are added in place. This also asks PostgREST to refresh its schema cache.

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  seller_type text NOT NULL DEFAULT 'shopkeeper',
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
  inventory_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bring partially-created tables up to the shape expected by the app.
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'shopkeeper',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mrp numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moq integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inventory_item_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_active
  ON public.marketplace_listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_category
  ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_inventory_item
  ON public.marketplace_listings(inventory_item_id);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Recreate the known marketplace policies idempotently.
DROP POLICY IF EXISTS "Public can view active listings" ON public.marketplace_listings;
CREATE POLICY "Public can view active listings"
  ON public.marketplace_listings FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Seller views own listings" ON public.marketplace_listings;
CREATE POLICY "Seller views own listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Seller manages own listings" ON public.marketplace_listings;
CREATE POLICY "Seller manages own listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id AND public.is_not_banned())
  WITH CHECK (auth.uid() = seller_id AND public.is_not_banned());

DROP POLICY IF EXISTS "Admin manages all listings" ON public.marketplace_listings;
CREATE POLICY "Admin manages all listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;

-- Use a self-contained timestamp trigger rather than relying on any unrelated
-- migration having created update_updated_at_column().
CREATE OR REPLACE FUNCTION public.set_marketplace_listing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listings_updated ON public.marketplace_listings;
CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_marketplace_listing_updated_at();

-- Force PostgREST to discover the table and newly-added columns immediately.
NOTIFY pgrst, 'reload schema';
