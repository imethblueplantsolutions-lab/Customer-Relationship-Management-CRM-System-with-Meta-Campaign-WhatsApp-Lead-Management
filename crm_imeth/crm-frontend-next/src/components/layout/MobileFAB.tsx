"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, MessageSquare, X } from "lucide-react";

export default function MobileFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const fabRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleAddLead = () => {
    setOpen(false);
    router.push("/leads?action=new");
  };

  const handleQuickWhatsApp = () => {
    setOpen(false);
    const phone = window.prompt("Enter customer phone number with country code (e.g., 94771234567):");
    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div
      ref={fabRef}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden flex flex-col items-end"
    >
      {/* Speed Dial Menu Items */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          />

          <div className="relative z-40 mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Action 1: Add New Lead */}
            <button
              type="button"
              onClick={handleAddLead}
              className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-xl border border-slate-200/80 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Add New Lead</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <UserPlus className="h-4 w-4" />
              </span>
            </button>

            {/* Action 2: Quick WhatsApp Direct */}
            <button
              type="button"
              onClick={handleQuickWhatsApp}
              className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-xl border border-slate-200/80 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <span>Quick WhatsApp</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MessageSquare className="h-4 w-4" />
              </span>
            </button>
          </div>
        </>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        className={`relative z-40 flex h-13 w-13 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 active:scale-90 cursor-pointer ${
          open
            ? "bg-slate-800 rotate-45 shadow-slate-900/30"
            : "bg-gradient-to-tr from-[#0F4C75] via-[#1B7BED] to-[#3282B8] shadow-brand-primary/40 hover:shadow-2xl hover:scale-105"
        }`}
      >
        <Plus className="h-6 w-6 stroke-[2.5] transition-transform duration-200" />
      </button>
    </div>
  );
}
