import { createClient } from '@/lib/supabase/server';
import { FlightCard } from '@/components/flights/FlightCard';
import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import { AIRPORTS } from '@/types';
import type { Flight } from '@/types';

interface PageProps {
  searchParams: {
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
    adults?: string;
    seniors?: string;
  };
}

function getCity(code: string) {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

export default async function FlightsPage({ searchParams }: PageProps) {
  const { origin, destination, date, passengers, adults, seniors } = searchParams;
  const supabase = createClient();

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

  const hasSearch = !!(origin && destination && date);
  const passengerCount = parseInt(passengers ?? '1');
  const adultCount  = parseInt(adults  ?? String(passengerCount));
  const seniorCount = parseInt(seniors ?? '0');

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* Search header */}
      <div className="pt-20 pb-8 px-4"
        style={{ background: 'linear-gradient(135deg, #080d1f 0%, #0f172a 50%, #1e3a8a 100%)' }}>
        <div className="mx-auto max-w-4xl">
          {hasSearch && (
            <div className="text-center mb-6 animate-fade-up">
              <div className="inline-flex items-center gap-3 text-white">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">{getCity(origin!)}</span>
                <div className="flex items-center gap-2 text-white/50">
                  <div className="w-8 h-px bg-white/30" />
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                  <div className="w-8 h-px bg-white/30" />
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight">{getCity(destination!)}</span>
              </div>
              <p className="text-white/50 text-sm mt-1">
                {date} &middot; {adultCount} adult{adultCount !== 1 ? 's' : ''}
                {seniorCount > 0 && ` · ${seniorCount} senior${seniorCount > 1 ? 's' : ''}`}
              </p>
            </div>
          )}
          {!hasSearch && (
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-white mb-1">Search Flights</h1>
              <p className="text-white/50 text-sm">Find the best route for your journey</p>
            </div>
          )}
          <FlightSearchForm origins={origins} destinations={destinations} />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 mb-6">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Error loading flights: {error}
          </div>
        )}

        {hasSearch && (
          <div className="flex items-center justify-between mb-5">
            <div>
              {flights.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black">
                    {flights.length}
                  </span>
                  <span className="text-slate-700 font-semibold">
                    flight{flights.length > 1 ? 's' : ''} available
                  </span>
                </div>
              ) : !error ? (
                <p className="text-slate-500 font-medium">No flights on this date</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {passengerCount} pax
            </div>
          </div>
        )}

        {flights.length > 0 ? (
          <div className="space-y-4 animate-fade-up">
            {flights.map((flight, i) => (
              <div key={flight.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <FlightCard
                  flight={flight}
                  passengerCount={passengerCount}
                  adultCount={adultCount}
                  seniorCount={seniorCount}
                />
              </div>
            ))}
          </div>
        ) : hasSearch && !error ? (
          <div className="card p-16 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No flights available</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              No flights found for this route on the selected date. Try a different date or route.
            </p>
          </div>
        ) : !hasSearch ? (
          <div className="card p-16 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Search for a flight above</h3>
            <p className="text-slate-400 text-sm">Choose your origin, destination, and travel date to see available flights.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
