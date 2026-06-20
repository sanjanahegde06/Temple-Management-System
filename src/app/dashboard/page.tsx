"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

function DashboardContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templeName, setTempleName] = useState<string>("Loading...");
  const [adminName, setAdminName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Loading...");
  
  // Real-time stat states
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [devoteeCount, setDevoteeCount] = useState<number | null>(null); // Added this!

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
          setUserRole(userData.role);
          const currentTempleId = userData.templeId;

          // Fetch Temple Name
          const templeDoc = await getDoc(doc(firebaseDb, "temples", currentTempleId));
          if (templeDoc.exists()) {
            setTempleName(templeDoc.data().templeName);
          } else {
            setTempleName("Unknown Temple");
          }

          // Fetch Actual Staff Count
          const usersRef = collection(firebaseDb, "users");
          const qOld = query(usersRef, where("templeId", "==", currentTempleId));
          const qNew = query(usersRef, where("templeIds", "array-contains", currentTempleId));
          
          const [snapOld, snapNew] = await Promise.all([getDocs(qOld), getDocs(qNew)]);
          const uniqueStaff = new Set();
          snapOld.forEach(doc => uniqueStaff.add(doc.id));
          snapNew.forEach(doc => uniqueStaff.add(doc.id));
          setStaffCount(uniqueStaff.size);

          // NEW: Fetch Actual Devotee Count
          const devoteesRef = collection(firebaseDb, "devotees");
          const qDevotees = query(devoteesRef, where("templeId", "==", currentTempleId));
          const devoteesSnap = await getDocs(qDevotees);
          setDevoteeCount(devoteesSnap.size);

        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <HeaderTempleMark />
          <p className="text-amber-900 font-bold text-sm">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in">
      
      {/* Header Area */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
          {userRole === "Admin" ? "Admin Workspace" : "Staff Workspace"}
        </p>
        <h2 className="text-3xl md:text-4xl font-[var(--font-display)] font-bold text-amber-950 mb-2">
          {templeName}
        </h2>
        <p className="text-sm font-medium text-amber-900/70">
          Welcome back, {adminName}. You are logged in with <span className="font-bold text-amber-800">{userRole}</span> permissions.
        </p>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-amber-200/60 shadow-xl shadow-amber-900/5">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">Registered Devotees</p>
          {/* Now uses the live devoteeCount! */}
          <p className="text-4xl font-[var(--font-display)] text-amber-950">
            {devoteeCount !== null ? devoteeCount : "..."}
          </p>
          <p className="text-xs font-medium text-emerald-600 mt-2">Families in your CRM</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-amber-200/60 shadow-xl shadow-amber-900/5">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">Active Staff</p>
          <p className="text-4xl font-[var(--font-display)] text-amber-950">{staffCount !== null ? staffCount : "..."}</p>
          <p className="text-xs font-medium text-emerald-600 mt-2">System administrators</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-amber-200/60 shadow-xl shadow-amber-900/5">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">Today's Donations</p>
          <p className="text-4xl font-[var(--font-display)] text-amber-950">₹0</p>
          <p className="text-xs font-medium text-amber-600 mt-2">Module unlocks in Week 6</p>
        </div>
      </div>

      {/* Quick Access Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/dashboard/devotees"
          className="h-40 rounded-3xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Devotee CRM</span>
        </Link>
        
        <Link 
          href="#"
          className="h-40 rounded-3xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Donations Ledger</span>
        </Link>
        
        <Link 
          href="/dashboard/staff"
          className="h-40 rounded-3xl border-2 border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/10 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-bold text-lg group-hover:scale-105 transition-transform z-10">Staff Directory</span>
        </Link>
      </div>
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
        <path d="M10 44 C 10 32 16 28 16 28 C 16 28 22 32 22 44" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M42 44 C 42 32 48 28 48 28 C 48 28 54 32 54 44" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <rect x="8" y="44" width="48" height="12" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <rect x="20" y="38" width="24" height="18" fill="#FBBF24" stroke="#9A3412" strokeWidth="1.5" />
        <line x1="12" y1="44" x2="12" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="18" y1="44" x2="18" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="46" y1="44" x2="46" y2="56" stroke="#EA580C" strokeWidth="2" />
        <line x1="52" y1="44" x2="52" y2="56" stroke="#EA580C" strokeWidth="2" />
        <path d="M26 56 V 46 A 6 6 0 0 1 38 46 V 56 Z" fill="#451A03" stroke="#78350F" strokeWidth="2" />
        <path d="M6 56 H 58 L 62 60 H 2 Z" fill="#D97706" stroke="#9A3412" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="2" y="60" width="60" height="2" fill="#78350F" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-amber-900 font-bold">Loading Sanctum...</div>}>
      <DashboardContent />
    </Suspense>
  );
}