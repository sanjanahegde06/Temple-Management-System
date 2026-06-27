"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import FormField from "@/components/forms/FormField";
import { firebaseDb } from "@/lib/firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/auth";
import {
  TempleRegistrationErrors,
  TempleRegistrationValues,
  validateField,
  validateTempleRegistration,
} from "@/lib/validation/templeRegistration";

const initialValues: TempleRegistrationValues = {
  templeName: "",
  templeAddress: "",
  adminName: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TempleRegistrationErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof TempleRegistrationValues, boolean>>
  >({});
  const [submitCount, setSubmitCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [registeredTempleId, setRegisteredTempleId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validationSnapshot = useMemo(
    () => validateTempleRegistration(values),
    [values]
  );
  const isFormValid = useMemo(
    () => !Object.values(validationSnapshot).some(Boolean),
    [validationSnapshot]
  );

  const showError = (name: keyof TempleRegistrationValues) => {
    if (touched[name] || submitCount > 0) {
      return errors[name];
    }
    return undefined;
  };

  const handleChange = (name: keyof TempleRegistrationValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    setIsSuccess(false);
    setSubmitError(null);
  };

  const handleBlur = (name: keyof TempleRegistrationValues, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleCopyId = async () => {
    if (!registeredTempleId) return;

    try {
      await navigator.clipboard.writeText(registeredTempleId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = registeredTempleId;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        alert("Clipboard access blocked by browser. Please select and copy the ID manually.");
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    setSubmitError(null);

    const nextErrors = validateTempleRegistration(values);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password
      );
      const adminUid = userCredential.user.uid;

      const uniqueId = Math.floor(100000 + Math.random() * 900000);
      const templeId = `TMPL-${uniqueId}`;
      
      setRegisteredTempleId(templeId);

      const userData = {
        uid: adminUid,
        name: values.adminName,
        email: values.email,
        role: "Admin",
        templeId: templeId,
        templeIds: [templeId],
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firebaseDb, "users", adminUid), userData);

      const templeData = {
        templeId,
        templeName: values.templeName,
        templeAddress: values.templeAddress,
        adminUid: adminUid,
        adminName: values.adminName,
        email: values.email,
        registrationDate: new Date().toISOString(),
        status: "Active",
      };
      await setDoc(doc(firebaseDb, "temples", templeId), templeData);

      setIsSubmitting(false);
      setIsSuccess(true);
      
    } catch (error: any) {
      console.error("Registration Error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        setSubmitError("This email is already registered. Please log in or use a different email.");
      } else {
        setSubmitError(error.message || "Failed to create account. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-amber-50 overflow-hidden">
      
      {/* Back Button to return to Gateway */}
      <div className="absolute top-6 left-6 z-20 hidden lg:block">
        <Link href="/" className="text-sm font-bold text-amber-950 bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl hover:bg-white transition flex items-center gap-2">
          ← Back to Gateway
        </Link>
      </div>

      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed opacity-30 mix-blend-multiply" />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-amber-900/20" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        
        <section className="relative flex flex-1 flex-col justify-between px-8 py-12 lg:px-12 pt-20 lg:pt-12">
          <div className="relative flex flex-col gap-6">
            
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-4">
              <Link href="/" className="text-sm font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1">
                ← Back to Gateway
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <TempleMark />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-800 font-semibold drop-shadow-sm">
                  Temple Management System
                </p>
                <h1 className="text-3xl font-[var(--font-display)] text-amber-950 drop-shadow-sm lg:text-4xl">
                  Digital Sanctum Suite
                </h1>
              </div>
            </div>
            <p className="max-w-md text-base leading-7 text-amber-950/80 font-medium">
              Register your temple to unlock secure administration, modern
              management workflows, and a future-ready dashboard tailored for
              sacred operations.
            </p>
            
            <div className="flex max-w-md flex-col gap-4 rounded-3xl border border-white/60 bg-white/30 p-6 shadow-[0_8px_32px_0_rgba(217,119,6,0.1)] backdrop-blur-lg transition-all hover:bg-white/40">
              <div>
                <p className="text-sm font-bold text-amber-950">Planned Modules</p>
                <p className="text-xs font-medium text-amber-950/70">Temple operations, bookings, donations, reports, and more.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-amber-950/80">
                <span className="rounded-full bg-white/50 px-3 py-2 border border-white/40 shadow-sm">Role-Based Access</span>
                <span className="rounded-full bg-white/50 px-3 py-2 border border-white/40 shadow-sm">Staff Directory</span>
                <span className="rounded-full bg-white/50 px-3 py-2 border border-white/40 shadow-sm">Donations Ledger</span>
                <span className="rounded-full bg-white/50 px-3 py-2 border border-white/40 shadow-sm">Devotee CRM</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          
          <div className="w-full max-w-md rounded-3xl border border-amber-200/60 bg-white/80 p-8 shadow-[0_16px_48px_0_rgba(217,119,6,0.25)] backdrop-blur-2xl ring-1 ring-white/80">
            
            {isSuccess && registeredTempleId ? (
              <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 shadow-inner backdrop-blur-md">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-[var(--font-display)] text-amber-950 mb-2">Registration Complete!</h2>
                <p className="text-sm font-medium text-amber-950/70 mb-8">
                  Your temple has been securely added. Please copy your Temple ID below. You will need this to log in.
                </p>

                <div className="w-full flex items-center justify-between rounded-2xl border border-amber-300/50 bg-white/60 p-4 shadow-inner mb-8 backdrop-blur-md">
                  <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Your Temple ID</p>
                    <p className="text-2xl font-mono font-bold text-amber-950">{registeredTempleId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition shadow-sm border ${
                      copied ? "bg-emerald-500 text-white border-emerald-600" : "bg-white/80 text-amber-800 border-amber-200 hover:bg-white"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <Link
                  href={`/login?templeId=${registeredTempleId}`}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105"
                >
                  Proceed to Dashboard Login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Temple Registration</p>
                  <h2 className="text-2xl font-[var(--font-display)] text-amber-950">Create the temple profile</h2>
                  <p className="mt-2 text-sm font-medium text-amber-950/70">Validate the essentials now. Admin credentials are required for the first login.</p>
                </div>

                {submitError && (
                  <div className="mb-6 rounded-2xl border border-red-300/50 bg-red-50/80 px-4 py-3 text-sm font-bold text-red-800 backdrop-blur-md">
                    {submitError}
                  </div>
                )}

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <FormField
                    label="Temple Name"
                    name="templeName"
                    value={values.templeName}
                    placeholder="Sri Lakshmi Narayana Temple"
                    autoComplete="organization"
                    onChange={(event) => handleChange("templeName", event.target.value)}
                    onBlur={(event) => handleBlur("templeName", event.target.value)}
                    error={showError("templeName")}
                    disabled={isSubmitting}
                  />
                  <FormField
                    label="Temple Address"
                    name="templeAddress"
                    value={values.templeAddress}
                    placeholder="12 Divine Avenue, Bengaluru"
                    autoComplete="street-address"
                    onChange={(event) => handleChange("templeAddress", event.target.value)}
                    onBlur={(event) => handleBlur("templeAddress", event.target.value)}
                    error={showError("templeAddress")}
                    disabled={isSubmitting}
                  />
                  <FormField
                    label="Admin Name"
                    name="adminName"
                    value={values.adminName}
                    placeholder="Priya Nair"
                    autoComplete="name"
                    onChange={(event) => handleChange("adminName", event.target.value)}
                    onBlur={(event) => handleBlur("adminName", event.target.value)}
                    error={showError("adminName")}
                    disabled={isSubmitting}
                  />
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={values.email}
                    placeholder="admin@temple.org"
                    autoComplete="email"
                    onChange={(event) => handleChange("email", event.target.value)}
                    onBlur={(event) => handleBlur("email", event.target.value)}
                    error={showError("email")}
                    disabled={isSubmitting}
                  />
                  <FormField
                    label="Password"
                    name="password"
                    type="password"
                    value={values.password}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    onChange={(event) => handleChange("password", event.target.value)}
                    onBlur={(event) => handleBlur("password", event.target.value)}
                    error={showError("password")}
                    disabled={isSubmitting}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="mt-2 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating Account..." : "Register Temple"}
                  </button>
                  <p className="text-xs font-medium text-amber-950/60">
                    By continuing, you agree to use Firebase as the secure infrastructure for this platform.
                  </p>

                  <div className="mt-2 border-t border-amber-900/10 pt-4 text-center text-sm font-medium text-amber-950/70">
                    Already registered?{" "}
                    <Link href="/login" className="font-bold text-amber-700 hover:text-amber-600 hover:underline">
                      Sign in here
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TempleMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 border border-white shadow-xl shadow-amber-500/20 backdrop-blur-md">
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