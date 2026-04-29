-- =============================================================================
-- Event budgets — planned vs actual income/expense per event
-- Run this in your Supabase SQL editor.
-- =============================================================================

-- 1. Tables -------------------------------------------------------------------

create table if not exists event_budgets (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  description text,
  event_date date,
  status text not null default 'planned' check (status in ('planned','active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references event_budgets(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  label text not null,
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_budgets_association on event_budgets(association_id);
create index if not exists idx_event_budget_lines_budget on event_budget_lines(budget_id);

-- 2. Updated_at trigger -------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_event_budgets_updated_at on event_budgets;
create trigger trg_event_budgets_updated_at
  before update on event_budgets
  for each row execute function set_updated_at();

-- 3. RLS ----------------------------------------------------------------------

alter table event_budgets enable row level security;
alter table event_budget_lines enable row level security;

-- READ: any active member of the association
drop policy if exists "members read budgets" on event_budgets;
create policy "members read budgets" on event_budgets
  for select using (
    exists (
      select 1 from association_memberships m
      where m.association_id = event_budgets.association_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
  );

drop policy if exists "members read budget lines" on event_budget_lines;
create policy "members read budget lines" on event_budget_lines
  for select using (
    exists (
      select 1 from event_budgets b
      join association_memberships m on m.association_id = b.association_id
      where b.id = event_budget_lines.budget_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
  );

-- WRITE: server-side admin client only (bypasses RLS).
-- No insert/update/delete policies needed; server actions enforce role.
