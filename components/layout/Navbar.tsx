'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/useUserStore';
import { useFlightStore } from '@/store/useFlightStore';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setSession, resetUser } = useUserStore();
  const resetAll = useFlightStore((s) => s.resetAll);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isHome = pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isHome
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <span className={`font-extrabold text-lg tracking-tight transition-colors ${
              scrolled || !isHome ? 'text-slate-900' : 'text-white'
            }`}>
              Sky<span className="text-blue-400">Book</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                scrolled || !isHome
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Search
            </Link>
            {user && (
              <Link
                href="/my-bookings"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  scrolled || !isHome
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                My Bookings
              </Link>
            )}

            <div className="w-px h-4 bg-slate-300/50 mx-2" />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-blue-700 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    scrolled || !isHome
                      ? 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    scrolled || !isHome
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-blue-700 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-150"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`sm:hidden p-2 rounded-xl transition-colors ${
              scrolled || !isHome ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 animate-fade-in bg-white/95 backdrop-blur-md -mx-4 px-4 border-t border-slate-100">
            <div className="flex flex-col gap-1 pt-3">
              <Link href="/" className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Search Flights</Link>
              {user && <Link href="/my-bookings" className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>My Bookings</Link>}
              <div className="h-px bg-slate-100 my-1" />
              {user ? (
                <button onClick={handleLogout} className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left">Sign Out</button>
              ) : (
                <>
                  <Link href="/auth/login" className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/auth/signup" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
