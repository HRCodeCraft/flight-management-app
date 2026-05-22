-- ============================================================
-- Migration 003: RPC functions
-- ============================================================

-- ── reserve_seat: atomic seat lock with race-condition protection ──
-- Locks the seat row, checks availability, then creates the booking.
-- Returns the new booking id or raises an exception.
create or replace function public.reserve_seat(
  p_user_id     uuid,
  p_flight_id   uuid,
  p_seat_id     uuid,
  p_total_price numeric,
  p_pnr_code    text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
  v_seat_available boolean;
begin
  -- Lock the seat row to prevent concurrent reservations
  select is_available into v_seat_available
  from public.seats
  where id = p_seat_id
    and flight_id = p_flight_id
  for update;

  if v_seat_available is null then
    raise exception 'Seat not found';
  end if;

  if not v_seat_available then
    raise exception 'Seat is no longer available';
  end if;

  -- Mark seat as unavailable
  update public.seats
  set is_available = false
  where id = p_seat_id;

  -- Create booking
  insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code)
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- ── cancel_booking: atomic cancellation with 2-hour departure rule ──
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_user_id    uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_flight_departs_at timestamptz;
  v_seat_id           uuid;
  v_booking_user_id   uuid;
begin
  -- Fetch booking info and lock
  select b.user_id, b.seat_id, f.departs_at
  into v_booking_user_id, v_seat_id, v_flight_departs_at
  from public.bookings b
  join public.flights f on f.id = b.flight_id
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking_user_id <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  -- Enforce 2-hour cancellation window
  if v_flight_departs_at - now() < interval '2 hours' then
    raise exception 'Cannot cancel within 2 hours of departure';
  end if;

  -- Cancel the booking and free the seat atomically
  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.seats
  set is_available = true
  where id = v_seat_id;
end;
$$;

-- ── reschedule_booking: move booking to new flight ──────────────
create or replace function public.reschedule_booking(
  p_booking_id    uuid,
  p_user_id       uuid,
  p_new_flight_id uuid,
  p_new_seat_id   uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_flight_id  uuid;
  v_old_seat_id    uuid;
  v_booking_user_id uuid;
  v_old_price      numeric;
  v_new_price      numeric;
  v_fee            numeric := 0;
begin
  -- Lock booking row
  select b.user_id, b.flight_id, b.seat_id, b.total_price
  into v_booking_user_id, v_old_flight_id, v_old_seat_id, v_old_price
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking_user_id <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  -- Lock new seat
  perform id from public.seats
  where id = p_new_seat_id
    and flight_id = p_new_flight_id
    and is_available = true
  for update;

  if not found then
    raise exception 'New seat is not available';
  end if;

  -- Calculate price difference as fee
  select base_price into v_new_price from public.flights where id = p_new_flight_id;
  if v_new_price > v_old_price then
    v_fee := v_new_price - v_old_price;
  end if;

  -- Free old seat
  update public.seats set is_available = true where id = v_old_seat_id;

  -- Reserve new seat
  update public.seats set is_available = false where id = p_new_seat_id;

  -- Update booking
  update public.bookings
  set flight_id = p_new_flight_id,
      seat_id = p_new_seat_id,
      status = 'rescheduled',
      total_price = v_old_price + v_fee
  where id = p_booking_id;

  -- Record reschedule
  insert into public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  values (p_booking_id, v_old_flight_id, p_new_flight_id, v_fee);
end;
$$;

-- DB-level trigger to block cancellations within 2 hours at row level
create or replace function public.check_cancellation_window()
returns trigger
language plpgsql
as $$
declare
  v_departs_at timestamptz;
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    select departs_at into v_departs_at
    from public.flights
    where id = new.flight_id;

    if v_departs_at - now() < interval '2 hours' then
      raise exception 'Cannot cancel a booking within 2 hours of departure';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_cancellation_window
  before update on public.bookings
  for each row
  execute function public.check_cancellation_window();
