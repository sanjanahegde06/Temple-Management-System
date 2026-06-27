"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

import FormField from "@/components/forms/FormField";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

type FormMode = "login" | "forgot-password" | "forgot-id";

function DevoteeLoginForm() {
  const router = useRouter();

  // UI States
  const [mode, setMode] = useState<FormMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    setMessage(null);
    setPassword("");
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      // Success Pipeline
      setPassword("");
      setMessage({ type: "success", text: "Authentication successful! Redirecting..." });
      
      router.push(`/devotee/dashboard`);
    } catch (error: any) {
      console.error("Login Error:", error);
      
      if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password"
      ) {
        setMessage({ type: "error", text: "Invalid email or password. Remember, your default password is your Devotee ID." });
      } else if (error.code === "auth/too-many-requests") {
        setMessage({ type: "error", text: "Account temporarily locked due to failed attempts." });
      } else {
        setMessage({ type: "error", text: error.message || "An unexpected error occurred." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Forgot Password
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

  // 3. Handle Forgot ID (Devotee & Temple ID Recovery)
  const handleForgotId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your registered email address." });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Step A: Find the devotee record by email
      const devoteesRef = collection(firebaseDb, "devotees");
      const q = query(devoteesRef, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setMessage({ type: "error", text: "No devotee record associated with this email address." });
        setIsLoading(false);
        return;
      }

      // We take the first matched devotee
      const devoteeData = querySnapshot.docs[0].data();
      const devoteeId = devoteeData.id;
      const templeId = devoteeData.templeId;

      // Step B: Fetch the Temple Name using the found templeId
      let templeName = "Unknown Temple";
      if (templeId) {
        const templeDocSnap = await getDoc(doc(firebaseDb, "temples", templeId));
        if (templeDocSnap.exists()) {
          templeName = templeDocSnap.data().name || "Unknown Temple";
        }
      }

      setMessage({
        type: "success",
        text: `Record found! Your Devotee ID is: ${devoteeId}. You are registered at ${templeName} (ID: ${templeId}).`,
      });
      
    } catch (error: any) {
      console.error("ID lookup error:", error);
      setMessage({ type: "error", text: "Failed to securely look up your record. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-amber-200/60 bg-white/80 p-8 shadow-[0_16px_48px_0_rgba(217,119,6,0.25)] backdrop-blur-2xl ring-1 ring-white/80">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 mb-4 shadow-inner border border-amber-300/50">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-[var(--font-display)] text-amber-950 font-bold">
          {mode === "login" && "Devotee Portal"}
          {mode === "forgot-password" && "Reset Password"}
          {mode === "forgot-id" && "Recover Account IDs"}
        </h2>
        <p className="mt-2 text-sm font-medium text-amber-950/70">
          {mode === "login" && "Sign in to manage your temple profile and bookings."}
          {mode === "forgot-password" && "We'll send you a secure link to reset your password."}
          {mode === "forgot-id" && "Enter your email to retrieve your Devotee and Temple IDs."}
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed ${
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
            label="Email Address"
            name="email"
            type="email"
            value={email}
            placeholder="name@example.com"
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
              Forgot ID?
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
            {isLoading ? "Authenticating..." : "Secure Login"}
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
            placeholder="name@example.com"
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

      {/* FORGOT ID FORM */}
      {mode === "forgot-id" && (
        <form className="flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in" onSubmit={handleForgotId}>
          <FormField
            label="Registered Email"
            name="email"
            type="email"
            value={email}
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-105 disabled:opacity-70"
          >
            {isLoading ? "Searching..." : "Retrieve IDs"}
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
    </div>
  );
}

export default function DevoteeLoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-amber-50 overflow-hidden flex items-center justify-center p-6">
      
      {/* Back Button to return to Gateway */}
      <div className="absolute top-6 left-6 z-20 hidden lg:block">
        <Link href="/" className="text-sm font-bold text-amber-950 bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl hover:bg-white transition flex items-center gap-2 shadow-sm border border-white/40">
          ← Back to Gateway
        </Link>
      </div>

      {/* Photographic background */}
      <div
        className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed opacity-30 mix-blend-multiply"
      />

      {/* Warm gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-amber-900/20" />

      {/* Card Wrapper */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense fallback={<div className="text-amber-900 font-medium text-sm animate-pulse">Loading Portal...</div>}>
          <DevoteeLoginForm />
        </Suspense>
      </div>
    </div>
  );
}