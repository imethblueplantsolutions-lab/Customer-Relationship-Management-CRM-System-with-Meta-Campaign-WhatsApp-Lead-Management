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
      className="mobile-sticky-bar fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-4 pt-3 flex items-center justify-between gap-3"
    >
      <div>
        <p className="text-xs font-bold text-white">Convert Meta Leads in 60s</p>
        <p className="text-[11px] text-slate-400">14-day free trial • No card needed</p>
      </div>
      <a
        href="https://customer-relationship-management-cr-eight.vercel.app/login?mode=signup"
        className="cta-primary-btn h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center whitespace-nowrap shadow-md cursor-pointer"
      >
        Start Free →
      </a>
    </div>
  );
}
