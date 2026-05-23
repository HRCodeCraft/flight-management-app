'use client';

import { useRouter } from 'next/navigation';
import { useFlightStore } from '@/store/useFlightStore';
import type { Flight } from '@/types';
import { formatTime, formatDuration, formatPrice } from '@/lib/utils';
import { AIRPORTS } from '@/types';

interface Props {
  flight: Flight;
  passengerCount: number;
}

function getAirportCity(code: string) {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delayed: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  departed: 'bg-blue-50 text-blue-700 border-blue-200',
  arrived: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function FlightCard({ flight, passengerCount }: Props) {
  const router = useRouter();
  const { setSelectedFlight, setCurrentStep } = useFlightStore();

  function handleSelect() {
    setSelectedFlight(flight);
    setCurrentStep('seats');
    router.push(`/booking/${flight.id}/seats`);
  }

  const totalPrice = flight.base_price * passengerCount;
  const duration = formatDuration(flight.departs_at, flight.arrives_at);

  return (
    <div className="card-hover overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Airline info */}
          <div className="flex items-center gap-3 sm:w-28 shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              {flight.flight_no.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{flight.flight_no}</p>
              <p className="text-xs text-slate-400">{flight.aircraft_type}</p>
            </div>
          </div>

          {/* Route timeline */}
          <div className="flex-1 flex items-center gap-3">
            {/* Departure */}
            <div className="text-left min-w-[64px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{formatTime(flight.departs_at)}</p>
              <p className="text-base font-bold text-blue-600">{flight.origin}</p>
              <p className="text-xs text-slate-400 truncate max-w-[80px]">{getAirportCity(flight.origin)}</p>
            </div>

            {/* Timeline */}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-[60px]">
              <span className="text-xs font-semibold text-slate-400">{duration}</span>
              <div className="relative w-full flex items-center gap-1">
                <div className="w-2 h-2 rounded-full border-2 border-blue-400 bg-white shrink-0" />
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-200" />
                <svg className="w-5 h-5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-200" />
                <div className="w-2 h-2 rounded-full border-2 border-purple-400 bg-white shrink-0" />
              </div>
              <span className="text-xs text-slate-400">Non-stop</span>
            </div>

            {/* Arrival */}
            <div className="text-right min-w-[64px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{formatTime(flight.arrives_at)}</p>
              <p className="text-base font-bold text-purple-600">{flight.destination}</p>
              <p className="text-xs text-slate-400 truncate max-w-[80px] text-right">{getAirportCity(flight.destination)}</p>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:text-right gap-3 sm:min-w-[130px] shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium">from / person</p>
              <p className="text-2xl font-black text-slate-900">{formatPrice(flight.base_price)}</p>
              {passengerCount > 1 && (
                <p className="text-xs text-slate-500">Total: {formatPrice(totalPrice)}</p>
              )}
            </div>
            <button
              onClick={handleSelect}
              className="btn-primary whitespace-nowrap shrink-0 group-hover:shadow-glow"
            >
              Select
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Footer tags */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
          <span className={`badge border text-xs ${STATUS_STYLES[flight.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
          </span>
          <span className="badge bg-slate-50 text-slate-500 border border-slate-200 text-xs">Economy</span>
          <span className="badge bg-purple-50 text-purple-600 border border-purple-200 text-xs">Business</span>
          <span className="badge bg-amber-50 text-amber-600 border border-amber-200 text-xs">First Class</span>
        </div>
      </div>
    </div>
  );
}
