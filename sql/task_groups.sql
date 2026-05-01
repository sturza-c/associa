CREATE TABLE task_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_group_members (
  group_id UUID NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES association_memberships(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, membership_id)
);

ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assoc members read task_groups"
  ON task_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM association_memberships
    WHERE association_id = task_groups.association_id
      AND user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "assoc members read task_group_members"
  ON task_group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM task_groups tg
    JOIN association_memberships am ON am.association_id = tg.association_id
    WHERE tg.id = task_group_members.group_id
      AND am.user_id = auth.uid() AND am.is_active = true
  ));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL;
