"use client";

import React, { useEffect, useState } from "react";

export default function MobileStickyBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-visible={isVisible}
      aria-hidden={!isVisible}
      className="mobile-sticky-bar fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-[#C8E0F8] dark:border-slate-800 px-4 pt-3 flex items-center justify-between gap-3 shadow-2xl"
    >
      <div>
        <p className="text-xs font-bold text-[#0A2540] dark:text-white">Organize &amp; Assign Leads</p>
        <p className="text-[11px] text-[#476685] dark:text-slate-400">14-day free trial • All devices</p>
      </div>
      <a
        href="https://customer-relationship-management-cr-eight.vercel.app/login?mode=signup"
        className="cta-primary-btn h-10 px-4 rounded-xl bg-gradient-to-r from-[#1B7BED] to-[#18DBF5] text-slate-950 text-xs font-bold flex items-center justify-center whitespace-nowrap shadow-md shadow-[#1B7BED]/25 cursor-pointer"
      >
        Try Free →
      </a>
    </div>
  );
}
