'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/useUserStore';
import { useFlightStore } from '@/store/useFlightStore';

export function Navbar() {
  const router = useRouter();
  const { user, setUser, setSession, resetUser } = useUserStore();
  const resetAll = useFlightStore((s) => s.resetAll);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [setUser, setSession]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetUser();
    resetAll();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            SkyBook
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-blue-200 transition-colors">Search</Link>
            {user && (
              <Link href="/my-bookings" className="hover:text-blue-200 transition-colors">My Bookings</Link>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-lg border border-blue-400 px-3 py-1.5 hover:bg-blue-600 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-blue-200 transition-colors">Login</Link>
                <Link href="/auth/signup" className="rounded-lg bg-white text-blue-700 px-3 py-1.5 font-semibold hover:bg-blue-50 transition-colors">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 flex flex-col gap-3 text-sm font-medium border-t border-blue-600 pt-3">
            <Link href="/" className="hover:text-blue-200" onClick={() => setMenuOpen(false)}>Search Flights</Link>
            {user && (
              <Link href="/my-bookings" className="hover:text-blue-200" onClick={() => setMenuOpen(false)}>My Bookings</Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="text-left hover:text-blue-200">Sign Out</button>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-blue-200" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link href="/auth/signup" className="hover:text-blue-200" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
