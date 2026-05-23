-- ============================================================
-- Migration 006: Extended seed — 35 more flights (today + coming days)
-- Covers 10 routes, multiple daily departures, pets_allowed mix
-- ============================================================

do $$
declare
  -- today flights (depart in 2-10 hours from NOW)
  t01 uuid := gen_random_uuid(); t02 uuid := gen_random_uuid(); t03 uuid := gen_random_uuid();
  t04 uuid := gen_random_uuid(); t05 uuid := gen_random_uuid(); t06 uuid := gen_random_uuid();
  t07 uuid := gen_random_uuid(); t08 uuid := gen_random_uuid(); t09 uuid := gen_random_uuid();
  t10 uuid := gen_random_uuid(); t11 uuid := gen_random_uuid(); t12 uuid := gen_random_uuid();

  -- tomorrow flights
  m01 uuid := gen_random_uuid(); m02 uuid := gen_random_uuid(); m03 uuid := gen_random_uuid();
  m04 uuid := gen_random_uuid(); m05 uuid := gen_random_uuid(); m06 uuid := gen_random_uuid();
  m07 uuid := gen_random_uuid(); m08 uuid := gen_random_uuid(); m09 uuid := gen_random_uuid();
  m10 uuid := gen_random_uuid(); m11 uuid := gen_random_uuid(); m12 uuid := gen_random_uuid();

  -- day-after-tomorrow flights
  d01 uuid := gen_random_uuid(); d02 uuid := gen_random_uuid(); d03 uuid := gen_random_uuid();
  d04 uuid := gen_random_uuid(); d05 uuid := gen_random_uuid(); d06 uuid := gen_random_uuid();
  d07 uuid := gen_random_uuid(); d08 uuid := gen_random_uuid(); d09 uuid := gen_random_uuid();
  d10 uuid := gen_random_uuid(); d11 uuid := gen_random_uuid();

begin

-- ── TODAY'S FLIGHTS ──────────────────────────────────────────────────────────
-- (depart 2–11 hours from now so they appear when searching today)
insert into public.flights
  (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, pets_allowed)
values
  -- DEL → BOM  (today, 3 departures)
  (t01,'SK103','DEL','BOM', now()+interval'3 hours',  now()+interval'5 hours 30 minutes', 'Airbus A320','scheduled',3799, false),
  (t02,'SK104','DEL','BOM', now()+interval'6 hours',  now()+interval'8 hours 30 minutes', 'Boeing 737', 'scheduled',4199, true),
  (t03,'SK105','DEL','BOM', now()+interval'9 hours',  now()+interval'11 hours 30 minutes','Airbus A321','scheduled',3499, false),

  -- BOM → DEL  (return route, today, 2 departures)
  (t04,'SK151','BOM','DEL', now()+interval'2 hours',  now()+interval'4 hours 30 minutes', 'Boeing 737', 'scheduled',3899, false),
  (t05,'SK152','BOM','DEL', now()+interval'7 hours',  now()+interval'9 hours 30 minutes', 'Airbus A320','scheduled',4099, true),

  -- BOM → BLR  (today, 2 departures)
  (t06,'SK203','BOM','BLR', now()+interval'4 hours',  now()+interval'5 hours 30 minutes', 'Airbus A320','scheduled',2799, false),
  (t07,'SK204','BOM','BLR', now()+interval'8 hours',  now()+interval'9 hours 30 minutes', 'Boeing 737', 'scheduled',3099, true),

  -- DEL → BLR  (today, 2 departures)
  (t08,'SK303','DEL','BLR', now()+interval'3 hours 30 minutes', now()+interval'6 hours 15 minutes', 'Boeing 777',  'scheduled',5299, false),
  (t09,'SK304','DEL','BLR', now()+interval'10 hours', now()+interval'12 hours 45 minutes','Airbus A321','scheduled',4899, true),

  -- BLR → HYD  (today, 2 departures)
  (t10,'SK403','BLR','HYD', now()+interval'2 hours 30 minutes', now()+interval'3 hours 30 minutes', 'ATR 72',    'scheduled',1799, false),
  (t11,'SK404','BLR','HYD', now()+interval'5 hours',  now()+interval'6 hours',             'Airbus A320','scheduled',2099, true),

  -- DEL → MAA  (new route, today)
  (t12,'SK501','DEL','MAA', now()+interval'4 hours',  now()+interval'6 hours 30 minutes', 'Boeing 737', 'scheduled',5199, false);

-- ── TOMORROW'S FLIGHTS ───────────────────────────────────────────────────────
insert into public.flights
  (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, pets_allowed)
