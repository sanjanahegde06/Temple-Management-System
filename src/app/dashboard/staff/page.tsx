"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { initializeApp, deleteApp } from "firebase/app";
import { onAuthStateChanged, getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

interface StaffMember {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  templeId: string;
}

export default function StaffDirectoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [templeId, setTempleId] = useState<string>("");

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Staff");

  // Manage (Edit/Delete) Modal States
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState("Staff");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(firebaseDb, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const currentTempleId = userDoc.data().templeId;
          setTempleId(currentTempleId);

          const usersRef = collection(firebaseDb, "users");
          const q = query(usersRef, where("templeId", "==", currentTempleId));
          const querySnapshot = await getDocs(q);

          const staffData: StaffMember[] = [];
          querySnapshot.forEach((doc) => {
            staffData.push(doc.data() as StaffMember);
          });

          setStaffList(staffData);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper to generate a random secure password
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // Handle Adding New Staff using Ghost Instance
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || newPassword.length < 8) {
      alert("Please provide an email and a password of at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    let secondaryApp;

    try {
      // 1. Create Ghost App
      secondaryApp = initializeApp(firebaseAuth.app.options, `GhostApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the real user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const realUid = userCredential.user.uid;

      // 3. Save to Firestore
      const finalName = newName.trim() === "" ? `Staff ${staffList.length + 1}` : newName.trim();
      
      const newStaffMember: StaffMember = {
        uid: realUid,
        name: finalName,
        email: newEmail,
        role: newRole,
        templeId: templeId,
        status: "Active", // Instantly active
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(firebaseDb, "users", realUid), newStaffMember);
      setStaffList((prev) => [...prev, newStaffMember]);
      
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("Staff");
      setIsAddModalOpen(false);

      // 4. Alert credentials to Admin
      alert(`Success! Hand these credentials to your staff member:\n\nEmail: ${newEmail}\nPassword: ${newPassword}\nTemple ID: ${templeId}`);

    } catch (error: any) {
      console.error("Error adding staff:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered in the system.");
      } else {
        alert("Failed to add staff member.");
      }
    } finally {
      // 5. Cleanup ghost app
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setIsSubmitting(false);
    }
  };

  // Open Manage Modal
  const openManageModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditRole(staff.role);
    setIsManageModalOpen(true);
  };

  // Handle Updating Existing Staff Role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsUpdating(true);

    // --- SAFETY CHECK: PREVENT DEMOTING THE LAST ADMIN ---
    if (selectedStaff.role === "Admin" && editRole === "Staff") {
      const adminCount = staffList.filter((s) => s.role === "Admin").length;
      if (adminCount <= 1) {
        alert("Action Denied: You cannot demote the only remaining Admin. Please promote another user to Admin first before stepping down.");
        setIsUpdating(false);
        return;
      }
    }

    try {
      const staffRef = doc(firebaseDb, "users", selectedStaff.uid);
      await updateDoc(staffRef, { role: editRole });

      // Update UI instantly
      setStaffList((prev) => 
        prev.map((staff) => staff.uid === selectedStaff.uid ? { ...staff, role: editRole } : staff)
      );
      
      setIsManageModalOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update permission level.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Removing Staff
  const handleRemoveStaff = async () => {
    if (!selectedStaff) return;
    
    // --- SAFETY CHECK: PREVENT DELETING THE LAST ADMIN ---
    if (selectedStaff.role === "Admin") {
      const adminCount = staffList.filter((s) => s.role === "Admin").length;
      if (adminCount <= 1) {
        alert("Action Denied: You cannot revoke access for the only remaining Admin. Please promote another user to Admin first.");
        return;
      }
    }

    // Safety check confirmation
    const isConfirmed = window.confirm(`Are you sure you want to revoke access for ${selectedStaff.name}? This cannot be undone.`);
    if (!isConfirmed) return;

    setIsUpdating(true);
    try {
      await deleteDoc(doc(firebaseDb, "users", selectedStaff.uid));
      
      // Remove from UI instantly
      setStaffList((prev) => prev.filter((staff) => staff.uid !== selectedStaff.uid));
      setIsManageModalOpen(false);
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("Failed to remove staff member.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-amber-900 font-bold text-sm animate-pulse">Loading Directory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6 lg:p-10 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 mb-2 transition">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-[var(--font-display)] font-bold text-amber-950">
              Staff Directory
            </h1>
            <p className="text-sm font-medium text-amber-900/70 mt-1">
              Managing personnel for Temple ID: <span className="font-bold text-amber-800">{templeId}</span>
            </p>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Personnel
          </button>
        </div>

        {/* Staff Table Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/80 border-b border-amber-200/60 text-xs uppercase tracking-wider text-amber-800 font-bold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Permission Level</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {staffList.map((staff) => (
                  <tr key={staff.uid} className="hover:bg-amber-50/30 transition">
                    <td className="p-4 pl-6 font-bold text-amber-950">{staff.name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border 
                        ${staff.role === 'Admin' 
                          ? 'bg-orange-100 text-orange-800 border-orange-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-amber-900/70">{staff.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold 
                        ${staff.status === 'Active' ? 'text-emerald-700' : 
                          staff.status === 'Invited' ? 'text-blue-700' : 'text-red-700'}`}>
                        <span className={`h-2 w-2 rounded-full 
                          ${staff.status === 'Active' ? 'bg-emerald-500' : 
                            staff.status === 'Invited' ? 'bg-blue-500' : 'bg-red-500'}`}>
                        </span>
                        {staff.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => openManageModal(staff)}
                        className="text-xs font-bold text-amber-700 bg-amber-100/50 hover:bg-amber-200/80 border border-amber-200 px-3 py-1.5 rounded-lg transition shadow-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ADD STAFF MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-amber-950">Add Personnel</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-amber-900/50 hover:text-amber-900 transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Full Name <span className="text-amber-500/70 lowercase font-medium tracking-normal">(Optional)</span>
                </label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`Leave blank for "Staff ${staffList.length + 1}"`} className="h-12 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Email Address</label>
                <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="staff@temple.org" className="h-12 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
              </div>
              
              {/* NEW TEMPORARY PASSWORD FIELD */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Temporary Password</label>
                  <button type="button" onClick={generatePassword} className="text-xs font-bold text-amber-600 hover:underline">Auto-Generate</button>
                </div>
                <input required minLength={8} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className="h-12 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Permission Level</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="h-12 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-bold text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 appearance-none cursor-pointer">
                  <option value="Staff">Staff (Standard Access)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmitting} className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-70">
                {isSubmitting ? "Creating..." : "Create & Add to Directory"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE (EDIT/DELETE) STAFF MODAL --- */}
      {isManageModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-950">Manage Access</h2>
                <p className="text-sm font-medium text-amber-900/70">{selectedStaff.name}</p>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="text-amber-900/50 hover:text-amber-900 transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateRole} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Update Permission Level</label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)} 
                  className="h-12 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-bold text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 appearance-none cursor-pointer"
                >
                  <option value="Staff">Staff (Standard Access)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>
              
              <button type="submit" disabled={isUpdating} className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-70">
                {isUpdating ? "Updating..." : "Save Changes"}
              </button>
            </form>

            <div className="mt-8 border-t border-red-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2">Danger Zone</p>
              <button 
                onClick={handleRemoveStaff}
                disabled={isUpdating}
                className="h-12 w-full rounded-xl border-2 border-red-200 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100 hover:border-red-300 disabled:opacity-70"
              >
                Revoke Access & Remove
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}