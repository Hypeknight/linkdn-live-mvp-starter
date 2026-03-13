alter table profiles enable row level security;
alter table venues enable row level security;
alter table venue_members enable row level security;

drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read
on profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_self_insert on profiles;
create policy profiles_self_insert
on profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update
on profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists venues_read_auth on venues;
create policy venues_read_auth
on venues
for select
to authenticated
using (true);

drop policy if exists venue_members_read_auth on venue_members;
create policy venue_members_read_auth
on venue_members
for select
to authenticated
using (true);
