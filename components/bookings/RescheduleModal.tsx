'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Booking, Flight, Seat } from '@/types';
import { formatDate, formatTime, formatDuration, formatPrice } from '@/lib/utils';

interface Props {
  booking: Booking;
  onSuccess: (updated: Booking) => void;
  onClose: () => void;
}

export function RescheduleModal({ booking, onSuccess, onClose }: Props) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentFlight = booking.flight!;

  // Load alternative flights on same route
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('flights')
      .select('*')
      .eq('origin', currentFlight.origin)
      .eq('destination', currentFlight.destination)
      .neq('id', currentFlight.id)
      .neq('status', 'cancelled')
      .gt('departs_at', new Date().toISOString())
      .order('departs_at')
      .then(({ data }) => setFlights((data as Flight[]) ?? []));
  }, [currentFlight.id, currentFlight.origin, currentFlight.destination]);

  // Load seats when flight selected
  useEffect(() => {
    if (!selectedFlight) { setSeats([]); return; }
    const supabase = createClient();
    supabase
      .from('seats')
      .select('*')
      .eq('flight_id', selectedFlight.id)
      .eq('is_available', true)
      .order('seat_number')
      .then(({ data }) => setSeats((data as Seat[]) ?? []));
  }, [selectedFlight]);

  async function handleReschedule() {
    if (!selectedFlight || !selectedSeat) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: rpcError } = await supabase.rpc('reschedule_booking', {
      p_booking_id: booking.id,
      p_user_id: user.id,
      p_new_flight_id: selectedFlight.id,
      p_new_seat_id: selectedSeat.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    onSuccess({
      ...booking,
      flight_id: selectedFlight.id,
      seat_id: selectedSeat.id,
      status: 'rescheduled',
      flight: selectedFlight,
      seat: selectedSeat,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Reschedule Booking</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-800">
            Current: <strong>{currentFlight.flight_no}</strong> · {formatDate(currentFlight.departs_at)}
          </div>

          {/* Step 1: Choose flight */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">1. Choose a new flight</h3>
            {flights.length === 0 ? (
              <p className="text-gray-400 text-sm">No alternative flights available on this route.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {flights.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFlight(f); setSelectedSeat(null); }}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all text-sm ${
                      selectedFlight?.id === f.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{f.flight_no}</span>
                      <span className="font-bold text-blue-700">{formatPrice(f.base_price)}</span>
                    </div>
                    <div className="text-gray-500">
                      {formatTime(f.departs_at)} → {formatTime(f.arrives_at)} · {formatDuration(f.departs_at, f.arrives_at)}
                    </div>
                    <div className="text-gray-400 text-xs">{formatDate(f.departs_at)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Choose seat */}
          {selectedFlight && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">2. Choose a seat</h3>
              {seats.length === 0 ? (
                <p className="text-gray-400 text-sm">No seats available.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
                  {seats.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeat(s)}
                      className={`rounded-lg border-2 p-2 text-xs font-semibold transition-all capitalize ${
                        selectedSeat?.id === s.id
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : s.class === 'first'
                          ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
                          : s.class === 'business'
                          ? 'border-purple-300 bg-purple-50 text-purple-800'
                          : 'border-blue-200 bg-blue-50 text-blue-800'
                      }`}
                    >
                      {s.seat_number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fee notice */}
          {selectedFlight && selectedSeat && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">
              {selectedFlight.base_price > currentFlight.base_price
                ? `Price difference fee: ${formatPrice(selectedFlight.base_price - currentFlight.base_price)}`
                : 'No additional fee for this flight'}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleReschedule}
              disabled={!selectedFlight || !selectedSeat || loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Rescheduling…' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
