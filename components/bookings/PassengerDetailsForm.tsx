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

      // Call the atomic seat reservation RPC
      const { data: bookingId, error: rpcError } = await supabase.rpc('reserve_seat', {
        p_user_id: user.id,
        p_flight_id: flight.id,
        p_seat_id: selectedSeat.id,
        p_total_price: totalPrice,
        p_pnr_code: pnr,
      });

      if (rpcError) throw new Error(rpcError.message);

      // Insert passenger record
      const { error: passengerError } = await supabase.from('passengers').insert({
        booking_id: bookingId,
        full_name: form.full_name,
        passport_no: form.passport_no,
        nationality: form.nationality,
        dob: form.dob,
      });

      if (passengerError) throw new Error(passengerError.message);

      // Store form data in memory only (not persisted — contains passport)
      setPassengerData(form);

      resetBooking();
      router.push(`/confirmation/${bookingId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price summary */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>Seat {selectedSeat.seat_number} ({selectedSeat.class})</span>
            <span>{formatPrice(flight.base_price)}</span>
          </div>
          {selectedSeat.extra_fee > 0 && (
            <div className="flex justify-between">
              <span>Class upgrade fee</span>
              <span>+{formatPrice(selectedSeat.extra_fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-1 border-t border-blue-200 text-blue-900">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Passenger form */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Passenger Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="input"
            placeholder="As on passport"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
          <input
            type="text"
            required
            value={form.passport_no}
            onChange={(e) => handleChange('passport_no', e.target.value.toUpperCase())}
            className="input"
            placeholder="e.g. A1234567"
            pattern="[A-Z0-9]{6,9}"
            title="6-9 alphanumeric characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          ← Back
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
          {loading ? 'Confirming Booking…' : `Confirm & Pay ${formatPrice(totalPrice)}`}
        </button>
      </div>

      {!user && (
        <p className="text-center text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
          You&apos;ll be asked to log in before confirming.
        </p>
      )}
    </form>
  );
}
