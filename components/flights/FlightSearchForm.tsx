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
    origin: searchQuery?.origin ?? '',
    destination: searchQuery?.destination ?? '',
    date: searchQuery?.date ?? today,
    passenger_count: searchQuery?.passenger_count ?? 1,
  });

  const [error, setError] = useState('');

  // When origin changes, reset destination if it's no longer valid
  function handleOriginChange(value: string) {
    setForm((prev) => ({
      ...prev,
      origin: value,
      destination: prev.destination === value ? '' : prev.destination,
    }));
    setError('');
  }

  function handleChange(field: keyof SearchQuery, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.origin || !form.destination) {
      setError('Please select origin and destination');
      return;
    }
    if (form.origin === form.destination) {
      setError('Origin and destination must be different');
      return;
    }
    setSearchQuery(form);
    setCurrentStep('results');
    const params = new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      passengers: String(form.passenger_count),
    });
    router.push(`/flights?${params}`);
  }

  // Use DB-fetched airports if available, else fallback to all airports
  const originOptions = origins.length > 0 ? origins : AIRPORTS.map((a) => a.code);
  const destOptions = destinations.length > 0
    ? destinations.filter((d) => d !== form.origin)
    : AIRPORTS.map((a) => a.code).filter((c) => c !== form.origin);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <select
            className="input"
            value={form.origin}
            onChange={(e) => handleOriginChange(e.target.value)}
            required
          >
            <option value="">Select origin</option>
            {originOptions.map((code) => (
              <option key={code} value={code}>
                {getAirportLabel(code)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <select
            className="input"
            value={form.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            required
            disabled={!form.origin}
          >
            <option value="">{form.origin ? 'Select destination' : 'Select origin first'}</option>
            {destOptions.map((code) => (
              <option key={code} value={code}>
                {getAirportLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="input"
            value={form.date}
            min={today}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
          <select
            className="input"
            value={form.passenger_count}
            onChange={(e) => handleChange('passenger_count', parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full py-3 text-base">
        Search Flights
      </button>
    </form>
  );
}
