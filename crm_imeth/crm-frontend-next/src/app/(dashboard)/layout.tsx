"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import type { Notification } from "@/types";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Workflow,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  CheckCheck,
  AlertOctagon,
} from "lucide-react";

import { UserCheck, Clock } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/followups", label: "Follow-ups", icon: Clock },
  { href: "/users", label: "Users", icon: UserCheck },
  { href: "/admin/dead-letters", label: "Dead Letters", icon: AlertOctagon, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout, updateUser } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  // State for mobile drawer and desktop collapsed sidebar
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ── Notification state ──────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [toastNotif, setToastNotif] = useState<Notification | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications on load
  useEffect(() => {
    if (!user) return;
    apiClient<Notification[]>("/notifications")
      .then((res) => { if (res.success && res.data) setNotifications(res.data); })
      .catch(() => {});
    apiClient<{ count: number }>("/notifications/unread-count")
      .then((res) => { if (res.success && res.data) setUnreadCount(res.data.count); })
      .catch(() => {});
  }, [user]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleNew = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setToastNotif(notif);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastNotif(null);
      }, 7000);
    };
    const handleUserUpdate = (updated: { id: string; name?: string; email: string; role: string }) => {
      if (user && updated.id === user.id) {
        updateUser(updated);
      }
    };

    socket.on("new_notification", handleNew);
    socket.on("user_updated", handleUserUpdate);
    return () => {
      socket.off("new_notification", handleNew);
      socket.off("user_updated", handleUserUpdate);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [socket, user, updateUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await apiClient(`/notifications/${notif.id}/read`, { method: "PUT" }).catch(() => {});
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setNotifOpen(false);
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const markAllRead = async () => {
    await apiClient("/notifications/read-all", { method: "PUT" }).catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

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
      <div className="flex h-screen items-center justify-center bg-[#1B262C]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3282B8] border-t-transparent shadow-lg" />
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
                  WhatsApp CRM
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

        {/* Navigation Items */}
        <nav
          className="flex flex-1 flex-col gap-8 px-4 py-6 overflow-y-auto"
          style={{ gap: "32px" }}
        >
          {NAV_ITEMS.filter((item) => {
            if (item.adminOnly && user?.role !== "ADMIN") {
              return false;
            }
            if (user?.role === "AGENT") {
              return item.href !== "/settings" && item.href !== "/users";
            }
            return true;
          }).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-fluid-nav font-medium transition-all group ${
                  isActive
                    ? "bg-[#3282B8] text-white shadow-md shadow-[#3282B8]/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-[#BBE1FA]"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

          {/* User Info, Logout & Notification Bell Section */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}
              title="Notifications"
            >
              <Bell className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Notifications</span>}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 left-6 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-80 rounded-2xl border border-slate-700 bg-[#1B262C] shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#BBE1FA] hover:text-white cursor-pointer"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                          !notif.isRead ? "border-l-2 border-[#3282B8]" : ""
                        }`}
                      >
                        <p className={`text-xs font-semibold truncate ${
                          !notif.isRead ? "text-white" : "text-slate-400"
                        }`}>{notif.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User card + logout */}
          <div
            className={`flex items-center gap-4 rounded-xl bg-white/5 p-3 ${
              isCollapsed ? "justify-center flex-col gap-4" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-xs font-bold text-white shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-fluid-title font-semibold text-white leading-tight">
                  {user?.name || user?.email || "admin@crm.com"}
                </p>
                <p className="text-fluid-meta text-slate-400 truncate">
                  {user?.role === "ADMIN" ? "Admin" : user?.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"}
                  {user?.name && <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Sticky Top Header with 4-Line Hamburger Menu Icon for Mobile/Tablet */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 md:hidden shadow-xs">
          <div className="flex items-center gap-3">
            {/* 4-Line Hamburger Menu Button as requested */}
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

            {/* Brand Title */}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0F4C75] to-[#3282B8] text-sm text-white">
                💬
              </span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                WhatsApp CRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BBE1FA]/30 text-[#0F4C75] text-[11px] font-semibold border border-[#BBE1FA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3282B8] animate-pulse" />
              Live
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto page-bg-gradient">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>

      {/* Real-time Floating Notification Toast for Assigned Leads */}
      {toastNotif && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3 rounded-2xl border border-[#3282B8]/40 bg-[#1B262C]/95 backdrop-blur-md p-4 shadow-2xl ring-1 ring-[#3282B8]/20 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3282B8]/20 text-[#BBE1FA] ring-1 ring-[#3282B8]/30">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-white truncate">{toastNotif.title}</p>
                <button
                  type="button"
                  onClick={() => setToastNotif(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                {toastNotif.body}
              </p>
              {toastNotif.linkUrl && (
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleNotifClick(toastNotif);
                      setToastNotif(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#3282B8] px-2.5 py-1 text-[11px] font-semibold text-white shadow hover:bg-[#0F4C75] transition-all cursor-pointer"
                  >
                    View Lead →
                  </button>
                  <button
                    type="button"
                    onClick={() => setToastNotif(null)}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
