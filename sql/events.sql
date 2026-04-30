-- ─────────────────────────────────────────────────────────────────────────────
-- Events feature migration
-- Run once in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Main events table
create table if not exists events (
  id               uuid primary key default gen_random_uuid(),
  association_id   uuid not null references associations(id) on delete cascade,
  name             text not null,
  description      text,
  event_date       date,
  start_time       time,
  end_time         time,
  location         text,
  status           text not null default 'planned', -- planned | active | done | cancelled
  max_participants integer,
  created_by       uuid not null references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RSVP / participants
create table if not exists event_participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  response   text not null default 'going', -- going | maybe | declined
  note       text,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

-- Per-event budget lines
create table if not exists event_budget_items (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  type           text not null default 'expense', -- income | expense
  label          text not null,
  planned_amount numeric(12,2) not null default 0,
  actual_amount  numeric(12,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now()
);

-- Per-event task checklist
create table if not exists event_tasks (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  title       text not null,
  assigned_to uuid references auth.users(id),
  due_date    date,
  done        boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists events_assoc_idx         on events(association_id);
create index if not exists events_date_idx          on events(event_date);
create index if not exists event_participants_ev    on event_participants(event_id);
create index if not exists event_budget_items_ev    on event_budget_items(event_id);
create index if not exists event_tasks_ev           on event_tasks(event_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table events             enable row level security;
alter table event_participants enable row level security;
alter table event_budget_items enable row level security;
alter table event_tasks        enable row level security;

-- events: all members can view; president/treasurer/secretary can write
create policy "events_select" on events for select using (
  exists (select 1 from association_memberships
    where association_id = events.association_id
      and user_id = auth.uid() and is_active = true));

create policy "events_insert" on events for insert with check (
  exists (select 1 from association_memberships
    where association_id = events.association_id
      and user_id = auth.uid() and is_active = true
      and role in ('president','treasurer','secretary')));

create policy "events_update" on events for update using (
  exists (select 1 from association_memberships
    where association_id = events.association_id
      and user_id = auth.uid() and is_active = true
      and role in ('president','treasurer','secretary')));

create policy "events_delete" on events for delete using (
  exists (select 1 from association_memberships
    where association_id = events.association_id
      and user_id = auth.uid() and is_active = true
      and role in ('president','treasurer')));

-- event_participants: all members can view; members manage their own row
create policy "ep_select" on event_participants for select using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_participants.event_id
      and am.user_id = auth.uid() and am.is_active = true));

create policy "ep_insert" on event_participants for insert with check (
  user_id = auth.uid() and
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_participants.event_id
      and am.user_id = auth.uid() and am.is_active = true));

create policy "ep_update" on event_participants for update using (user_id = auth.uid());
create policy "ep_delete" on event_participants for delete using (user_id = auth.uid());

-- event_budget_items: all members view; managers write
create policy "ebi_select" on event_budget_items for select using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_budget_items.event_id
      and am.user_id = auth.uid() and am.is_active = true));

create policy "ebi_write" on event_budget_items for all using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_budget_items.event_id
      and am.user_id = auth.uid() and am.is_active = true
      and am.role in ('president','treasurer','secretary')));

-- event_tasks: all members view; managers write; anyone can toggle their own
create policy "et_select" on event_tasks for select using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_tasks.event_id
      and am.user_id = auth.uid() and am.is_active = true));

create policy "et_write" on event_tasks for all using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_tasks.event_id
      and am.user_id = auth.uid() and am.is_active = true
      and am.role in ('president','treasurer','secretary')));
