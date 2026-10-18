-- ─────────────────────────────────────────────────────────────────────────────
-- Public sign-up from the association's public page + event photo albums
-- Run once in your Supabase SQL editor (after events.sql and public_page.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-event switch: can people sign up from the public page?
alter table events add column if not exists public_signup boolean not null default true;

-- Sign-ups coming from the public page (people without an Associa account)
create table if not exists event_registrations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  full_name  text not null,
  email      text not null,
  note       text,
  created_at timestamptz not null default now(),
  unique(event_id, email)
);
create index if not exists event_registrations_ev on event_registrations(event_id);

-- Photo albums ("souvenirs") per event
create table if not exists event_photos (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  association_id uuid not null references associations(id) on delete cascade,
  file_path      text not null,
  width          integer,
  height         integer,
  uploaded_by    uuid not null references auth.users(id),
  created_at     timestamptz not null default now()
);
create index if not exists event_photos_ev on event_photos(event_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Reads: active members of the association. Writes go through server actions
-- (service role), which check permissions themselves.
alter table event_registrations enable row level security;
alter table event_photos        enable row level security;

drop policy if exists "er_select" on event_registrations;
create policy "er_select" on event_registrations for select using (
  exists (select 1 from events e join association_memberships am
    on am.association_id = e.association_id
    where e.id = event_registrations.event_id
      and am.user_id = auth.uid() and am.is_active = true));

drop policy if exists "eph_select" on event_photos;
create policy "eph_select" on event_photos for select using (
  exists (select 1 from association_memberships am
    where am.association_id = event_photos.association_id
      and am.user_id = auth.uid() and am.is_active = true));

-- ── Storage ───────────────────────────────────────────────────────────────────
-- Private bucket: photos are served through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;
