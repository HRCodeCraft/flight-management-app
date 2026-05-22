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

export function FlightCard({ flight, passengerCount }: Props) {
  const router = useRouter();
  const { setSelectedFlight, setCurrentStep } = useFlightStore();

  function handleSelect() {
    setSelectedFlight(flight);
    setCurrentStep('seats');
    router.push(`/booking/${flight.id}/seats`);
  }

  const totalPrice = flight.base_price * passengerCount;

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Flight info */}
        <div className="flex items-center gap-6">
          {/* Departure */}
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-gray-900">{formatTime(flight.departs_at)}</p>
            <p className="text-sm font-semibold text-blue-700">{flight.origin}</p>
            <p className="text-xs text-gray-400">{getAirportCity(flight.origin)}</p>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center flex-1 min-w-[80px]">
            <p className="text-xs text-gray-400 mb-1">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
            <div className="relative w-full flex items-center">
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              <svg className="w-4 h-4 text-blue-500 mx-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
            </div>
            <p className="text-xs text-gray-400 mt-1">{flight.flight_no}</p>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-gray-900">{formatTime(flight.arrives_at)}</p>
            <p className="text-sm font-semibold text-blue-700">{flight.destination}</p>
            <p className="text-xs text-gray-400">{getAirportCity(flight.destination)}</p>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[140px]">
          <div className="text-right">
            <p className="text-xs text-gray-400">from</p>
            <p className="text-2xl font-extrabold text-blue-700">{formatPrice(flight.base_price)}</p>
            {passengerCount > 1 && (
              <p className="text-xs text-gray-400">Total: {formatPrice(totalPrice)}</p>
            )}
          </div>
          <button onClick={handleSelect} className="btn-primary whitespace-nowrap">
            Select Flight
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="badge badge-scheduled">{flight.status}</span>
        <span className="badge bg-gray-100 text-gray-600">{flight.aircraft_type}</span>
        <span className="badge bg-purple-100 text-purple-700">Economy · Business · First</span>
      </div>
    </div>
  );
}
