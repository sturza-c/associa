-- Allow recording cotisations for people who don't have an Associa account.
-- Run this in your Supabase SQL editor AFTER sql/cotisations.sql.

-- 1. Make membership_id optional
ALTER TABLE cotisations ALTER COLUMN membership_id DROP NOT NULL;

-- 2. Add external contributor fields
ALTER TABLE cotisations
  ADD COLUMN IF NOT EXISTS external_name  text,
  ADD COLUMN IF NOT EXISTS external_email text;

-- 3. Every row must have either a membership_id or an external_name
ALTER TABLE cotisations
  ADD CONSTRAINT cotisations_member_or_external
  CHECK (membership_id IS NOT NULL OR external_name IS NOT NULL);
