import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatTime, formatPrice, formatDuration } from '@/lib/utils';
import { AIRPORTS } from '@/types';

interface PageProps {
  params: { bookingId: string };
}

function getCity(code: string) {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights(*),
      seat:seats(*),
      passengers(*)
    `)
    .eq('id', params.bookingId)
    .single();

  if (!booking) return notFound();

  const flight = booking.flight;
  const seat = booking.seat;
  const passenger = booking.passengers?.[0];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-500 mt-2">Your flight is booked. Have a great trip!</p>
      </div>

      {/* PNR card */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-blue-700 to-blue-900 text-white text-center">
        <p className="text-blue-200 text-sm uppercase tracking-widest mb-1">PNR Code</p>
        <p className="text-5xl font-black tracking-widest">{booking.pnr_code}</p>
        <p className="text-blue-200 text-xs mt-2">Keep this code for check-in</p>
      </div>

      {/* Flight details */}
      {flight && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Flight Details</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{formatTime(flight.departs_at)}</p>
              <p className="text-lg font-semibold text-blue-700">{flight.origin}</p>
              <p className="text-sm text-gray-400">{getCity(flight.origin)}</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <p className="text-xs text-gray-400">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
              <div className="flex items-center gap-1 w-24">
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              </div>
              <p className="text-xs text-gray-400">{flight.flight_no}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{formatTime(flight.arrives_at)}</p>
              <p className="text-lg font-semibold text-blue-700">{flight.destination}</p>
              <p className="text-sm text-gray-400">{getCity(flight.destination)}</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm text-gray-500 pt-3 border-t border-gray-100">
            <span>{formatDate(flight.departs_at)}</span>
            <span>·</span>
            <span>{flight.aircraft_type}</span>
          </div>
        </div>
      )}

      {/* Seat & Passenger */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {seat && (
          <div className="card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Your Seat</h3>
            <p className="text-2xl font-bold text-gray-900">{seat.seat_number}</p>
            <p className="text-sm capitalize text-gray-500">{seat.class} Class</p>
          </div>
        )}
        {passenger && (
          <div className="card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Passenger</h3>
            <p className="font-semibold text-gray-900">{passenger.full_name}</p>
            <p className="text-sm text-gray-500">{passenger.nationality}</p>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="card p-4 mb-6 flex justify-between items-center">
        <span className="font-medium text-gray-700">Total Paid</span>
        <span className="text-2xl font-extrabold text-blue-700">{formatPrice(booking.total_price)}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/my-bookings" className="btn-primary text-center flex-1">
          View My Bookings
        </Link>
        <Link href="/" className="btn-secondary text-center flex-1">
          Search Another Flight
        </Link>
      </div>
    </div>
  );
}
