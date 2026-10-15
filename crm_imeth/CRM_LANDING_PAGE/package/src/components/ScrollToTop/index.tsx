'use client';

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="scroll to top"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#1B7BED] text-white shadow-lg shadow-[#1B7BED]/25 transition duration-200 ease-in-out hover:bg-[#1569cb] hover:scale-105 active:scale-95"
      >
        <span className="mt-1 h-2.5 w-2.5 rotate-45 border-l-2 border-t-2 border-white"></span>
      </button>
    </div>
  );
}
