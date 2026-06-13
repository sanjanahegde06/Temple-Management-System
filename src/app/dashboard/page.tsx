"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTempleId = searchParams.get("templeId");

  const [isLoading, setIsLoading] = useState(true);
  const [templeName, setTempleName] = useState<string>("Loading...");
  const [adminName, setAdminName] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(firebaseDb, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAdminName(userData.name);

          const templeDoc = await getDoc(doc(firebaseDb, "temples", userData.templeId));
          if (templeDoc.exists()) {
            setTempleName(templeDoc.data().templeName);
          } else {
            setTempleName("Unknown Temple");
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <HeaderTempleMark />
          <p className="text-amber-900 font-bold text-sm">Securing Sanctum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b border-amber-200">
        <div className="flex items-center gap-3">
          <HeaderTempleMark />
          <h1 className="text-xl font-bold text-amber-950">Sanctum Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-sm font-bold text-amber-950">{adminName}</span>
            <span className="text-xs font-semibold text-amber-700">Administrator</span>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 shadow-inner">
            {urlTempleId}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-amber-700 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto">
        <div className="rounded-3xl border border-amber-200/60 bg-white p-8 shadow-xl shadow-amber-900/5 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 -mt-16 -mr-16 opacity-5 pointer-events-none">
             <HeaderTempleMark scale="scale-[8]" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
            Active Workspace
          </p>
          <h2 className="text-3xl font-[var(--font-display)] font-bold text-amber-950 mb-2 relative z-10">
            {templeName}
          </h2>
          <p className="text-sm font-medium text-amber-900/70 mb-8 relative z-10">
            Your secure infrastructure is active and authenticated.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* Devotee CRM Card */}
            <a 
              href="#"
              className="h-40 rounded-2xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Devotee CRM</span>
            </a>
            
            {/* Donations Ledger Card */}
            <a 
              href="#"
              className="h-40 rounded-2xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Donations Ledger</span>
            </a>
            
            {/* Staff Directory Card */}
            <a 
              href="/dashboard/staff"
              className="h-40 rounded-2xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Staff Directory</span>
            </a>

          </div>
        </div>
      </main>
    </div>
  );
}

function HeaderTempleMark({ scale = "" }: { scale?: string }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-amber-100 shadow-sm ${scale}`}>
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-7 w-7" fill="none">
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-amber-50 text-amber-900 font-bold">Loading Sanctum...</div>}>
      <DashboardContent />
    </Suspense>
  );
}