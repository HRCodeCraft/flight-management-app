-- ============================================================
-- Migration 004: Seed data — 8 flights across 4 routes
-- ============================================================

do $$
declare
  -- flight IDs
  f1 uuid := gen_random_uuid();
  f2 uuid := gen_random_uuid();
  f3 uuid := gen_random_uuid();
  f4 uuid := gen_random_uuid();
  f5 uuid := gen_random_uuid();
  f6 uuid := gen_random_uuid();
  f7 uuid := gen_random_uuid();
  f8 uuid := gen_random_uuid();
begin

-- ── Insert flights ────────────────────────────────────────────
insert into public.flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
values
  -- Route 1: DEL → BOM
  (f1, 'SK101', 'DEL', 'BOM', now() + interval '1 day 6 hours',  now() + interval '1 day 8 hours 30 minutes',  'Boeing 737',   'scheduled', 3999),
  (f2, 'SK102', 'DEL', 'BOM', now() + interval '2 days 14 hours', now() + interval '2 days 16 hours 30 minutes', 'Airbus A320',  'scheduled', 4599),
  -- Route 2: BOM → BLR
  (f3, 'SK201', 'BOM', 'BLR', now() + interval '1 day 9 hours',  now() + interval '1 day 10 hours 30 minutes', 'Airbus A320',  'scheduled', 2999),
  (f4, 'SK202', 'BOM', 'BLR', now() + interval '3 days 16 hours', now() + interval '3 days 17 hours 30 minutes','Boeing 737',   'scheduled', 3299),
  -- Route 3: DEL → BLR
  (f5, 'SK301', 'DEL', 'BLR', now() + interval '1 day 7 hours',  now() + interval '1 day 9 hours 45 minutes', 'Airbus A321',  'scheduled', 5499),
  (f6, 'SK302', 'DEL', 'BLR', now() + interval '4 days 11 hours', now() + interval '4 days 13 hours 45 minutes','Boeing 777',   'scheduled', 5999),
  -- Route 4: BLR → HYD
  (f7, 'SK401', 'BLR', 'HYD', now() + interval '1 day 12 hours', now() + interval '1 day 13 hours',           'ATR 72',       'scheduled', 1999),
  (f8, 'SK402', 'BLR', 'HYD', now() + interval '5 days 8 hours', now() + interval '5 days 9 hours',           'Airbus A320',  'scheduled', 2199);

-- ── Seat map generator (runs for each flight) ────────────────
-- First class: rows 1-2, seats A-D (8 seats per flight)
-- Business:   rows 3-6, seats A-F (24 seats per flight)
-- Economy:    rows 7-30, seats A-F (144 seats per flight)

with flights_to_seed as (
  select id from public.flights
  where flight_no in ('SK101','SK102','SK201','SK202','SK301','SK302','SK401','SK402')
),
seat_defs as (
  -- First class
  select col.col_letter, row_num.r, 'first' as class, 3000 as extra_fee
  from generate_series(1,2) as row_num(r),
       unnest(array['A','B','C','D']) as col(col_letter)
  union all
  -- Business
  select col.col_letter, row_num.r, 'business', 1500
  from generate_series(3,6) as row_num(r),
       unnest(array['A','B','C','D','E','F']) as col(col_letter)
  union all
  -- Economy
  select col.col_letter, row_num.r, 'economy', 0
  from generate_series(7,30) as row_num(r),
       unnest(array['A','B','C','D','E','F']) as col(col_letter)
)
insert into public.seats (flight_id, seat_number, class, is_available, extra_fee)
select
  f.id,
  sd.r::text || sd.col_letter,
  sd.class,
  true,
  sd.extra_fee
from flights_to_seed f
cross join seat_defs sd;

end;
$$;
