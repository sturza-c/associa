-- Finance categories (rubriques)
do $$ begin

  create table if not exists finance_categories (
    id            uuid        primary key default gen_random_uuid(),
    association_id uuid       not null references associations(id) on delete cascade,
    name          text        not null check (char_length(name) between 1 and 60),
    color         text        not null default '#94a3b8',
    position      integer     not null default 0,
    created_at    timestamptz default now()
  );

  -- category_id on finances (null = uncategorised)
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'finances' and column_name = 'category_id'
  ) then
    alter table finances
      add column category_id uuid references finance_categories(id) on delete set null;
  end if;

  -- RLS
  alter table finance_categories enable row level security;

  drop policy if exists "members_read_finance_categories"  on finance_categories;
  drop policy if exists "members_write_finance_categories" on finance_categories;

  create policy "members_read_finance_categories" on finance_categories
    for select using (
      exists (
        select 1 from association_memberships
        where association_id = finance_categories.association_id
          and user_id = auth.uid()
          and is_active = true
      )
    );

  create policy "members_write_finance_categories" on finance_categories
    for all using (
      exists (
        select 1 from association_memberships
        where association_id = finance_categories.association_id
          and user_id = auth.uid()
          and is_active = true
          and role in ('president', 'treasurer')
      )
    );

end $$;

-- Seed default categories for associations that have none yet
insert into finance_categories (association_id, name, color, position)
select
  a.id,
  cat.name,
  cat.color,
  cat.pos
from associations a
cross join (values
  ('Cotisations',          '#a78bfa', 0),
  ('Événements',           '#60a5fa', 1),
  ('Frais administratifs', '#94a3b8', 2),
  ('Achats & matériel',    '#fbbf24', 3)
) as cat(name, color, pos)
where not exists (
  select 1 from finance_categories fc
  where fc.association_id = a.id
);
