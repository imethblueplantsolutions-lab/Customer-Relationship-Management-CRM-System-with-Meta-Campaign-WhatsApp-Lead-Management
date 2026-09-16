"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SidebarNav from "@/components/layout/SidebarNav";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import UserCard from "@/components/layout/UserCard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  // State for mobile drawer and desktop collapsed sidebar
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* ================= MOBILE BACKDROP OVERLAY ================= */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ================= SIDEBAR (DESKTOP & MOBILE DRAWER) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1B262C] text-white shadow-2xl transition-all duration-300 ease-in-out md:static ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] text-xl shadow-md shadow-[#3282B8]/20">
              💬
            </span>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="text-fluid-title font-bold tracking-tight text-white truncate">
                  MyCRM
                </h1>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop Minimize Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Items (Decomposed into SidebarNav) */}
        <SidebarNav
          user={user}
          isCollapsed={isCollapsed}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Footer with Notification Bell & User Card */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <NotificationDropdown isCollapsed={isCollapsed} />
          <UserCard user={user} isCollapsed={isCollapsed} onLogout={logout} />
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Sticky Top Header with 4-Line Hamburger Menu Icon for Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 md:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
              aria-label="Open navigation menu"
            >
              <svg
                className="w-6 h-6 text-[#0F4C75]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="4" width="18" height="2.2" rx="1.1" />
                <rect x="3" y="9.5" width="18" height="2.2" rx="1.1" />
                <rect x="3" y="15" width="18" height="2.2" rx="1.1" />
                <rect x="3" y="20.5" width="18" height="2.2" rx="1.1" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] text-sm text-white">
                💬
              </span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                MyCRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isConnected
                  ? "bg-[#BBE1FA]/30 text-[#0F4C75] border-[#BBE1FA]"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-blue-600 animate-pulse" : "bg-slate-400"
                }`}
              />
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
