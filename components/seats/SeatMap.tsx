'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import type { Seat, Flight, SeatClass } from '@/types';
import { formatPrice, formatTime, formatDate } from '@/lib/utils';

interface Props {
  flightId: string;
  initialSeats: Seat[];
  flight: Flight;
}

const CLASS_ORDER: SeatClass[] = ['first', 'business', 'economy'];

const CLASS_CONFIG: Record<SeatClass, { label: string; available: string; selected: string; badge: string }> = {
  first:    { label: 'First Class',  available: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-500', selected: 'border-amber-500 bg-amber-400 text-white shadow-lg scale-110',    badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  business: { label: 'Business',     available: 'border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 hover:border-purple-500', selected: 'border-purple-600 bg-purple-500 text-white shadow-lg scale-110', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  economy:  { label: 'Economy',      available: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 hover:border-blue-400', selected: 'border-blue-600 bg-blue-500 text-white shadow-lg scale-110',              badge: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const COLS = ['A', 'B', 'C', '', 'D', 'E', 'F'];

export function SeatMap({ flightId, initialSeats, flight }: Props) {
  const router = useRouter();
  const { selectedSeat, setSelectedSeat, setCurrentStep } = useFlightStore();
  const [seats, setSeats] = useState<Map<string, Seat>>(
    new Map(initialSeats.map((s) => [s.id, s]))
  );
  const [tooltip, setTooltip] = useState<{ seat: Seat; x: number; y: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${flightId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seats',
        filter: `flight_id=eq.${flightId}`,
      }, (payload) => {
        const updated = payload.new as Seat;
        setSeats((prev) => {
          const next = new Map(prev);
          next.set(updated.id, updated);
          if (!updated.is_available && selectedSeat?.id === updated.id) {
            setSelectedSeat(null);
          }
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [flightId, selectedSeat, setSelectedSeat]);

  const seatList = Array.from(seats.values());

  function getSeatsByClass(cls: SeatClass) {
    const classSeats = seatList.filter((s) => s.class === cls);
    const rows = Array.from(new Set(classSeats.map((s) => parseInt(s.seat_number)))).sort((a, b) => a - b);
    return rows.map((row) => ({
      row,
      seats: COLS.map((col) => {
        if (!col) return null;
        return classSeats.find((s) => s.seat_number === `${row}${col}`) ?? null;
      }),
    }));
  }

  function getSeatStyle(seat: Seat): string {
    const base = 'w-8 h-8 rounded-t-lg border-2 text-[10px] font-bold flex items-center justify-center cursor-pointer select-none transition-all duration-150';
    if (!seat.is_available) return `${base} bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed`;
    if (selectedSeat?.id === seat.id) return `${base} ${CLASS_CONFIG[seat.class].selected}`;
    return `${base} ${CLASS_CONFIG[seat.class].available}`;
  }

  function handleSeatClick(seat: Seat) {
    if (!seat.is_available) return;
    setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);
    setTooltip(null);
  }

  function handleContinue() {
    if (!selectedSeat) return;
    setCurrentStep('details');
    router.push(`/booking/${flightId}/details`);
  }

  const totalAvailable = seatList.filter((s) => s.is_available).length;
  const totalPrice = selectedSeat ? flight.base_price + selectedSeat.extra_fee : null;

  return (
    <div className="space-y-5">
      {/* Flight info strip */}
      <div className="rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-black">{flight.origin}</p>
              <p className="text-white/50 text-xs">{formatTime(flight.departs_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-white/30" />
              <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="w-6 h-px bg-white/30" />
            </div>
            <div>
              <p className="text-2xl font-black">{flight.destination}</p>
              <p className="text-white/50 text-xs">{formatTime(flight.arrives_at)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">{formatDate(flight.departs_at)}</p>
            <p className="text-xs text-white/50 mt-0.5">{flight.flight_no}</p>
            <div className="mt-1 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">{totalAvailable} seats left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cabin Legend</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-t-md bg-slate-200 border-2 border-slate-300" />
            <span className="text-slate-500">Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-t-md bg-amber-400 border-2 border-amber-500" />
            <span className="text-slate-600">First (+{formatPrice(3000)})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-t-md bg-purple-500 border-2 border-purple-600" />
            <span className="text-slate-600">Business (+{formatPrice(1500)})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-t-md bg-blue-50 border-2 border-blue-200" />
            <span className="text-slate-600">Economy</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-t-md bg-blue-500 border-2 border-blue-600" />
            <span className="text-slate-600">Selected</span>
          </div>
        </div>
      </div>

      {/* Seat map */}
      <div className="card overflow-hidden">
        {/* Cockpit nose */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-slate-200" />
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z"/>
            </svg>
            Front of cabin
          </div>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[55vh] p-4 sm:p-6">
          {/* Column headers */}
          <div className="flex items-center gap-1 mb-3 pl-10">
            {COLS.map((col, i) => (
              <div key={i} className="w-8 text-center text-xs font-bold text-slate-400">
                {col}
              </div>
            ))}
          </div>

          {CLASS_ORDER.map((cls) => {
            const rows = getSeatsByClass(cls);
            if (rows.length === 0) return null;
            const cfg = CLASS_CONFIG[cls];
            return (
              <div key={cls} className="mb-6">
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-3 px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                  {cls === 'first' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  )}
                  {cfg.label}
                </div>
                <div className="space-y-1.5">
                  {rows.map(({ row, seats: rowSeats }) => (
                    <div key={row} className="flex items-center gap-1">
                      <span className="w-8 text-xs text-slate-300 text-right pr-2 shrink-0 tabular-nums">{row}</span>
                      {rowSeats.map((seat, idx) => {
                        if (!seat) return <div key={`aisle-${idx}`} className="w-8 h-8" />;
                        return (
                          <div
                            key={seat.id}
                            className={getSeatStyle(seat)}
                            onClick={() => handleSeatClick(seat)}
                            onMouseEnter={(e) => setTooltip({ seat, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {seat.seat_number.replace(/\d+/, '')}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tail */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Rear of cabin</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl bg-slate-900/95 backdrop-blur-sm text-white text-xs px-4 py-3 shadow-xl border border-white/10"
          style={{ left: tooltip.x + 14, top: tooltip.y - 60 }}>
          <p className="font-black text-sm mb-0.5">{tooltip.seat.seat_number}</p>
          <p className="text-white/60 capitalize">{tooltip.seat.class}</p>
          {tooltip.seat.extra_fee > 0 && (
            <p className="text-amber-400 font-semibold">+{formatPrice(tooltip.seat.extra_fee)}</p>
          )}
          {!tooltip.seat.is_available && (
            <p className="text-red-400 font-semibold mt-0.5">Occupied</p>
          )}
        </div>
      )}

      {/* Selection CTA — sticky */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl shadow-glow border border-white/80 overflow-hidden">
          {selectedSeat ? (
            <div className="bg-white px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  {selectedSeat.seat_number}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Seat {selectedSeat.seat_number}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {selectedSeat.class} · {formatPrice(totalPrice ?? 0)} total
                  </p>
                </div>
              </div>
              <button onClick={handleContinue} className="btn-primary shrink-0">
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="bg-white px-5 py-4 flex items-center justify-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
              </svg>
              <span className="text-sm font-medium">Tap a seat to select it</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
