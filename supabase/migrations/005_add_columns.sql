-- ============================================================
-- Migration 005: Add pets_allowed to flights, passenger_type to passengers
-- ============================================================

-- Add pets_allowed flag to flights
ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;

-- Add passenger_type to passengers (adult / senior)
ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS passenger_type TEXT DEFAULT 'adult'
    CHECK (passenger_type IN ('adult', 'senior'));

-- Mark some existing flights as pet-friendly
UPDATE public.flights
SET pets_allowed = true
WHERE flight_no IN ('SK102', 'SK202', 'SK302', 'SK402');
