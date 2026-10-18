-- ─────────────────────────────────────────────────────────────────────────────
-- Waitlist for the pilot programme (landing page on getassocia.me)
-- Run once in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists waitlist (
  id               uuid primary key default gen_random_uuid(),
  association_name text not null,
  contact_name     text not null,
  email            text not null,
  role             text,
  members_count    text,
  city             text,
  message          text,
  created_at       timestamptz not null default now()
);

create unique index if not exists waitlist_email_idx on waitlist (lower(email));

-- No public access at all: the landing page writes and counts through the server (service role).
alter table waitlist enable row level security;
