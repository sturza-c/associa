-- Notes & note folders
-- Run in Supabase SQL editor

create table if not exists note_folders (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 60),
  color text not null default '#94a3b8',
  position integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  folder_id uuid references note_folders(id) on delete set null,
  created_by uuid not null references auth.users(id),
  title text not null default '',
  content text not null default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_notes_association on notes(association_id);
create index if not exists idx_notes_folder on notes(folder_id);
create index if not exists idx_note_folders_assoc on note_folders(association_id);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_notes_updated_at on notes;
create trigger trg_notes_updated_at
  before update on notes for each row execute function set_updated_at();

alter table note_folders enable row level security;
alter table notes enable row level security;

drop policy if exists "assoc_members_read_note_folders" on note_folders;
create policy "assoc_members_read_note_folders" on note_folders
  for select using (
    exists (select 1 from association_memberships where association_id = note_folders.association_id and user_id = auth.uid() and is_active = true)
  );

drop policy if exists "assoc_members_read_notes" on notes;
create policy "assoc_members_read_notes" on notes
  for select using (
    exists (select 1 from association_memberships where association_id = notes.association_id and user_id = auth.uid() and is_active = true)
  );
