import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SeatMap } from '@/components/seats/SeatMap';
import type { Flight, Seat } from '@/types';

interface PageProps {
  params: { flightId: string };
}

export default async function SeatsPage({ params }: PageProps) {
  const supabase = createClient();

  const [{ data: flight }, { data: seats }] = await Promise.all([
    supabase.from('flights').select('*').eq('id', params.flightId).single(),
    supabase
      .from('seats')
      .select('*')
      .eq('flight_id', params.flightId)
      .order('seat_number'),
  ]);

  if (!flight) return notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Select Your Seat</h1>
      <p className="text-gray-500 text-sm mb-6">
        Flight {(flight as Flight).flight_no} · {(flight as Flight).origin} → {(flight as Flight).destination}
      </p>

      <SeatMap
        flightId={params.flightId}
        initialSeats={(seats as Seat[]) ?? []}
        flight={flight as Flight}
      />
    </div>
  );
}
