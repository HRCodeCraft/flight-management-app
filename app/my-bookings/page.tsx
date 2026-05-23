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
    .select(`*, flight:flights(*), seat:seats(*), passengers(*)`)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* Page header */}
      <div className="pt-20 pb-8 px-4"
        style={{ background: 'linear-gradient(135deg, #080d1f 0%, #0f172a 50%, #1e3a8a 100%)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">My Bookings</h1>
              <p className="text-white/50 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 mb-6">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Error loading bookings: {error.message}
          </div>
        )}
        <BookingsList bookings={(bookings as Booking[]) ?? []} />
      </div>
    </div>
  );
}
