-- Email-based invitations.
-- A row exists in pending state until the invitee accepts (creates a membership)
-- or it expires.

create table if not exists association_invitations (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('president', 'treasurer', 'secretary', 'member')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index if not exists association_invitations_email_idx on association_invitations(lower(email));
create index if not exists association_invitations_assoc_idx on association_invitations(association_id);

alter table association_invitations enable row level security;

drop policy if exists invitations_select on association_invitations;
create policy invitations_select on association_invitations for select using (
  exists (
    select 1 from association_memberships
    where association_id = association_invitations.association_id
      and user_id = auth.uid()
      and is_active = true
  )
);

-- Writes go through the admin client; no permissive insert/update policy is needed.
