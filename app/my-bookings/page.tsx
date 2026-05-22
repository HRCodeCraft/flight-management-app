import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookingsList } from '@/components/bookings/BookingsList';
import type { Booking } from '@/types';

export default async function MyBookingsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/my-bookings');

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights(*),
      seat:seats(*),
      passengers(*)
    `)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
          Error loading bookings: {error.message}
        </div>
      )}

      <BookingsList bookings={(bookings as Booking[]) ?? []} />
    </div>
  );
}
