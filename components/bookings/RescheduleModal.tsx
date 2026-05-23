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

  const seatClassStyle = (s: Seat, selected: boolean) => {
    if (selected) return 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300';
    if (s.class === 'first') return 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400';
    if (s.class === 'business') return 'border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-400';
    return 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-fade-up">
        {/* Modal header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Reschedule Flight</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose a new flight on the same route</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6 space-y-5">
          {/* Current flight */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current flight</p>
              <p className="font-bold text-slate-900 text-sm">
                {currentFlight.flight_no} · {currentFlight.origin} → {currentFlight.destination}
              </p>
              <p className="text-xs text-slate-500">{formatDate(currentFlight.departs_at)}</p>
            </div>
          </div>

          {/* Step 1 */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              1. Choose a new flight
            </p>
            {flights.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No alternative flights available on this route.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {flights.map((f) => (
                  <button key={f.id}
                    onClick={() => { setSelectedFlight(f); setSelectedSeat(null); }}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      selectedFlight?.id === f.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-slate-900 text-sm">{f.flight_no}</span>
                      <span className="font-black text-blue-600 text-sm">{formatPrice(f.base_price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <span>{formatTime(f.departs_at)}</span>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                      </svg>
                      <span>{formatTime(f.arrives_at)}</span>
                      <span className="text-slate-400">&middot; {formatDuration(f.departs_at, f.arrives_at)}</span>
                      <span className="text-slate-400 ml-auto">{formatDate(f.departs_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 */}
          {selectedFlight && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                2. Choose a seat
              </p>
              {seats.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No seats available on this flight.</p>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto">
                  {seats.map((s) => (
                    <button key={s.id} onClick={() => setSelectedSeat(s)}
                      className={`rounded-xl border-2 p-2 text-xs font-bold transition-all capitalize ${seatClassStyle(s, selectedSeat?.id === s.id)}`}
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
            <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm ${
              selectedFlight.base_price > currentFlight.base_price
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {selectedFlight.base_price > currentFlight.base_price
                ? `Price difference: ${formatPrice(selectedFlight.base_price - currentFlight.base_price)}`
                : 'No additional fee for this flight'}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleReschedule}
            disabled={!selectedFlight || !selectedSeat || loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Rescheduling…
              </span>
            ) : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
