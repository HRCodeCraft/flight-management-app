import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)' }}>
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #080d1f 0%, #0f172a 50%, #1e3a8a 100%)' }}>
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="relative text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">SkyBook</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Welcome<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}>
              Back
            </span>
          </h2>
          <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
            Sign in to access your bookings, reschedule flights, and manage your travel.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[{ v: '8+', l: 'Flights' }, { v: '4', l: 'Routes' }, { v: '100%', l: 'Secure' }].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-xl font-black text-white">{s.v}</p>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900">SkyBook</span>
          </div>
          <Suspense fallback={
            <div className="rounded-3xl bg-white shadow-ticket border border-white/50 p-8 animate-pulse h-96" />
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
