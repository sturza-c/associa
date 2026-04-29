-- Association settings: custom role labels + extra titles.
-- Run once in Supabase SQL editor.

-- 1. Custom labels for the 4 built-in permission roles.
--    Stored as JSONB, e.g. { "president": "Capitaine", "treasurer": "Caissier" }
alter table associations
  add column if not exists role_labels jsonb not null default '{}'::jsonb;

-- 2. Custom (cosmetic) titles members can hold in addition to their role.
create table if not exists association_titles (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  name text not null,
  color text not null default '#94a3b8',
  description text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists association_titles_association_idx
  on association_titles(association_id);

-- 3. Many-to-many between memberships and titles.
create table if not exists membership_titles (
  membership_id uuid not null references association_memberships(id) on delete cascade,
  title_id uuid not null references association_titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (membership_id, title_id)
);

create index if not exists membership_titles_title_idx
  on membership_titles(title_id);

-- 4. RLS: any active member of the association can read; writes go through
--    the admin client server-side, so no insert/update/delete policies.

alter table association_titles enable row level security;
alter table membership_titles enable row level security;

drop policy if exists "association_titles read" on association_titles;
create policy "association_titles read" on association_titles
  for select using (
    exists (
      select 1 from association_memberships m
      where m.association_id = association_titles.association_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
  );

drop policy if exists "membership_titles read" on membership_titles;
create policy "membership_titles read" on membership_titles
  for select using (
    exists (
      select 1
      from association_memberships m
      join association_titles t on t.id = membership_titles.title_id
      where m.id = membership_titles.membership_id
        and m.association_id = t.association_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
  );

-- 5. Updated_at trigger for titles.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists association_titles_set_updated_at on association_titles;
create trigger association_titles_set_updated_at
  before update on association_titles
  for each row execute function set_updated_at();
