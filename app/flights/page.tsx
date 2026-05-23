import { createClient } from '@/lib/supabase/server';
import { FlightCard } from '@/components/flights/FlightCard';
import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import type { Flight } from '@/types';

interface PageProps {
  searchParams: {
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
  };
}

export default async function FlightsPage({ searchParams }: PageProps) {
  const { origin, destination, date, passengers } = searchParams;
  const supabase = createClient();

  // Fetch available origins & destinations for the search form dropdowns
  const { data: routeData } = await supabase
    .from('flights')
    .select('origin, destination')
    .neq('status', 'cancelled');

  const origins = Array.from(new Set((routeData ?? []).map((f) => f.origin))).sort();
  const destinations = Array.from(new Set((routeData ?? []).map((f) => f.destination))).sort();

  let flights: Flight[] = [];
  let error = '';

  if (origin && destination && date) {
    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59`).toISOString();

    const { data, error: dbError } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .gte('departs_at', startOfDay)
      .lte('departs_at', endOfDay)
      .neq('status', 'cancelled')
      .order('departs_at', { ascending: true });

    if (dbError) error = dbError.message;
    else flights = (data as Flight[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Compact search */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {origin && destination
            ? `Flights from ${origin} to ${destination}`
            : 'Search Flights'}
        </h1>
        <div className="md:hidden">
          <details className="card">
            <summary className="p-4 font-medium cursor-pointer">Modify Search</summary>
            <div className="p-4 pt-0">
              <FlightSearchForm origins={origins} destinations={destinations} />
            </div>
          </details>
        </div>
        <div className="hidden md:block">
          <FlightSearchForm origins={origins} destinations={destinations} />
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
          Error loading flights: {error}
        </div>
      )}

      {origin && destination && date && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            {flights.length > 0
              ? `${flights.length} flight${flights.length > 1 ? 's' : ''} found`
              : 'No flights found for this route and date'}
          </p>
          <p className="text-gray-500 text-xs">{passengers ?? '1'} passenger(s)</p>
        </div>
      )}

      {flights.length > 0 ? (
        <div className="space-y-4">
          {flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              passengerCount={parseInt(passengers ?? '1')}
            />
          ))}
        </div>
      ) : origin && destination && date && !error ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No flights available</h3>
          <p className="text-gray-500 text-sm">Try a different date or route.</p>
        </div>
      ) : null}
    </div>
  );
}
