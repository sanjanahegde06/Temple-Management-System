"use client";

import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/auth";
import FormField from "@/components/forms/FormField";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic Validation
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to change your password." });
      return;
    }

    setIsLoading(true);
    try {
      // The Firebase magic happens here
      await updatePassword(user, newPassword);
      
      setMessage({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      
      // Firebase's built-in security check
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ 
          type: "error", 
          text: "For security reasons, please log out and log back in before changing your password." 
        });
      } else {
        setMessage({ type: "error", text: error.message || "Failed to update password." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-[var(--font-display)] text-amber-950">Security Settings</h1>
        <p className="mt-2 text-amber-950/70">Update your account credentials and personal preferences.</p>
      </div>

      <div className="rounded-3xl border border-amber-200/60 bg-white/80 p-8 shadow-xl shadow-amber-900/5 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-amber-950 mb-6 border-b border-amber-900/10 pb-4">Change Password</h2>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-5 max-w-md">
          <FormField
            label="New Password"
            name="newPassword"
            type="password"
            value={newPassword}
            placeholder="Enter new password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            placeholder="Confirm new password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 disabled:opacity-70"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}