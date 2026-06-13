"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

import FormField from "@/components/forms/FormField";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

type FormMode = "login" | "forgot-password" | "forgot-id";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Added router for redirecting after login
  const initialTempleId = searchParams.get("templeId") || "";

  const [mode, setMode] = useState<FormMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [templeId, setTempleId] = useState(initialTempleId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    setMessage(null);
    setPassword("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templeId || !email || !password) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // 2. Fetch the user's Firestore document
      const userDocRef = doc(firebaseDb, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(firebaseAuth);
        throw new Error("User record not found in the database.");
      }

      const userData = userDocSnap.data();

      // 3. Strict Validation: Does their typed Temple ID match their database record?
      if (userData.templeId !== templeId) {
        await signOut(firebaseAuth);
        throw new Error("Invalid Temple ID for this account.");
      }

      // 4. Success Pipeline
      setPassword("");
      setMessage({ type: "success", text: "Authentication successful! Redirecting..." });
      
      // Send user to the dashboard
      router.push(`/dashboard?templeId=${templeId}`);

    } catch (error: any) {
      console.error("Login Error:", error);
      
      if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password"
      ) {
        setMessage({ type: "error", text: "Invalid email or password. Please try again." });
      } else if (error.code === "auth/too-many-requests") {
        setMessage({ type: "error", text: "Account temporarily locked due to failed attempts." });
      } else {
        setMessage({ type: "error", text: error.message || "An unexpected error occurred." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setMessage({
        type: "success",
        text: "Password reset link sent! Please check your email inbox (and spam folder).",
      });
      setTimeout(() => switchMode("login"), 5000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setMessage({ type: "error", text: "Failed to send reset email. Verify your address and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotTempleId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your registered email address." });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const usersRef = collection(firebaseDb, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setMessage({ type: "error", text: "No temple associated with this email address." });
      } else {
        const userData = querySnapshot.docs[0].data();
        setMessage({
          type: "success",
          text: `Found it! Your Temple ID is: ${userData.templeId}`,
        });
        setTempleId(userData.templeId);
      }
    } catch (error: any) {
      console.error("Temple ID lookup error:", error);
      setMessage({ type: "error", text: "Failed to securely look up your Temple ID. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-amber-200/60 bg-white/80 p-8 shadow-[0_16px_48px_0_rgba(217,119,6,0.25)] backdrop-blur-2xl ring-1 ring-white/80">
      <div className="flex flex-col items-center text-center mb-6">
        <TempleMark />
        <h2 className="mt-6 text-2xl font-[var(--font-display)] text-amber-950">
          {mode === "login" && "Welcome Back"}
          {mode === "forgot-password" && "Reset Password"}
          {mode === "forgot-id" && "Recover Temple ID"}
        </h2>
        <p className="mt-2 text-sm font-medium text-amber-950/70">
          {mode === "login" && "Enter your credentials to access the sanctum suite."}
          {mode === "forgot-password" && "We'll send you a secure link to reset your password."}
          {mode === "forgot-id" && "Enter your email and we will retrieve your unique ID."}
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          message.type === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : "border-red-300 bg-red-50 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === "login" && (
        <form className="flex flex-col gap-4 animate-in fade-in" onSubmit={handleLoginSubmit}>
          <FormField
            label="Temple ID"
            name="templeId"
            value={templeId}
            placeholder="e.g., TMPL-123456"
            onChange={(e) => setTempleId(e.target.value)}
          />
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            placeholder="admin@temple.org"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <FormField
              label="Password"
              name="password"
              type="password"
              value={password}
              placeholder="••••••••"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-xs font-semibold text-amber-700">
            <button type="button" onClick={() => switchMode("forgot-id")} className="hover:text-amber-500 hover:underline">
              Forgot Temple ID?
            </button>
            <button type="button" onClick={() => switchMode("forgot-password")} className="hover:text-amber-500 hover:underline">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 disabled:opacity-70"
          >
            {isLoading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {mode === "forgot-password" && (
        <form className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in" onSubmit={handleForgotPassword}>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            placeholder="admin@temple.org"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 disabled:opacity-70"
          >
            {isLoading ? "Sending Link..." : "Send Reset Link"}
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-2 text-sm font-semibold text-amber-700 hover:text-amber-500 hover:underline text-center"
          >
            ← Back to Login
          </button>
        </form>
      )}

      {/* FORGOT TEMPLE ID FORM */}
      {mode === "forgot-id" && (
        <form className="flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in" onSubmit={handleForgotTempleId}>
          <FormField
            label="Registered Email"
            name="email"
            type="email"
            value={email}
            placeholder="admin@temple.org"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-105 disabled:opacity-70"
          >
            {isLoading ? "Searching..." : "Retrieve Temple ID"}
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-2 text-sm font-semibold text-amber-700 hover:text-amber-500 hover:underline text-center"
          >
            ← Back to Login
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-sm font-medium text-amber-950/70 border-t border-amber-900/10 pt-6">
        Don't have a temple registered yet?{" "}
        <Link href="/" className="font-bold text-amber-700 hover:text-amber-600 hover:underline">
          Register Here
        </Link>
      </div>
    </div>
  );
}

function TempleMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 border border-white shadow-xl shadow-amber-500/20 backdrop-blur-md">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="h-11 w-11"
        fill="none"
      >
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

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-amber-50 overflow-hidden flex items-center justify-center p-6">
      {/* Photographic background */}
      <div
        className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed opacity-30 mix-blend-multiply"
      />

      {/* Warm gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-amber-900/20" />

      {/* Card */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense fallback={<div className="text-amber-900 font-medium text-sm">Loading sanctum...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}