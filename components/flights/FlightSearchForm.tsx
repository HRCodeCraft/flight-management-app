'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFlightStore } from '@/store/useFlightStore';
import { AIRPORTS, type SearchQuery } from '@/types';

interface Props {
  origins?: string[];
  destinations?: string[];
}

function getAirportLabel(code: string) {
  const airport = AIRPORTS.find((a) => a.code === code);
  return airport ? `${airport.city} (${code})` : code;
}

export function FlightSearchForm({ origins = [], destinations = [] }: Props) {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setCurrentStep } = useFlightStore();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<SearchQuery>({
    origin:          searchQuery?.origin ?? '',
    destination:     searchQuery?.destination ?? '',
    date:            searchQuery?.date ?? today,
    passenger_count: searchQuery?.passenger_count ?? 1,
    adult_count:     searchQuery?.adult_count ?? 1,
    senior_count:    searchQuery?.senior_count ?? 0,
  });
  const [error, setError] = useState('');

  const totalPassengers = form.adult_count + form.senior_count;

  function handleOriginChange(value: string) {
    setForm((prev) => ({ ...prev, origin: value, destination: prev.destination === value ? '' : prev.destination }));
    setError('');
  }

  function handleChange(field: keyof SearchQuery, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function handleCountChange(field: 'adult_count' | 'senior_count', value: number) {
    const clamped = Math.max(0, value);
    const other = field === 'adult_count' ? form.senior_count : form.adult_count;
    if (clamped + other === 0) return; // at least 1 passenger total
    setForm((prev) => ({
      ...prev,
      [field]: clamped,
      passenger_count: field === 'adult_count' ? clamped + prev.senior_count : prev.adult_count + clamped,
    }));
    setError('');
  }

  function swapAirports() {
    if (form.origin && form.destination) {
      setForm((prev) => ({ ...prev, origin: prev.destination, destination: prev.origin }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.origin || !form.destination) { setError('Please select origin and destination'); return; }
    if (form.origin === form.destination) { setError('Origin and destination must be different'); return; }
    if (totalPassengers === 0) { setError('Please add at least 1 passenger'); return; }
    const query: SearchQuery = { ...form, passenger_count: totalPassengers };
    setSearchQuery(query);
    setCurrentStep('results');
    router.push(`/flights?${new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      passengers: String(totalPassengers),
      adults: String(form.adult_count),
      seniors: String(form.senior_count),
    })}`);
  }

  const originOptions = origins.length > 0 ? origins : AIRPORTS.map((a) => a.code);
  const destOptions = destinations.length > 0
    ? destinations.filter((d) => d !== form.origin)
    : AIRPORTS.map((a) => a.code).filter((c) => c !== form.origin);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/95 backdrop-blur-md shadow-ticket border border-white/50 p-6 sm:p-8">
      {/* Trip type */}
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/></svg>
          One Way
        </span>
        <span className="text-xs text-slate-400 font-medium">Round Trip coming soon</span>
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 mb-4 items-end">
        <div>
          <label className="label">From</label>
          <select className="input text-base font-medium" value={form.origin} onChange={(e) => handleOriginChange(e.target.value)} required>
            <option value="">Select city</option>
            {originOptions.map((code) => (
              <option key={code} value={code}>{getAirportLabel(code)}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={swapAirports}
          disabled={!form.origin || !form.destination}
          className="w-10 h-10 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 self-end mb-0.5 shadow-sm mx-auto"
          title="Swap airports">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        <div>
          <label className="label">To</label>
          <select className="input text-base font-medium" value={form.destination} onChange={(e) => handleChange('destination', e.target.value)} required disabled={!form.origin}>
            <option value="">{form.origin ? 'Select city' : 'Select origin first'}</option>
            {destOptions.map((code) => (
              <option key={code} value={code}>{getAirportLabel(code)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="label">Departure Date</label>
        <input type="date" className="input" value={form.date} min={today} onChange={(e) => handleChange('date', e.target.value)} required />
      </div>

      {/* Passenger counts */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="label mb-3">Passengers
          <span className="ml-2 text-xs font-normal text-slate-400">
            Total: <span className="font-bold text-slate-700">{totalPassengers}</span>
          </span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Adults */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-semibold text-slate-700">Adult</p>
                <p className="text-xs text-slate-400">Age 12–59</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => handleCountChange('adult_count', form.adult_count - 1)}
                  disabled={form.adult_count === 0 && form.senior_count > 0 || form.adult_count === 0}
                  className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none">
                  −
                </button>
                <span className="w-5 text-center font-black text-slate-900 text-sm tabular-nums">{form.adult_count}</span>
                <button type="button"
                  onClick={() => handleCountChange('adult_count', form.adult_count + 1)}
                  disabled={totalPassengers >= 6}
                  className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Seniors */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-semibold text-slate-700">Senior</p>
                <p className="text-xs text-emerald-600 font-semibold">10% off · Age 60+</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => handleCountChange('senior_count', form.senior_count - 1)}
                  disabled={form.senior_count === 0}
                  className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none">
                  −
                </button>
                <span className="w-5 text-center font-black text-slate-900 text-sm tabular-nums">{form.senior_count}</span>
                <button type="button"
                  onClick={() => handleCountChange('senior_count', form.senior_count + 1)}
                  disabled={totalPassengers >= 6}
                  className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-3.5 text-base rounded-xl">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        Search Flights
      </button>
    </form>
  );
}
