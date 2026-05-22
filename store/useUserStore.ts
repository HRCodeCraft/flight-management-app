import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { Booking } from '@/types';

interface UserState {
  user: User | null;
  session: Session | null;
  cachedBookings: Booking[];

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  resetUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      cachedBookings: [],

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      resetUser: () =>
        set({
          user: null,
          session: null,
          cachedBookings: [],
        }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist session token and cached bookings for offline use
      partialize: (state) => ({
        session: state.session
          ? {
              access_token: state.session.access_token,
              refresh_token: state.session.refresh_token,
              expires_at: state.session.expires_at,
            }
          : null,
        cachedBookings: state.cachedBookings,
      }),
    }
  )
);
