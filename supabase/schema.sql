-- Linkd'N Live MVP starter schema

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  role text not null check (role in ('moderator','venue_owner','venue_staff')),
  display_name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  active boolean not null default true,
  owner_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists venue_members (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  access_level text not null check (access_level in ('owner','manager','operator')),
  active boolean not null default true,
  unique (venue_id, profile_id)
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  notes text,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists room_venues (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  role text not null default 'participant' check (role in ('participant','judge','observer')),
  sort_order int not null default 1,
  unique (room_id, venue_id)
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  starts_at timestamptz,
  segment_title text not null,
  segment_type text not null,
  description text,
  sort_order int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists show_state (
  room_id uuid primary key references rooms(id) on delete cascade,
  current_segment text,
  current_round text,
  judge_venue_id uuid references venues(id) on delete set null,
  battle_left_venue_id uuid references venues(id) on delete set null,
  battle_right_venue_id uuid references venues(id) on delete set null,
  winner_venue_id uuid references venues(id) on delete set null,
  portal_open boolean not null default false,
  timer_running boolean not null default false,
  remaining_seconds int not null default 60,
  event_type text,
  updated_at timestamptz not null default now()
);

create table if not exists patron_polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  type text not null check (type in ('next_city','next_game','winner')),
  question text not null,
  status text not null default 'open' check (status in ('draft','open','closed','approved','cancelled')),
  closes_at timestamptz,
  approved_option_id uuid,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists patron_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references patron_polls(id) on delete cascade,
  option_key text not null,
  label text not null,
  sort_order int not null default 1
);

create table if not exists patron_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references patron_polls(id) on delete cascade,
  option_id uuid not null references patron_poll_options(id) on delete cascade,
  voter_session_id text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_session_id)
);

alter table profiles enable row level security;
alter table venues enable row level security;
alter table venue_members enable row level security;
alter table rooms enable row level security;
alter table room_venues enable row level security;
alter table schedules enable row level security;
alter table show_state enable row level security;
alter table patron_polls enable row level security;
alter table patron_poll_options enable row level security;
alter table patron_votes enable row level security;

-- MVP starter policies: authenticated users can read most records.
create policy if not exists profiles_read on profiles for select to authenticated using (true);
create policy if not exists venues_read on venues for select to authenticated using (true);
create policy if not exists venue_members_read on venue_members for select to authenticated using (true);
create policy if not exists rooms_read on rooms for select to authenticated using (true);
create policy if not exists room_venues_read on room_venues for select to authenticated using (true);
create policy if not exists schedules_read on schedules for select to authenticated using (true);
create policy if not exists show_state_read on show_state for select to authenticated using (true);
create policy if not exists patron_polls_read on patron_polls for select using (true);
create policy if not exists patron_poll_options_read on patron_poll_options for select using (true);
create policy if not exists patron_votes_insert on patron_votes for insert using (true) with check (true);

-- Tighten these policies before production.
