-- Custom per-association document folders.
-- Replaces the four hard-coded folder slugs (general/finances/legal/other).
--
-- Existing documents have a `folder` text column (slug). On migration we seed
-- four placeholder folders per association and back-fill `folder_id` so old
-- documents stay grouped.

create table if not exists document_folders (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  name text not null,
  color text not null default '#94a3b8',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_folders_assoc_idx on document_folders(association_id);

alter table document_folders enable row level security;

drop policy if exists document_folders_select on document_folders;
create policy document_folders_select on document_folders for select using (
  exists (
    select 1 from association_memberships
    where association_id = document_folders.association_id
      and user_id = auth.uid()
      and is_active = true
  )
);

-- Writes go through the admin client.

alter table documents
  add column if not exists folder_id uuid references document_folders(id) on delete set null;

create index if not exists documents_folder_id_idx on documents(folder_id);

-- Seed placeholders + back-fill for any association that has no folders yet.
do $$
declare
  a record;
  has_folders boolean;
  fid_general uuid;
  fid_finances uuid;
  fid_legal uuid;
  fid_other uuid;
begin
  for a in select id from associations loop
    select exists (select 1 from document_folders where association_id = a.id) into has_folders;
    if not has_folders then
      insert into document_folders (association_id, name, color, position)
        values (a.id, 'Général', '#60a5fa', 0) returning id into fid_general;
      insert into document_folders (association_id, name, color, position)
        values (a.id, 'Finances', '#34d399', 1) returning id into fid_finances;
      insert into document_folders (association_id, name, color, position)
        values (a.id, 'Juridique', '#a78bfa', 2) returning id into fid_legal;
      insert into document_folders (association_id, name, color, position)
        values (a.id, 'Autre', '#94a3b8', 3) returning id into fid_other;

      update documents set folder_id = fid_general
        where association_id = a.id and folder = 'general' and folder_id is null;
      update documents set folder_id = fid_finances
        where association_id = a.id and folder = 'finances' and folder_id is null;
      update documents set folder_id = fid_legal
        where association_id = a.id and folder = 'legal' and folder_id is null;
      update documents set folder_id = fid_other
        where association_id = a.id and folder = 'other' and folder_id is null;
    end if;
  end loop;
end $$;
