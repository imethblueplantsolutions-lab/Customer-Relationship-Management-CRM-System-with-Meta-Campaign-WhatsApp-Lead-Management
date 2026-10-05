"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { X, ChevronLeft, ChevronRight, Settings, LogOut, Palette } from "lucide-react";
import SidebarNav from "@/components/layout/SidebarNav";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import UserCard from "@/components/layout/UserCard";
import { useTheme } from "@/hooks/use-theme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // State for mobile drawer and desktop collapsed sidebar
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "TEAM_LEAD"
      ? "Team Lead"
      : "Sales Agent";

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Close mobile drawer and profile dropdown on route change
  useEffect(() => {
    setMobileOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-lg" />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-200 bg-brand-bg text-brand-text"
    >
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
        style={{ backgroundColor: "var(--color-bg-sidebar, #1B262C)" }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col text-white shadow-2xl transition-all duration-300 ease-in-out md:static ${
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
        <header className="flex h-16 items-center justify-between border-b border-brand-muted/30 bg-brand-surface px-4 sm:px-6 md:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center rounded-xl p-2 text-brand-text hover:bg-brand-bg transition-all cursor-pointer active:scale-95"
              aria-label="Open navigation menu"
            >
              <svg
                className="w-6 h-6 text-brand-primary"
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
              <span className="text-sm font-bold text-brand-text tracking-tight">
                MyCRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">

            {/* User Profile Avatar with Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="shrink-0 cursor-pointer active:scale-95 transition-transform"
                title="Account Menu"
                aria-label="Account menu"
                aria-expanded={isProfileOpen}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Avatar"}
                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-brand-muted/30 shadow-xs"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-[11px] font-bold text-white shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
              </button>

              {/* Mobile Account Popover Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-brand-surface p-2 shadow-xl ring-1 ring-brand-muted/20 border border-brand-muted/20 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header: User details & Role */}
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-bold text-brand-text truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-brand-muted truncate mb-1.5">
                      {user?.email || "user@crm.com"}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="my-1 border-b border-brand-muted/20" />

                  {/* Account Settings Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-brand-muted" />
                    Account Settings
                  </button>

                  {/* Theme Options Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/settings?tab=theme");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg rounded-xl transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-brand-primary" />
                    Theme Options
                  </button>

                  {/* Exit / Log Out Link */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Exit / Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden transition-colors duration-200 bg-brand-bg text-brand-text"
        >
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
