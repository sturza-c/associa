-- Public association page
-- Run this in your Supabase SQL editor

ALTER TABLE associations
  ADD COLUMN IF NOT EXISTS slug       text    UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public  boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS associations_slug_idx ON associations(slug) WHERE slug IS NOT NULL;

-- Allow anyone to read public associations by slug (for the public page)
CREATE POLICY "associations_public_read" ON associations
  FOR SELECT
  USING (is_public = true);
