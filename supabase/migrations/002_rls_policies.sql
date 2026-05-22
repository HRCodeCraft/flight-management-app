-- ============================================================
-- Migration 002: Row Level Security policies
-- ============================================================

-- Enable RLS on all tables
alter table public.flights    enable row level security;
alter table public.seats      enable row level security;
alter table public.bookings   enable row level security;
alter table public.passengers enable row level security;
alter table public.reschedules enable row level security;

-- ── flights: anyone can read flights ──────────────────────────
create policy "flights_select_all"
  on public.flights for select
  using (true);

-- ── seats: anyone can read seats ──────────────────────────────
create policy "seats_select_all"
  on public.seats for select
  using (true);

-- seats availability is updated only via RPC (service role), not directly
create policy "seats_update_via_service_role"
  on public.seats for update
  using (auth.role() = 'service_role');

-- ── bookings ──────────────────────────────────────────────────
create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id);

-- ── passengers ────────────────────────────────────────────────
create policy "passengers_select_own"
  on public.passengers for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "passengers_insert_own"
  on public.passengers for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
    )
  );

-- ── reschedules ───────────────────────────────────────────────
create policy "reschedules_select_own"
  on public.reschedules for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "reschedules_insert_own"
  on public.reschedules for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
    )
  );
