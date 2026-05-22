import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import { InstallPrompt } from '@/components/ui/InstallPrompt';

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Your Journey Starts Here
            </h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Search hundreds of flights, pick your perfect seat, and manage bookings — all in one place.
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto max-w-3xl">
            <FlightSearchForm />
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: '✈️', label: 'Live Flight Search' },
              { icon: '💺', label: 'Interactive Seat Map' },
              { icon: '🔄', label: 'Easy Rescheduling' },
              { icon: '📱', label: 'Works Offline' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{f.icon}</span>
                <span className="text-sm font-medium text-gray-600">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
