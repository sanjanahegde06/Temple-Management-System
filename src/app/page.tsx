import Link from "next/link";

export default function GatewayPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background ambient decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-12 flex flex-col items-center text-center">
          <DetailedTempleMark scale="scale-125 mb-8" />
          <h1 className="text-4xl md:text-5xl font-[var(--font-display)] font-bold text-amber-950 mb-4">
            Welcome to the Sanctum
          </h1>
          <p className="text-lg font-medium text-amber-900/70 max-w-lg">
            Please select your portal to continue. Secure access is required for all operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
          
          {/* DEVOTEE PORTAL CARD */}
          <Link 
            href="/devotee/login"
            className="group relative flex flex-col items-center p-10 bg-white rounded-3xl border-2 border-amber-200/60 shadow-xl shadow-amber-900/5 transition-all hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-900/10 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-10 w-10 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-2xl font-[var(--font-display)] font-bold text-amber-950 mb-2">Devotee Portal</h2>
            <p className="text-center text-sm font-medium text-amber-900/70">
              View your Pooja bookings, download receipts, and manage your family profile.
            </p>
            <span className="mt-8 text-sm font-bold text-amber-600 group-hover:text-amber-800 transition-colors flex items-center gap-1">
              Enter Portal <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>

          {/* ADMINISTRATOR / STAFF CARD */}
          <Link 
            href="/login"
            className="group relative flex flex-col items-center p-10 bg-white rounded-3xl border-2 border-amber-200/60 shadow-xl shadow-amber-900/5 transition-all hover:border-orange-400 hover:shadow-2xl hover:shadow-amber-900/10 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-10 w-10 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-[var(--font-display)] font-bold text-amber-950 mb-2">Temple Staff</h2>
            <p className="text-center text-sm font-medium text-amber-900/70">
              Access the management dashboard. Schedule bookings, manage the CRM, and oversee operations.
            </p>
            <span className="mt-8 text-sm font-bold text-orange-600 group-hover:text-orange-800 transition-colors flex items-center gap-1">
              Secure Login <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        </div>

        {/* REGISTRATION LINK */}
        <div className="text-center">
          <p className="text-sm font-medium text-amber-950/60">
            Are you a Temple Administrator looking to digitize your operations?
          </p>
          <Link href="/register" className="mt-2 inline-block text-sm font-bold text-amber-700 hover:text-amber-900 hover:underline">
            Register your Temple securely here
          </Link>
        </div>

      </div>
    </div>
  );
}

// Your beautiful detailed logo
function DetailedTempleMark({ scale = "" }: { scale?: string }) {
  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-amber-200 shadow-xl shadow-amber-500/10 ${scale}`}>
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-11 w-11" fill="none">
        <path d="M32 18 V 2 L 46 6 L 32 12" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M22 40 C 22 22 32 16 32 16 C 32 16 42 22 42 40" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M23 34 H 41 M 25 28 H 39 M 28 22 H 36" stroke="#FBBF24" strokeWidth="2" />
        <ellipse cx="32" cy="16" rx="5" ry="2" fill="#FBBF24" stroke="#9A3412" strokeWidth="1" />
        <circle cx="32" cy="12" r="2.5" fill="#FBBF24" stroke="#9A3412" strokeWidth="1" />
        <path d="M10 44 C 10 32 16 28 16 28 C 16 28 22 32 22 44" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M11 38 H 21 M 13 33 H 19" stroke="#FBBF24" strokeWidth="1.5" />
        <ellipse cx="16" cy="28" rx="3" ry="1.5" fill="#FBBF24" stroke="#9A3412" strokeWidth="1" />
        <circle cx="16" cy="25" r="1.5" fill="#FBBF24" />
        <path d="M42 44 C 42 32 48 28 48 28 C 48 28 54 32 54 44" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M43 38 H 53 M 45 33 H 51" stroke="#FBBF24" strokeWidth="1.5" />
        <ellipse cx="48" cy="28" rx="3" ry="1.5" fill="#FBBF24" stroke="#9A3412" strokeWidth="1" />
        <circle cx="48" cy="25" r="1.5" fill="#FBBF24" />
        <rect x="8" y="44" width="48" height="12" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <rect x="20" y="38" width="24" height="18" fill="#FBBF24" stroke="#9A3412" strokeWidth="1.5" />
        <line x1="12" y1="44" x2="12" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="18" y1="44" x2="18" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="46" y1="44" x2="46" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="52" y1="44" x2="52" y2="56" stroke="#EA580C" strokeWidth="2" />
        <path d="M26 56 V 46 A 6 6 0 0 1 38 46 V 56 Z" fill="#451A03" stroke="#78350F" strokeWidth="2" />
        <path d="M26 46 A 6 6 0 0 1 38 46" stroke="#F59E0B" strokeWidth="2" fill="none" />
        <path d="M6 56 H 58 L 62 60 H 2 Z" fill="#D97706" stroke="#9A3412" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="2" y="60" width="60" height="2" fill="#78350F" />
      </svg>
    </div>
  );
}