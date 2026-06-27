"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/firestore";

interface Booking {
  id: string;
  poojaName: string;
  devoteeName: string;
  date: string;
  amount: number;
  status: "Pending" | "Confirmed" | "Completed";
  templeId: string;
  createdAt: string;
  receiptNo?: string; // Tracks the generated receipt
}

export default function BookingManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templeId, setTempleId] = useState<string>("");
  const [templeName, setTempleName] = useState<string>("Our Temple");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Receipt States
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  // Form States
  const [formData, setFormData] = useState<{
    poojaName: string;
    devoteeName: string;
    date: string;
    amount: number | string;
    status: "Pending" | "Confirmed" | "Completed";
  }>({ poojaName: "", devoteeName: "", date: "", amount: "", status: "Pending" });

  // 1. Fetch Data on Load
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

          // Fetch Temple Name for the Receipt header
          const tDoc = await getDoc(doc(firebaseDb, "temples", currentTempleId));
          if (tDoc.exists()) {
            setTempleName(tDoc.data().templeName);
          }

          // Fetch Bookings
          const bookingsRef = collection(firebaseDb, "bookings");
          const q = query(bookingsRef, where("templeId", "==", currentTempleId));
          const querySnapshot = await getDocs(q);

          const fetchedBookings: Booking[] = [];
          querySnapshot.forEach((doc) => {
            fetchedBookings.push(doc.data() as Booking);
          });

          // Sort by Date (newest first)
          fetchedBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setBookings(fetchedBookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Handle Form Submit (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poojaName || !formData.devoteeName || !formData.date || formData.amount === "") {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        const bookingRef = doc(firebaseDb, "bookings", editingId);
        await updateDoc(bookingRef, {
          ...formData,
          amount: Number(formData.amount),
        });

        setBookings((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...formData, amount: Number(formData.amount) } : b))
        );
      } else {
        const newId = `BKG-${Math.floor(100000 + Math.random() * 900000)}`;
        const newBooking: Booking = {
          id: newId,
          poojaName: formData.poojaName,
          devoteeName: formData.devoteeName,
          date: formData.date,
          amount: Number(formData.amount),
          status: formData.status,
          templeId,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(firebaseDb, "bookings", newId), newBooking);
        setBookings((prev) => [newBooking, ...prev]);
      }

      closeModal();
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel and delete this booking?")) return;

    try {
      await deleteDoc(doc(firebaseDb, "bookings", id));
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete record.");
    }
  };

  // 4. Receipt Generation
  const handleGenerateReceipt = async (booking: Booking) => {
    // If it already has a receipt, just show it
    if (booking.receiptNo) {
      setSelectedReceipt(booking);
      return;
    }

    try {
      // Generate unique receipt number
      const newReceiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Save to Firestore
      const bookingRef = doc(firebaseDb, "bookings", booking.id);
      await updateDoc(bookingRef, { receiptNo: newReceiptNo });

      // Update Local State
      const updatedBooking = { ...booking, receiptNo: newReceiptNo };
      setBookings((prev) => prev.map((b) => b.id === booking.id ? updatedBooking : b));
      
      // Open Receipt Modal
      setSelectedReceipt(updatedBooking);
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Failed to generate receipt.");
    }
  };

  // Utilities
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending": default: return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const openAddModal = () => {
    setFormData({ poojaName: "", devoteeName: "", date: "", amount: "", status: "Pending" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setFormData({
      poojaName: booking.poojaName,
      devoteeName: booking.devoteeName,
      date: booking.date,
      amount: booking.amount,
      status: booking.status,
    });
    setEditingId(booking.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const filteredBookings = bookings.filter((b) =>
    b.poojaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.devoteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.receiptNo && b.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <p className="text-amber-900 font-bold text-sm animate-pulse">Loading Booking Ledger...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in print:p-0">
      
      {/* Header Section (Hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <Link href="/dashboard" className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 mb-2 transition">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-[var(--font-display)] font-bold text-amber-950">
            Booking Management
          </h1>
          <p className="text-sm font-medium text-amber-900/70 mt-1">
            Schedule Poojas and track statuses for Temple ID: <span className="font-bold text-amber-800">{templeId}</span>
          </p>
        </div>

        <button 
          onClick={openAddModal}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-105 flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Booking
        </button>
      </div>

      {/* Search Bar (Hidden during print) */}
      <div className="bg-white rounded-t-3xl border-t border-l border-r border-amber-200/60 p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center relative z-10 print:hidden">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-amber-900/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search by Pooja, Devotee, or Receipt No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 pl-10 pr-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
          />
        </div>
        <div className="text-sm font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-xl">
          Total Bookings: {filteredBookings.length}
        </div>
      </div>

      {/* Bookings Table (Hidden during print) */}
      <div className="bg-white rounded-b-3xl shadow-xl shadow-amber-900/5 border border-amber-200/60 overflow-hidden relative z-0 print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/80 border-b border-amber-200/60 text-xs uppercase tracking-wider text-amber-800 font-bold">
                <th className="p-4 pl-6">Pooja Details</th>
                <th className="p-4">Devotee</th>
                <th className="p-4">Date & Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-amber-900/50 font-medium">
                    No bookings found. Click "New Booking" to schedule one.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-amber-50/30 transition group">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-amber-950">{booking.poojaName}</p>
                      <p className="text-xs font-mono text-amber-900/50 mt-0.5">{booking.id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-amber-900/80">{booking.devoteeName}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-amber-950">{new Date(booking.date).toLocaleDateString()}</p>
                      <p className="text-xs font-medium text-emerald-700 mt-0.5">₹{booking.amount}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.receiptNo && (
                          <span className="text-[10px] font-mono text-amber-900/50">Rec: {booking.receiptNo}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleGenerateReceipt(booking)}
                          className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          {booking.receiptNo ? "View Receipt" : "Generate Receipt"}
                        </button>
                        <button 
                          onClick={() => openEditModal(booking)}
                          className="text-xs font-bold text-amber-700 bg-amber-100/50 hover:bg-amber-200/80 border border-amber-200 px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(booking.id)}
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

      {/* --- ADD/EDIT BOOKING MODAL (Hidden during print) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto print:hidden">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-100 p-6 md:p-8 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6 border-b border-amber-100 pb-4">
              <h2 className="text-2xl font-bold text-amber-950">
                {editingId ? "Update Booking" : "Schedule New Pooja"}
              </h2>
              <button onClick={closeModal} className="text-amber-900/50 hover:text-amber-900 transition bg-amber-50 rounded-full p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Pooja Name *</label>
                  <input required type="text" value={formData.poojaName} onChange={(e) => setFormData({...formData, poojaName: e.target.value})} placeholder="e.g. Satyanarayana Pooja" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Devotee Name *</label>
                  <input required type="text" value={formData.devoteeName} onChange={(e) => setFormData({...formData, devoteeName: e.target.value})} placeholder="e.g. Ramesh Kumar" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Date *</label>
                  <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Amount (₹) *</label>
                  <input required type="number" min="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="500" className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-medium text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-800">Booking Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as "Pending" | "Confirmed" | "Completed"})} className="h-11 w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 text-sm font-bold text-amber-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="mt-4 flex gap-3 justify-end pt-4 border-t border-amber-100">
                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-70">
                  {isSubmitting ? "Saving..." : editingId ? "Update Booking" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL (Only this prints) --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/80 backdrop-blur-md p-4 print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="w-full max-w-lg bg-white rounded-none md:rounded-3xl shadow-2xl print:shadow-none p-8 relative print:w-full print:max-w-none">
            
            {/* Close Button (Hidden on Print) */}
            <button 
              onClick={() => setSelectedReceipt(null)} 
              className="absolute top-4 right-4 text-amber-900/50 hover:text-amber-900 transition bg-amber-50 rounded-full p-2 print:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Receipt Content */}
            <div className="border-[3px] border-amber-950 p-8 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <svg viewBox="0 0 64 64" className="h-64 w-64" fill="currentColor">
                  <path d="M32 18 V 2 L 46 6 L 32 12" />
                  <path d="M22 40 C 22 22 32 16 32 16 C 32 16 42 22 42 40" />
                </svg>
              </div>

              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-[var(--font-display)] font-bold text-amber-950 mb-1">{templeName}</h2>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Official Receipt</p>
              </div>

              <div className="flex justify-between items-end border-b-2 border-amber-900/10 pb-4 mb-6 relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800/60 mb-1">Receipt No</p>
                  <p className="text-lg font-mono font-bold text-amber-950">{selectedReceipt.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800/60 mb-1">Date</p>
                  <p className="text-base font-bold text-amber-950">{new Date(selectedReceipt.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8 relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800/60">Received with thanks from</p>
                  <p className="text-xl font-bold text-amber-950 mt-1">{selectedReceipt.devoteeName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800/60">For the purpose of</p>
                  <p className="text-lg font-medium text-amber-950 mt-1">{selectedReceipt.poojaName}</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl flex justify-between items-center relative z-10">
                <p className="text-sm font-bold uppercase tracking-wider text-amber-900">Total Amount</p>
                <p className="text-3xl font-bold text-emerald-800">₹{selectedReceipt.amount}</p>
              </div>
              
              <div className="mt-8 pt-6 border-t-2 border-amber-900/10 text-center relative z-10">
                <p className="text-xs font-medium text-amber-900/60">May the divine blessings be with you.</p>
                <p className="text-[10px] font-mono text-amber-900/40 mt-1">Ref: {selectedReceipt.id}</p>
              </div>
            </div>

            {/* Print Button (Hidden on Print) */}
            <div className="mt-6 flex justify-center print:hidden">
              <button 
                onClick={() => window.print()}
                className="h-11 px-8 rounded-xl bg-amber-950 font-bold text-white shadow-lg transition hover:bg-amber-900"
              >
                Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}