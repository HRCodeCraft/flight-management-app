'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import type { Seat, Flight, SeatClass } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  flightId: string;
  initialSeats: Seat[];
  flight: Flight;
}

const CLASS_ORDER: SeatClass[] = ['first', 'business', 'economy'];
const CLASS_LABELS: Record<SeatClass, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
};
const CLASS_COLORS: Record<SeatClass, string> = {
  first: 'bg-yellow-100 border-yellow-400',
  business: 'bg-purple-100 border-purple-400',
  economy: 'bg-blue-50 border-blue-300',
};

const COLS = ['A', 'B', 'C', '', 'D', 'E', 'F'];

export function SeatMap({ flightId, initialSeats, flight }: Props) {
  const router = useRouter();
  const { selectedSeat, setSelectedSeat, setCurrentStep } = useFlightStore();
  const [seats, setSeats] = useState<Map<string, Seat>>(
    new Map(initialSeats.map((s) => [s.id, s]))
  );
  const [tooltip, setTooltip] = useState<{ seat: Seat; x: number; y: number } | null>(null);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const updated = payload.new as Seat;
          setSeats((prev) => {
            const next = new Map(prev);
            next.set(updated.id, updated);
            // If the user had this seat selected and it became unavailable, deselect
            if (!updated.is_available && selectedSeat?.id === updated.id) {
              setSelectedSeat(null);
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, selectedSeat, setSelectedSeat]);

  const seatList = Array.from(seats.values());

  // Group by class then by row
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

  function handleSeatClick(seat: Seat, e: React.MouseEvent) {
    if (!seat.is_available) return;
    // Optimistic selection
    setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);
    setTooltip(null);
  }

  function getSeatStyle(seat: Seat | null): string {
    if (!seat) return 'invisible w-8 h-8';
    const base = 'w-8 h-8 rounded-t-lg border-2 text-xs font-semibold flex items-center justify-center cursor-pointer select-none transition-all';
    if (!seat.is_available) {
      return `${base} bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-70`;
    }
    if (selectedSeat?.id === seat.id) {
      return `${base} bg-green-500 border-green-700 text-white scale-110 shadow-lg`;
    }
    const cls = CLASS_COLORS[seat.class];
    return `${base} ${cls} hover:scale-110 hover:shadow-md`;
  }

  function handleContinue() {
    if (!selectedSeat) return;
    setCurrentStep('details');
    router.push(`/booking/${flightId}/details`);
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md bg-gray-300 border-2 border-gray-400" />
            <span className="text-gray-600">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md bg-green-500 border-2 border-green-700" />
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md bg-yellow-100 border-2 border-yellow-400" />
            <span className="text-gray-600">First (+{formatPrice(3000)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md bg-purple-100 border-2 border-purple-400" />
            <span className="text-gray-600">Business (+{formatPrice(1500)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md bg-blue-50 border-2 border-blue-300" />
            <span className="text-gray-600">Economy</span>
          </div>
        </div>
      </div>

      {/* Seat map */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] p-4 sm:p-6">
          {/* Column headers */}
          <div className="flex items-center gap-1 mb-3 pl-10">
            {COLS.map((col, i) => (
              <div key={i} className="w-8 text-center text-xs font-bold text-gray-500">
                {col}
              </div>
            ))}
          </div>

          {CLASS_ORDER.map((cls) => {
            const rows = getSeatsByClass(cls);
            if (rows.length === 0) return null;
            return (
              <div key={cls} className="mb-6">
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 py-1 rounded inline-block ${CLASS_COLORS[cls]}`}>
                  {CLASS_LABELS[cls]}
                </div>
                <div className="space-y-1">
                  {rows.map(({ row, seats: rowSeats }) => (
                    <div key={row} className="flex items-center gap-1">
                      {/* Row number */}
                      <span className="w-8 text-xs text-gray-400 text-right pr-2 shrink-0">{row}</span>
                      {rowSeats.map((seat, idx) => {
                        if (!seat) {
                          // Aisle
                          return <div key={`aisle-${idx}`} className="w-8 h-8" />;
                        }
                        return (
                          <div
                            key={seat.id}
                            className={getSeatStyle(seat)}
                            onClick={(e) => handleSeatClick(seat, e)}
                            onMouseEnter={(e) =>
                              setTooltip({ seat, x: e.clientX, y: e.clientY })
                            }
                            onMouseLeave={() => setTooltip(null)}
                            title={`${seat.seat_number} · ${seat.class}${seat.extra_fee > 0 ? ` · +${formatPrice(seat.extra_fee)}` : ''}${!seat.is_available ? ' · Occupied' : ''}`}
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
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold">{tooltip.seat.seat_number}</p>
          <p className="capitalize">{tooltip.seat.class}</p>
          {tooltip.seat.extra_fee > 0 && <p>+{formatPrice(tooltip.seat.extra_fee)}</p>}
          {!tooltip.seat.is_available && <p className="text-red-400">Occupied</p>}
        </div>
      )}

      {/* Selection summary + CTA */}
      <div className="card p-4 sticky bottom-4 shadow-lg">
        {selectedSeat ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                Seat {selectedSeat.seat_number} · <span className="capitalize">{selectedSeat.class}</span>
              </p>
              <p className="text-sm text-gray-500">
                Base: {formatPrice(flight.base_price)}
                {selectedSeat.extra_fee > 0 && ` + ${formatPrice(selectedSeat.extra_fee)} upgrade`}
              </p>
            </div>
            <button onClick={handleContinue} className="btn-primary">
              Continue →
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">Select a seat to continue</p>
        )}
      </div>
    </div>
  );
}
