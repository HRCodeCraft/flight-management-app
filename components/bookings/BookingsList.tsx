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

export function BookingsList({ bookings: initialBookings }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null,
  });
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
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    }
    setLoading(null);
    setCancelDialog({ open: false, bookingId: null });
  }

  function handleRescheduleSuccess(updatedBooking: Booking) {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b))
    );
    setRescheduleBooking(null);
    router.refresh();
  }

  if (bookings.length === 0) {
    return (
      <div className="card p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings yet</h3>
        <p className="text-gray-500 text-sm mb-4">Book your first flight and it will appear here.</p>
        <Link href="/" className="btn-primary">Search Flights</Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((booking) => {
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
            <div
              key={booking.id}
              className={`card p-5 ${isCancelled ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  {/* PNR & status */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono font-bold text-lg text-gray-900">{booking.pnr_code}</span>
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  </div>

                  {/* Flight */}
                  {flight && (
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-xl font-bold">{formatTime(flight.departs_at)}</p>
                        <p className="text-sm font-semibold text-blue-700">{flight.origin}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-1 max-w-[80px]">
                        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                        <svg className="w-3 h-3 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{formatTime(flight.arrives_at)}</p>
                        <p className="text-sm font-semibold text-blue-700">{flight.destination}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {flight && <span>{formatDate(flight.departs_at)}</span>}
                    {flight && <span>{formatDuration(flight.departs_at, flight.arrives_at)}</span>}
                    {seat && <span>Seat {seat.seat_number} · <span className="capitalize">{seat.class}</span></span>}
                    {passenger && <span>Passenger: {passenger.full_name}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xl font-extrabold text-blue-700">{formatPrice(booking.total_price)}</p>

                  {!isCancelled && (
                    <div className="flex gap-2">
                      {flight && (
                        <button
                          onClick={() => setRescheduleBooking(booking)}
                          disabled={isLoading}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Reschedule
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setCancelDialog({ open: true, bookingId: booking.id })}
                          disabled={isLoading}
                          className="btn-danger text-xs px-3 py-1.5"
                        >
                          {isLoading ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                      {!canCancel && !isCancelled && (
                        <span className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                          Within 2h — no cancel
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Yes, Cancel Booking"
        confirmVariant="danger"
        onConfirm={() => cancelDialog.bookingId && handleCancel(cancelDialog.bookingId)}
        onCancel={() => setCancelDialog({ open: false, bookingId: null })}
      />

      {/* Reschedule modal */}
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
