-- Per-association iCal subscription token.
-- Anyone with the token can subscribe to a read-only calendar feed.

alter table associations
  add column if not exists calendar_token uuid unique default gen_random_uuid();

-- Backfill any rows that existed before the default kicked in.
update associations
  set calendar_token = gen_random_uuid()
  where calendar_token is null;

create index if not exists associations_calendar_token_idx
  on associations(calendar_token);
