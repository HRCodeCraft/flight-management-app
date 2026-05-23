'use client';

import { useRouter } from 'next/navigation';
import { useFlightStore } from '@/store/useFlightStore';
import type { Flight } from '@/types';
import { formatTime, formatDuration, formatPrice } from '@/lib/utils';
import { AIRPORTS } from '@/types';

interface Props {
  flight: Flight;
  passengerCount: number;
  adultCount?: number;
  seniorCount?: number;
}

function getAirportCity(code: string) {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delayed:   'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  departed:  'bg-blue-50 text-blue-700 border-blue-200',
  arrived:   'bg-slate-50 text-slate-600 border-slate-200',
};

const SENIOR_DISCOUNT = 0.10;

export function FlightCard({ flight, passengerCount, adultCount = passengerCount, seniorCount = 0 }: Props) {
  const router = useRouter();
  const { setSelectedFlight, setCurrentStep } = useFlightStore();

  function handleSelect() {
    setSelectedFlight(flight);
    setCurrentStep('seats');
    router.push(`/booking/${flight.id}/seats`);
  }

  const adultTotal  = adultCount * flight.base_price;
  const seniorTotal = seniorCount * Math.round(flight.base_price * (1 - SENIOR_DISCOUNT));
  const grandTotal  = adultTotal + seniorTotal;
  const hasSeniors  = seniorCount > 0;
  const duration    = formatDuration(flight.departs_at, flight.arrives_at);

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
            <div className="text-left min-w-[64px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{formatTime(flight.departs_at)}</p>
              <p className="text-base font-bold text-blue-600">{flight.origin}</p>
              <p className="text-xs text-slate-400 truncate max-w-[80px]">{getAirportCity(flight.origin)}</p>
            </div>

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

            <div className="text-right min-w-[64px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{formatTime(flight.arrives_at)}</p>
              <p className="text-base font-bold text-purple-600">{flight.destination}</p>
              <p className="text-xs text-slate-400 truncate max-w-[80px] text-right">{getAirportCity(flight.destination)}</p>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:text-right gap-3 sm:min-w-[140px] shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div>
              {hasSeniors ? (
                <>
                  <p className="text-xs text-slate-400 font-medium">from</p>
                  <p className="text-2xl font-black text-slate-900">{formatPrice(flight.base_price)}</p>
                  <p className="text-xs text-emerald-600 font-semibold">
                    Senior: {formatPrice(Math.round(flight.base_price * (1 - SENIOR_DISCOUNT)))}
                  </p>
                  {(passengerCount > 1) && (
                    <p className="text-xs text-slate-500">Total: {formatPrice(grandTotal)}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400 font-medium">from / person</p>
                  <p className="text-2xl font-black text-slate-900">{formatPrice(flight.base_price)}</p>
                  {passengerCount > 1 && (
                    <p className="text-xs text-slate-500">Total: {formatPrice(grandTotal)}</p>
                  )}
                </>
              )}
            </div>
            <button onClick={handleSelect} className="btn-primary whitespace-nowrap shrink-0 group-hover:shadow-glow">
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
          <span className="badge bg-blue-50 text-blue-600 border border-blue-200 text-xs">Economy</span>
          <span className="badge bg-purple-50 text-purple-600 border border-purple-200 text-xs">Business</span>
          <span className="badge bg-amber-50 text-amber-600 border border-amber-200 text-xs">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            First Class
          </span>
          {hasSeniors && (
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Senior 10% off
            </span>
          )}
          {flight.pets_allowed && (
            <span className="badge bg-teal-50 text-teal-700 border border-teal-200 text-xs">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.5 5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm7 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM2 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm13 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM6 14.5c0-2.485 1.79-4.5 4-4.5s4 2.015 4 4.5v.5H6v-.5z"/>
              </svg>
              Pets OK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
