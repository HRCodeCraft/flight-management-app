import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PassengerDetailsForm } from '@/components/bookings/PassengerDetailsForm';
import type { Flight, Seat } from '@/types';

interface PageProps {
  params: { flightId: string };
}

export default async function BookingDetailsPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', params.flightId)
    .single();

  if (!flight) return notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Passenger Details</h1>
      <p className="text-gray-500 text-sm mb-6">
        Flight {(flight as Flight).flight_no} · {(flight as Flight).origin} → {(flight as Flight).destination}
      </p>

      <PassengerDetailsForm flight={flight as Flight} />
    </div>
  );
}
