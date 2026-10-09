"use client";

import { useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export default function MobileFAB() {
  const router = useRouter();
  const pathname = usePathname();

  const handleAddLead = () => {
    if (pathname === "/leads") {
      window.dispatchEvent(new CustomEvent("crm:open-add-lead"));
      router.push(`/leads?action=new&t=${Date.now()}`);
    } else {
      router.push("/leads?action=new");
    }
  };

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden flex flex-col items-end">
      {/* Main Floating Trigger Button: 1-Tap Direct Add New Lead */}
      <button
        type="button"
        onClick={handleAddLead}
        aria-label="Add New Lead"
        title="Add New Lead"
        className="relative z-40 flex h-13 w-13 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 active:scale-90 bg-gradient-to-tr from-[#0F4C75] via-[#1B7BED] to-[#3282B8] shadow-brand-primary/40 hover:shadow-2xl hover:scale-105 cursor-pointer"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
