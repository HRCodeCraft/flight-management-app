export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re offline</h1>
        <p className="text-gray-500 mb-6">
          No internet connection detected. Your previously viewed bookings are still available below.
        </p>
        <a href="/my-bookings" className="btn-primary">
          View Cached Bookings
        </a>
        <p className="text-xs text-gray-400 mt-4">
          SkyBook will reconnect automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
