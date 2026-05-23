'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import { useUserStore } from '@/store/useUserStore';
import type { Flight, PassengerFormData } from '@/types';
import { formatPrice, generatePNR } from '@/lib/utils';

interface Props {
  flight: Flight;
}

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Australian', 'Canadian',
  'German', 'French', 'Japanese', 'Chinese', 'Other',
];

export function PassengerDetailsForm({ flight }: Props) {
  const router = useRouter();
  const { selectedSeat, setPassengerData, resetBooking } = useFlightStore();
  const { user } = useUserStore();

  const [form, setForm] = useState<PassengerFormData>({
    full_name: '',
    passport_no: '',
    nationality: 'Indian',
    dob: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedSeat) {
    router.replace(`/booking/${flight.id}/seats`);
    return null;
  }

  const totalPrice = flight.base_price + (selectedSeat?.extra_fee ?? 0);

  function handleChange(field: keyof PassengerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?redirect=/booking/${flight.id}/details`);
      return;
    }
    if (!selectedSeat) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const pnr = generatePNR();

      const { data: bookingId, error: rpcError } = await supabase.rpc('reserve_seat', {
        p_user_id: user.id,
        p_flight_id: flight.id,
        p_seat_id: selectedSeat.id,
        p_total_price: totalPrice,
        p_pnr_code: pnr,
      });

      if (rpcError) throw new Error(rpcError.message);

      const { error: passengerError } = await supabase.from('passengers').insert({
        booking_id: bookingId,
        full_name: form.full_name,
        passport_no: form.passport_no,
        nationality: form.nationality,
        dob: form.dob,
      });

      if (passengerError) throw new Error(passengerError.message);

      setPassengerData(form);
      resetBooking();
      router.push(`/confirmation/${bookingId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Price summary card */}
      <div className="rounded-3xl overflow-hidden shadow-ticket">
        {/* Header */}
        <div className="px-6 py-4 text-white"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Booking Summary</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{flight.origin} → {flight.destination}</p>
              <p className="text-white/50 text-xs mt-0.5">{flight.flight_no} · Seat {selectedSeat.seat_number}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">{formatPrice(totalPrice)}</p>
              {selectedSeat.extra_fee > 0 && (
                <p className="text-white/50 text-xs">incl. +{formatPrice(selectedSeat.extra_fee)} upgrade</p>
              )}
            </div>
          </div>
        </div>

        {/* Tear line */}
        <div className="relative flex items-center bg-white">
          <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
          <div className="absolute -right-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
        </div>

        {/* Price breakdown */}
        <div className="bg-white px-6 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Base fare</span>
              <span className="font-semibold">{formatPrice(flight.base_price)}</span>
            </div>
            {selectedSeat.extra_fee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="capitalize">{selectedSeat.class} class upgrade</span>
                <span className="font-semibold">+{formatPrice(selectedSeat.extra_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-base">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger form */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-black text-slate-900">Passenger Information</h2>
            <p className="text-xs text-slate-400">Must match your travel document</p>
          </div>
        </div>

        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="input"
            placeholder="As it appears on your passport"
          />
        </div>

        <div>
          <label className="label">Passport Number</label>
          <input
            type="text"
            required
            value={form.passport_no}
            onChange={(e) => handleChange('passport_no', e.target.value.toUpperCase())}
            className="input font-mono tracking-widest"
            placeholder="e.g. A1234567"
            pattern="[A-Z0-9]{6,9}"
            title="6-9 alphanumeric characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nationality</label>
            <select
              value={form.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              className="input"
            >
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              required
              value={form.dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {!user && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          You&apos;ll be asked to sign in before your booking is confirmed.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 py-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Confirming Booking…
            </span>
          ) : `Confirm & Pay ${formatPrice(totalPrice)}`}
        </button>
      </div>
    </form>
  );
}
