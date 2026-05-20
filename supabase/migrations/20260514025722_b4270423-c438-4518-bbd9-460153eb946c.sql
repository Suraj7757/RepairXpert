ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS map_lat numeric,
  ADD COLUMN IF NOT EXISTS map_lng numeric,
  ADD COLUMN IF NOT EXISTS map_url text DEFAULT '';