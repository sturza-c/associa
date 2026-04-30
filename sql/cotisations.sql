-- Cotisations / membership fees
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS cotisations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id  uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES association_memberships(id) ON DELETE CASCADE,
  year            int  NOT NULL,
  amount_due      numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid     numeric(10,2) NOT NULL DEFAULT 0,
  paid_at         timestamptz,
  payment_method  text CHECK (payment_method IN ('cash','virement','twint','carte','autre') OR payment_method IS NULL),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(membership_id, year)
);

ALTER TABLE cotisations ENABLE ROW LEVEL SECURITY;

-- Any active member of the association can read
CREATE POLICY "cotisations_select" ON cotisations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_memberships am
      WHERE am.association_id = cotisations.association_id
        AND am.user_id = auth.uid()
        AND am.is_active = true
    )
  );

-- President, treasurer, or secretary can insert/update/delete
CREATE POLICY "cotisations_manage" ON cotisations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_memberships am
      WHERE am.association_id = cotisations.association_id
        AND am.user_id = auth.uid()
        AND am.is_active = true
        AND am.role IN ('president','treasurer','secretary')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_memberships am
      WHERE am.association_id = cotisations.association_id
        AND am.user_id = auth.uid()
        AND am.is_active = true
        AND am.role IN ('president','treasurer','secretary')
    )
  );
