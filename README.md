# SkyBook — Flight Management App

A fully responsive, production-grade flight management PWA built with **Next.js 14**, **Supabase**, **Zustand**, and **Tailwind CSS**.

## Live Demo

> Deploy to Vercel and add the URL here.

## Features

- **Flight Search** — search by origin, destination, date, and passenger count
- **Interactive Seat Map** — color-coded cabin grid with Supabase Realtime live updates
- **Booking Flow** — passenger details form → atomic seat reservation → PNR confirmation
- **My Bookings** — view all bookings with reschedule and cancel support
- **Rescheduling** — pick an alternative flight; fee charged if new price is higher
- **Cancellation** — blocked within 2 hours of departure (enforced at DB level + trigger)
- **PWA** — installable, offline-capable, StaleWhileRevalidate caching for flight results

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/flight-management-app
cd flight-management-app
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Once created, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local and paste your Supabase credentials
```

### 4. Run Supabase migrations

In Supabase Dashboard → **SQL Editor**, run each file in order:

```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
supabase/migrations/004_seed.sql
```

### 5. Enable Realtime on the seats table

Supabase Dashboard → **Database → Replication** → enable `seats` table.

### 6. Create a test user

Supabase Dashboard → **Authentication → Users** → Add User:
- Email: `test@skybook.com`
- Password: `testpass123`

> Or disable email confirmation in Auth → Settings → uncheck "Enable email confirmations"

### 7. Start the dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Supabase Configuration Summary

| Setting | Value |
|---|---|
| Realtime tables | `seats` (enable replication) |
| RLS | Enabled on all 5 tables |
| Email confirmation | Disable for local testing |

---

## Zustand Store Structure

### `useFlightStore` — booking flow state

| Field | Persisted | Notes |
|---|---|---|
| `searchQuery` | ✅ | Origin, destination, date, passenger count |
| `selectedFlight` | ✅ | Full flight object |
| `selectedSeat` | ✅ | Optimistic — set before Supabase write confirms |
| `currentStep` | ✅ | `search → results → seats → details → confirmation` |
| `passengerData` | ❌ | **Excluded** via `partialize` — passport numbers never hit localStorage |

`resetBooking()` is called after booking completion or cancellation.

### `useUserStore` — auth + cached data

| Field | Persisted | Notes |
|---|---|---|
| `session` | ✅ (tokens only) | `access_token` + `refresh_token` only |
| `cachedBookings` | ✅ | Enables offline My Bookings page |
| `user` | ❌ | Re-hydrated on mount from session |

`resetUser()` is called on logout (also triggers `resetAll` on flight store).

---

## Database Schema

```
flights      id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price
seats        id, flight_id, seat_number, class (economy/business/first), is_available, extra_fee
bookings     id, user_id, flight_id, seat_id, status, booked_at, total_price, pnr_code
passengers   id, booking_id, full_name, passport_no, nationality, dob
reschedules  id, booking_id, old_flight_id, new_flight_id, requested_at, fee_charged
```

### RPC Functions (in 003_functions.sql)

| Function | What it does |
|---|---|
| `reserve_seat` | `SELECT FOR UPDATE` on seat row → marks unavailable → inserts booking atomically |
| `cancel_booking` | Validates 2h window → cancels booking → frees seat atomically |
| `reschedule_booking` | Locks both seat rows → swaps flight/seat → records reschedule + fee |

A DB trigger `trg_check_cancellation_window` also enforces the 2-hour rule at the row level.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| State | Zustand 5 with persist + partialize |
| Styling | Tailwind CSS 3 |
| PWA | next-pwa 5 (Workbox) |
| Language | TypeScript (strict mode) |

---

## Test Credentials

| Email | Password |
|---|---|
| test@skybook.com | testpass123 |

---

## Deployment (Vercel)

```bash
npx vercel --prod
```

Add the same environment variables from `.env.local` in Vercel → Settings → Environment Variables.

Production URL: _add after deploying_
