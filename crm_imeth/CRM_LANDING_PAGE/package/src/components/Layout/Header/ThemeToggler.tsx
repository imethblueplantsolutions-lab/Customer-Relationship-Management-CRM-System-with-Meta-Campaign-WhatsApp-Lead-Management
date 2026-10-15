'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggler = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        aria-hidden="true" 
        className="w-9 h-9 rounded-xl border border-[#C8E0F8] dark:border-slate-800 bg-[#DEEEFD]/50 dark:bg-slate-900/50" 
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8E0F8] bg-[#DEEEFD] text-[#0A2540] transition-all duration-200 hover:border-[#1B7BED] hover:bg-[#cbe2f8] hover:text-[#1B7BED] dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-[#18DBF5] dark:hover:bg-slate-800 dark:hover:text-[#18DBF5] shadow-xs cursor-pointer"
    >
      {isDark ? (
        // Sun Icon for Dark Mode (click to switch to Light)
        <svg
          className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-45 text-[#18DBF5]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon Icon for Light Mode (click to switch to Dark)
        <svg
          className="h-4.5 w-4.5 transition-transform duration-300 group-hover:-rotate-12 text-[#1B7BED]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggler;
