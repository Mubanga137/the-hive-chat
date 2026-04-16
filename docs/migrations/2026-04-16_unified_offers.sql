-- =====================================================================
-- The Hive — Unified Offers + Storefront Slug Migration
-- Run this once in the Supabase SQL editor (project: cnaajzmbkisybwnjeiie).
-- Safe to re-run.
-- =====================================================================

-- 1. Extend sme_stores with slug + logo
ALTER TABLE public.sme_stores
  ADD COLUMN IF NOT EXISTS store_slug text,
  ADD COLUMN IF NOT EXISTS logo_url   text;

UPDATE public.sme_stores
SET store_slug = lower(regexp_replace(coalesce(brand_name, 'store-' || id::text), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE store_slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sme_stores_slug_unique
  ON public.sme_stores (store_slug);

-- 2. Unified-offer fields on hive_catalogue
ALTER TABLE public.hive_catalogue
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS duration       text,
  ADD COLUMN IF NOT EXISTS location_type  text;

UPDATE public.hive_catalogue
SET item_type = 'physical'
WHERE item_type IS NULL OR item_type = 'product';

-- 3. Public storage bucket for store assets + offer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hive_media', 'hive_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hive_media_public_read') THEN
    CREATE POLICY hive_media_public_read ON storage.objects
      FOR SELECT USING (bucket_id = 'hive_media');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hive_media_owner_write') THEN
    CREATE POLICY hive_media_owner_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'hive_media' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hive_media_owner_update') THEN
    CREATE POLICY hive_media_owner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'hive_media' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hive_media_owner_delete') THEN
    CREATE POLICY hive_media_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'hive_media' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
