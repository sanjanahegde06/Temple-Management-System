"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

interface Devotee {
  id: string;
  name: string;
  phone: string;
  email: string;
  familySize: number;
  address: string;
  templeId: string;
  registeredAt: string;
}

export default function DevoteeCRMPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templeId, setTempleId] = useState<string>("");
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    familySize: 1,
    address: "",
  });

  // 1. Fetch Devotees on Load
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

          const devoteesRef = collection(firebaseDb, "devotees");
          const q = query(devoteesRef, where("templeId", "==", currentTempleId));
          const querySnapshot = await getDocs(q);

          const fetchedDevotees: Devotee[] = [];
          querySnapshot.forEach((doc) => {
            fetchedDevotees.push(doc.data() as Devotee);
          });

          // Sort newest first
          fetchedDevotees.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
          setDevotees(fetchedDevotees);
        }
      } catch (error) {
        console.error("Error fetching devotees:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Handle Form Submit (Both Add and Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone Number are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // UPDATE EXISTING DEVOTEE
        const devoteeRef = doc(firebaseDb, "devotees", editingId);
        await updateDoc(devoteeRef, {
          ...formData,
        });

        setDevotees((prev) =>
          prev.map((dev) => (dev.id === editingId ? { ...dev, ...formData } : dev))
        );
      } else {
        // CREATE NEW DEVOTEE
        const newId = `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
        const newDevotee: Devotee = {
          id: newId,
          ...formData,
          templeId,
          registeredAt: new Date().toISOString(),
        };

        await setDoc(doc(firebaseDb, "devotees", newId), newDevotee);
        setDevotees((prev) => [newDevotee, ...prev]);
      }

      closeModal();
    } catch (error) {
      console.error("Error saving devotee:", error);
      alert("Failed to save devotee record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the database?`)) return;

    try {
      await deleteDoc(doc(firebaseDb, "devotees", id));
      setDevotees((prev) => prev.filter((dev) => dev.id !== id));
    } catch (error) {
      console.error("Error deleting devotee:", error);
      alert("Failed to delete record.");
    }
  };

  // Utility to Open/Close Modals cleanly
  const openAddModal = () => {
    setFormData({ name: "", phone: "", email: "", familySize: 1, address: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (devotee: Devotee) => {
    setFormData({
      name: devotee.name,
      phone: devotee.phone,
      email: devotee.email,
      familySize: devotee.familySize,
      address: devotee.address,
    });
    setEditingId(devotee.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // 4. Live Search Filter
  const filteredDevotees = devotees.filter((dev) =>
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <p className="text-amber-900 font-bold text-sm animate-pulse">Loading CRM Database...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 mb-2 transition">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-[var(--font-display)] font-bold text-amber-950">
            Devotee CRM
          </h1>
          <p className="text-sm font-medium text-amber-900/70 mt-1">
            Manage your congregation for Temple ID: <span className="font-bold text-amber-800">{templeId}</span>
          </p>
        </div>

        <button 
          onClick={openAddModal}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-105 flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Register Devotee
        </button>
      </div>

      {/* Database Controls (Search) */}
      <div className="bg-white rounded-t-3xl border-t border-l border-r border-amber-200/60 p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-amber-900/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 pl-10 pr-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
          />
        </div>
        <div className="text-sm font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-xl">
          Total Records: {filteredDevotees.length}
        </div>
      </div>

      {/* Devotee Table */}
      <div className="bg-white rounded-b-3xl shadow-xl shadow-amber-900/5 border border-amber-200/60 overflow-hidden relative z-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/80 border-b border-amber-200/60 text-xs uppercase tracking-wider text-amber-800 font-bold">
                <th className="p-4 pl-6">Devotee Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Family Size</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredDevotees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-amber-900/50 font-medium">
                    No devotees found. Click "Register Devotee" to add one.
                  </td>
                </tr>
              ) : (
                filteredDevotees.map((devotee) => (
                  <tr key={devotee.id} className="hover:bg-amber-50/30 transition group">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-amber-950">{devotee.name}</p>
                      <p className="text-xs font-mono text-amber-900/50 mt-0.5">{devotee.id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-amber-900/80">{devotee.phone}</p>
                      {devotee.email && <p className="text-xs text-amber-900/60 mt-0.5">{devotee.email}</p>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-amber-950">
                          {devotee.familySize} {devotee.familySize === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(devotee)}
                          className="text-xs font-bold text-amber-700 bg-amber-100/50 hover:bg-amber-200/80 border border-amber-200 px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(devotee.id, devotee.name)}
                          className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-100 p-6 md:p-8 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6 border-b border-amber-100 pb-4">
              <h2 className="text-2xl font-bold text-amber-950">
                {editingId ? "Update Devotee Record" : "Register Devotee"}
              </h2>
              <button onClick={closeModal} className="text-amber-900/50 hover:text-amber-900 transition bg-amber-50 rounded-full p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Phone Number *</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Email Address <span className="lowercase opacity-60">(optional)</span></label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ramesh@example.com" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Family Size</label>
                  <input type="number" min="1" value={formData.familySize} onChange={(e) => setFormData({...formData, familySize: parseInt(e.target.value) || 1})} className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Residential Address <span className="lowercase opacity-60">(optional)</span></label>
                <textarea rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Full address..." className="w-full rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 resize-none" />
              </div>

              <div className="mt-4 flex gap-3 justify-end pt-4 border-t border-amber-100">
                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-70">
                  {isSubmitting ? "Saving..." : editingId ? "Update Record" : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}