-- ============================================================
-- Migration 001: Create all tables
-- ============================================================

create extension if not exists "pgcrypto";

-- flights
create table public.flights (
  id            uuid primary key default gen_random_uuid(),
  flight_no     text not null unique,
  origin        text not null,
  destination   text not null,
  departs_at    timestamptz not null,
  arrives_at    timestamptz not null,
  aircraft_type text not null default 'Boeing 737',
  status        text not null default 'scheduled'
                  check (status in ('scheduled','delayed','cancelled','departed','arrived')),
  base_price    numeric(10,2) not null check (base_price > 0)
);

-- seats
create table public.seats (
  id            uuid primary key default gen_random_uuid(),
  flight_id     uuid not null references public.flights(id) on delete cascade,
  seat_number   text not null,
  class         text not null check (class in ('economy','business','first')),
  is_available  boolean not null default true,
  extra_fee     numeric(10,2) not null default 0,
  unique (flight_id, seat_number)
);

-- bookings
create table public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  flight_id   uuid not null references public.flights(id),
  seat_id     uuid not null references public.seats(id),
  status      text not null default 'confirmed'
                check (status in ('confirmed','rescheduled','cancelled')),
  booked_at   timestamptz not null default now(),
  total_price numeric(10,2) not null,
  pnr_code    text not null unique
);

-- passengers
create table public.passengers (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  full_name    text not null,
  passport_no  text not null,
  nationality  text not null,
  dob          date not null
);

-- reschedules
create table public.reschedules (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings(id) on delete cascade,
  old_flight_id  uuid not null references public.flights(id),
  new_flight_id  uuid not null references public.flights(id),
  requested_at   timestamptz not null default now(),
  fee_charged    numeric(10,2) not null default 0
);

-- indexes for performance
create index idx_flights_origin_dest_date on public.flights(origin, destination, departs_at);
create index idx_seats_flight_id on public.seats(flight_id);
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_bookings_flight_id on public.bookings(flight_id);
create index idx_passengers_booking_id on public.passengers(booking_id);
