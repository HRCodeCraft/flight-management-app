'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Booking } from '@/types';
import { formatDate, formatTime, formatPrice, formatDuration } from '@/lib/utils';
import { RescheduleModal } from './RescheduleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  bookings: Booking[];
}

const STATUS_BADGE: Record<string, string> = {
  confirmed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled:   'bg-red-50 text-red-600 border-red-200',
};

export function BookingsList({ bookings: initialBookings }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCancel(bookingId: string) {
    setLoading(bookingId);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: rpcError } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
    }
    setLoading(null);
    setCancelDialog({ open: false, bookingId: null });
  }

  function handleRescheduleSuccess(updatedBooking: Booking) {
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b)));
    setRescheduleBooking(null);
    router.refresh();
  }

  if (bookings.length === 0) {
    return (
      <div className="card p-16 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">No bookings yet</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Book your first flight and it will appear here with your boarding pass.</p>
        <Link href="/" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          Search Flights
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-5">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
          <button className="ml-auto text-xs underline opacity-70 hover:opacity-100" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="space-y-5">
        {bookings.map((booking, idx) => {
          const flight = booking.flight;
          const seat = booking.seat;
          const passenger = booking.passengers?.[0];
          const isCancelled = booking.status === 'cancelled';
          const isLoading = loading === booking.id;

          const canCancel =
            !isCancelled &&
            flight &&
            new Date(flight.departs_at).getTime() - Date.now() > 2 * 60 * 60 * 1000;

          return (
            <div key={booking.id} className={`shadow-ticket rounded-3xl overflow-hidden animate-fade-up ${isCancelled ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${idx * 0.06}s` }}>

              {/* Boarding pass header */}
              <div className="p-5 sm:p-6 text-white relative overflow-hidden"
                style={{ background: isCancelled
                  ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                <div className="relative flex items-start justify-between gap-4">
                  {/* Route */}
                  {flight ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div>
                        <p className="text-3xl font-black tracking-tight">{flight.origin}</p>
                        <p className="text-white/50 text-xs mt-0.5">{formatTime(flight.departs_at)}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2">
                        <p className="text-xs text-white/40 mb-1">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
                        <div className="flex items-center gap-1.5 w-full">
                          <div className="flex-1 h-px bg-white/20" />
                          <svg className="w-4 h-4 text-white/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                          </svg>
                          <div className="flex-1 h-px bg-white/20" />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Non-stop</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black tracking-tight">{flight.destination}</p>
                        <p className="text-white/50 text-xs mt-0.5">{formatTime(flight.arrives_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">Flight details unavailable</p>
                  )}

                  {/* Status badge */}
                  <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_BADGE[booking.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Tear line */}
              <div className="relative flex items-center bg-white">
                <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
                <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
                <div className="absolute -right-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
              </div>

              {/* Booking body */}
              <div className="bg-white px-5 sm:px-6 py-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {flight && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="font-bold text-slate-900 text-sm">{formatDate(flight.departs_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flight</p>
                        <p className="font-bold text-slate-900 text-sm">{flight.flight_no}</p>
                        <p className="text-xs text-slate-400">{flight.aircraft_type}</p>
                      </div>
                    </>
                  )}
                  {seat && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seat</p>
                      <p className="font-bold text-slate-900 text-sm">{seat.seat_number}</p>
                      <p className="text-xs text-slate-400 capitalize">{seat.class}</p>
                    </div>
                  )}
                  {passenger && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Passenger</p>
                      <p className="font-bold text-slate-900 text-sm truncate">{passenger.full_name}</p>
                      <p className="text-xs text-slate-400">{passenger.nationality}</p>
                    </div>
                  )}
                </div>

                {/* PNR row */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">PNR</p>
                    <p className="font-black text-lg tracking-[0.15em] text-blue-700 font-mono">{booking.pnr_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Total Paid</p>
                    <p className="text-xl font-black text-slate-900">{formatPrice(booking.total_price)}</p>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              {!isCancelled && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 sm:px-6 py-3 flex items-center justify-end gap-2">
                  {!canCancel && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mr-auto">
                      Within 2h — cancellation locked
                    </span>
                  )}
                  {flight && (
                    <button
                      onClick={() => setRescheduleBooking(booking)}
                      disabled={isLoading}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Reschedule
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => setCancelDialog({ open: true, bookingId: booking.id })}
                      disabled={isLoading}
                      className="btn-danger text-xs px-4 py-2"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Cancelling…
                        </span>
                      ) : 'Cancel'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={cancelDialog.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Yes, Cancel Booking"
        confirmVariant="danger"
        onConfirm={() => cancelDialog.bookingId && handleCancel(cancelDialog.bookingId)}
        onCancel={() => setCancelDialog({ open: false, bookingId: null })}
      />

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onSuccess={handleRescheduleSuccess}
          onClose={() => setRescheduleBooking(null)}
        />
      )}
    </>
  );
}
