import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const { data: flights } = await supabase
    .from('flights')
    .select('origin, destination')
    .neq('status', 'cancelled');

  const origins = Array.from(new Set((flights ?? []).map((f) => f.origin))).sort();
  const destinations = Array.from(new Set((flights ?? []).map((f) => f.destination))).sort();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #080d1f 0%, #0f172a 40%, #1e3a8a 100%)' }}>

        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
          <div className="text-center mb-12 animate-fade-up">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-blue-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live flight availability • Instant booking
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-6">
              Fly Smarter,
              <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}>
                Book Faster
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
              Search hundreds of flights, pick your perfect seat in real-time, and manage all your bookings in one place.
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto max-w-3xl animate-fade-up stagger-2">
            <FlightSearchForm origins={origins} destinations={destinations} />
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up stagger-3">
            {[
              { value: '8+', label: 'Flights' },
              { value: '4', label: 'Routes' },
              { value: '100%', label: 'Secure' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f0f4ff)' }} />
      </div>

      {/* Features */}
      <div className="bg-[#f0f4ff] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Everything you need to fly</h2>
            <p className="text-slate-500 mt-2">Premium experience from search to boarding</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Smart Search',
                desc: 'Find flights instantly across all routes with real-time availability',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: '💺',
                title: 'Live Seat Map',
                desc: 'Interactive cabin view with real-time updates — no double bookings',
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: '🔄',
                title: 'Easy Reschedule',
                desc: 'Change your flight in seconds with transparent pricing',
                color: 'from-amber-500 to-orange-600',
              },
              {
                icon: '📱',
                title: 'Works Offline',
                desc: 'Install as an app and access your bookings even without internet',
                color: 'from-emerald-500 to-teal-600',
              },
            ].map((f, i) => (
              <div key={f.title} className={`card-hover p-6 animate-fade-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