values
  -- DEL → BOM  (tomorrow, 3 times)
  (m01,'SK106','DEL','BOM', now()+interval'1 day 5 hours',  now()+interval'1 day 7 hours 30 minutes', 'Airbus A320','scheduled',3999, false),
  (m02,'SK107','DEL','BOM', now()+interval'1 day 12 hours', now()+interval'1 day 14 hours 30 minutes','Boeing 737', 'scheduled',4299, true),
  (m03,'SK108','DEL','BOM', now()+interval'1 day 19 hours', now()+interval'1 day 21 hours 30 minutes','Airbus A321','delayed',  3699, false),

  -- BOM → DEL  (tomorrow, 2 times)
  (m04,'SK153','BOM','DEL', now()+interval'1 day 7 hours',  now()+interval'1 day 9 hours 30 minutes', 'Boeing 737', 'scheduled',4199, true),
  (m05,'SK154','BOM','DEL', now()+interval'1 day 16 hours', now()+interval'1 day 18 hours 30 minutes','Airbus A320','scheduled',3899, false),

  -- BOM → BLR  (tomorrow, 2 times)
  (m06,'SK205','BOM','BLR', now()+interval'1 day 8 hours',  now()+interval'1 day 9 hours 30 minutes', 'Airbus A320','scheduled',2999, false),
  (m07,'SK206','BOM','BLR', now()+interval'1 day 17 hours', now()+interval'1 day 18 hours 30 minutes','Boeing 737', 'scheduled',3399, true),

  -- DEL → BLR  (tomorrow, 2 times)
  (m08,'SK305','DEL','BLR', now()+interval'1 day 6 hours',  now()+interval'1 day 8 hours 45 minutes', 'Boeing 777', 'scheduled',5499, false),
  (m09,'SK306','DEL','BLR', now()+interval'1 day 14 hours', now()+interval'1 day 16 hours 45 minutes','Airbus A321','scheduled',5099, true),

  -- BLR → HYD  (tomorrow, 2 times)
  (m10,'SK405','BLR','HYD', now()+interval'1 day 9 hours',  now()+interval'1 day 10 hours',           'ATR 72',    'scheduled',1999, false),
  (m11,'SK406','BLR','HYD', now()+interval'1 day 18 hours', now()+interval'1 day 19 hours',           'Airbus A320','scheduled',2299, true),

  -- DEL → MAA  (tomorrow)
  (m12,'SK502','DEL','MAA', now()+interval'1 day 10 hours', now()+interval'1 day 12 hours 30 minutes','Airbus A321','scheduled',5399, true);

-- ── DAY-AFTER-TOMORROW FLIGHTS ────────────────────────────────────────────────
insert into public.flights
  (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, pets_allowed)
values
  -- DEL → BOM
  (d01,'SK109','DEL','BOM', now()+interval'2 days 7 hours',  now()+interval'2 days 9 hours 30 minutes', 'Boeing 737','scheduled',4499, false),
  (d02,'SK110','DEL','BOM', now()+interval'2 days 15 hours', now()+interval'2 days 17 hours 30 minutes','Airbus A320','scheduled',3899, true),

  -- BOM → DEL
  (d03,'SK155','BOM','DEL', now()+interval'2 days 9 hours',  now()+interval'2 days 11 hours 30 minutes','Boeing 737','scheduled',4299, false),

  -- BOM → BLR
  (d04,'SK207','BOM','BLR', now()+interval'2 days 11 hours', now()+interval'2 days 12 hours 30 minutes','Airbus A320','scheduled',2799, false),
  (d05,'SK208','BOM','BLR', now()+interval'2 days 19 hours', now()+interval'2 days 20 hours 30 minutes','Boeing 737','scheduled',3199, true),

  -- DEL → BLR
  (d06,'SK307','DEL','BLR', now()+interval'2 days 8 hours',  now()+interval'2 days 10 hours 45 minutes','Airbus A321','scheduled',5199, false),

  -- BLR → HYD
  (d07,'SK407','BLR','HYD', now()+interval'2 days 10 hours', now()+interval'2 days 11 hours',           'ATR 72','scheduled',1899, true),

  -- DEL → MAA  (2 times)
  (d08,'SK503','DEL','MAA', now()+interval'2 days 6 hours',  now()+interval'2 days 8 hours 30 minutes', 'Boeing 777','scheduled',5699, false),
  (d09,'SK504','DEL','MAA', now()+interval'2 days 14 hours', now()+interval'2 days 16 hours 30 minutes','Airbus A320','scheduled',4999, true),

  -- BOM → HYD  (new route)
  (d10,'SK601','BOM','HYD', now()+interval'2 days 7 hours',  now()+interval'2 days 9 hours',            'Airbus A320','scheduled',3299, false),

  -- HYD → DEL  (new return route)
  (d11,'SK701','HYD','DEL', now()+interval'2 days 12 hours', now()+interval'2 days 15 hours',           'Boeing 737','scheduled',4799, true);

-- ── SEAT MAPS FOR ALL NEW FLIGHTS ────────────────────────────────────────────
with new_flights as (
  select id from public.flights
  where flight_no in (
    'SK103','SK104','SK105',
    'SK151','SK152',
    'SK203','SK204',
    'SK303','SK304',
    'SK403','SK404',
    'SK501',
    'SK106','SK107','SK108',
    'SK153','SK154',
    'SK205','SK206',
    'SK305','SK306',
    'SK405','SK406',
    'SK502',
    'SK109','SK110',
    'SK155',
    'SK207','SK208',
    'SK307',
    'SK407',
    'SK503','SK504',
    'SK601',
    'SK701'
  )
  and not exists (
    -- skip if seats already generated
    select 1 from public.seats s where s.flight_id = flights.id limit 1
  )
),
seat_defs as (
  -- First class (rows 1-2, cols A-D)
  select col_letter, r, 'first' as class, 3000 as extra_fee
  from generate_series(1,2) as rn(r),
       unnest(array['A','B','C','D']) as cl(col_letter)
  union all
  -- Business (rows 3-6, cols A-F)
  select col_letter, r, 'business', 1500
  from generate_series(3,6) as rn(r),
       unnest(array['A','B','C','D','E','F']) as cl(col_letter)
  union all
  -- Economy (rows 7-30, cols A-F)
  select col_letter, r, 'economy', 0
  from generate_series(7,30) as rn(r),
       unnest(array['A','B','C','D','E','F']) as cl(col_letter)
)
insert into public.seats (flight_id, seat_number, class, is_available, extra_fee)
select
  f.id,
  sd.r::text || sd.col_letter,
  sd.class,
  true,
  sd.extra_fee
from new_flights f
cross join seat_defs sd;

end;
$$;
