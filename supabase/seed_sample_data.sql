-- Replace placeholder UUIDs with real Supabase Auth user ids.

insert into profiles (id, role, display_name, email, active)
values
  ('00000000-0000-0000-0000-000000000001', 'moderator', 'Main Moderator', 'moderator@example.com', true),
  ('00000000-0000-0000-0000-000000000002', 'venue_owner', 'KC Owner', 'kc.owner@example.com', true),
  ('00000000-0000-0000-0000-000000000003', 'venue_owner', 'Miami Owner', 'miami.owner@example.com', true)
on conflict (id) do nothing;

insert into venues (slug, name, city, active, owner_profile_id)
values
  ('kc-nightclub', 'KC Nightclub', 'Kansas City', true, '00000000-0000-0000-0000-000000000002'),
  ('miami-club', 'Miami Club', 'Miami', true, '00000000-0000-0000-0000-000000000003')
on conflict (slug) do nothing;

insert into venue_members (venue_id, profile_id, access_level, active)
select v.id, '00000000-0000-0000-0000-000000000002', 'owner', true
from venues v
where v.slug = 'kc-nightclub'
on conflict (venue_id, profile_id) do nothing;

insert into venue_members (venue_id, profile_id, access_level, active)
select v.id, '00000000-0000-0000-0000-000000000003', 'owner', true
from venues v
where v.slug = 'miami-club'
on conflict (venue_id, profile_id) do nothing;

insert into rooms (slug, title, notes, is_active, created_by)
values
  ('central-battle-room', 'Central Battle Room', 'Main city battle room', true, '00000000-0000-0000-0000-000000000001')
on conflict (slug) do nothing;

insert into room_venues (room_id, venue_id, role, sort_order)
select r.id, v.id, 'participant', 1
from rooms r
join venues v on v.slug = 'kc-nightclub'
where r.slug = 'central-battle-room'
on conflict (room_id, venue_id) do nothing;

insert into room_venues (room_id, venue_id, role, sort_order)
select r.id, v.id, 'participant', 2
from rooms r
join venues v on v.slug = 'miami-club'
where r.slug = 'central-battle-room'
on conflict (room_id, venue_id) do nothing;

insert into show_state (
  room_id, current_segment, current_round, portal_open, timer_running, remaining_seconds, event_type
)
select r.id, 'Pre-Show', 'Round 1', false, false, 60, 'City Battle'
from rooms r
where r.slug = 'central-battle-room'
on conflict (room_id) do nothing;
