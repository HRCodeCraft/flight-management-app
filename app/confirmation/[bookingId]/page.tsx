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
    .select(`*, flight:flights(*), seat:seats(*), passengers(*)`)
    .eq('id', params.bookingId)
    .single();

  if (!booking) return notFound();

  const flight = booking.flight;
  const seat = booking.seat;
  const passenger = booking.passengers?.[0];

  return (
    <div className="min-h-screen bg-[#f0f4ff] pt-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">

        {/* Success header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500">Your e-ticket is ready. Have a wonderful journey!</p>
        </div>

        {/* Boarding Pass Card */}
        <div className="animate-fade-up stagger-1 shadow-ticket rounded-3xl overflow-hidden mb-6">
          {/* Header */}
          <div className="p-6 sm:p-8 text-white"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <span className="font-black text-lg tracking-tight">SkyBook</span>
              </div>
              <span className="text-xs text-white/50 uppercase tracking-widest">Boarding Pass</span>
            </div>

            {/* Route */}
            {flight && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-4xl sm:text-5xl font-black tracking-tight">{flight.origin}</p>
                  <p className="text-white/60 text-sm mt-1">{getCity(flight.origin)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-white/40 mb-2">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 h-px bg-white/20" />
                    <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                  <p className="text-xs text-white/40 mt-2">Non-stop</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl sm:text-5xl font-black tracking-tight">{flight.destination}</p>
                  <p className="text-white/60 text-sm mt-1">{getCity(flight.destination)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ticket tear line */}
          <div className="relative flex items-center bg-white">
            <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
            <div className="absolute -right-4 w-8 h-8 rounded-full bg-[#f0f4ff]" />
          </div>

          {/* Ticket body */}
          <div className="bg-white px-6 sm:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
              {flight && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Departure</p>
                    <p className="font-black text-slate-900 text-lg">{formatTime(flight.departs_at)}</p>
                    <p className="text-xs text-slate-500">{formatDate(flight.departs_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Arrival</p>
                    <p className="font-black text-slate-900 text-lg">{formatTime(flight.arrives_at)}</p>
                    <p className="text-xs text-slate-500">{formatDate(flight.arrives_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flight</p>
                    <p className="font-black text-slate-900 text-lg">{flight.flight_no}</p>
                    <p className="text-xs text-slate-500">{flight.aircraft_type}</p>
                  </div>
                </>
              )}
              {seat && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seat</p>
                  <p className="font-black text-slate-900 text-lg">{seat.seat_number}</p>
                  <p className="text-xs text-slate-500 capitalize">{seat.class}</p>
                </div>
              )}
            </div>

            {passenger && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Passenger</p>
                <p className="font-bold text-slate-900">{passenger.full_name}</p>
                <p className="text-xs text-slate-500">{passenger.nationality}</p>
              </div>
            )}

            {/* PNR */}
            <div className="text-center p-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">PNR / Booking Reference</p>
              <p className="text-4xl font-black tracking-[0.25em] text-blue-700 font-mono">{booking.pnr_code}</p>
              <p className="text-xs text-blue-400 mt-2">Present this code at check-in</p>
            </div>
          </div>

          {/* Price footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-8 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Total Paid</span>
            <span className="text-2xl font-black text-slate-900">{formatPrice(booking.total_price)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-up stagger-2">
          <Link href="/my-bookings" className="btn-primary flex-1 justify-center py-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            My Bookings
          </Link>
          <Link href="/" className="btn-secondary flex-1 justify-center py-3">
            Book Another Flight
          </Link>
        </div>
      </div>
    </div>
  );
}
