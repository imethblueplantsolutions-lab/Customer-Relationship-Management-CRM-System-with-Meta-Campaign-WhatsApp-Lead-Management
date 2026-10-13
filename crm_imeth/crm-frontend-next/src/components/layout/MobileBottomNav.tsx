"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Network,
  Menu,
  X,
  CheckCheck,
} from "lucide-react";
import type { User, Notification } from "@/types";
import { useNotifications } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils";

interface MobileBottomNavProps {
  user?: User | null;
  onOpenDrawer: () => void;
}

/**
 * Custom Notification SVG Icon provided by user
 * Line Color style adapted to match the rest of the navigation icons
 */
function NotificationCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        id="secondary"
        d="M15,18H9a3,3,0,0,0,3,3h0A3,3,0,0,0,15,18Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        id="primary"
        d="M18,9v4l1.38,1.38A2.12,2.12,0,0,1,17.88,18H6.12a2.12,2.12,0,0,1-1.5-3.62L6,13V9a6,6,0,0,1,6-6,6,6,0,0,1,2.88.73"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        id="secondary-2"
        d="M14,6a3,3,0,0,0,3,3h0a3,3,0,0,0,3-3h0a3,3,0,0,0-3-3h0a3,3,0,0,0-3,3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function MobileBottomNav({
  user,
  onOpenDrawer,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role;

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgent = role === "AGENT";

  // Reusable notification system
  const { notifications, unreadCount, markAllRead, markAsRead } =
    useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Define bottom navigation tabs with Notifications replacing Tasks
  const visibleTabs = useMemo(() => {
    const items = [
      {
        id: "home",
        href: "/dashboard",
        label: "Home",
        icon: LayoutDashboard,
        matchesRoute: pathname === "/dashboard",
        isDrawer: false,
        isNotification: false,
      },
      {
        id: "leads",
        href: "/leads",
        label: isAgent ? "My Leads" : "Leads",
        icon: Users,
        matchesRoute: pathname.startsWith("/leads"),
        isDrawer: false,
        isNotification: false,
      },
      {
        id: "notifications",
        href: "#",
        label: "Alerts",
        icon: NotificationCircleIcon,
        matchesRoute: false,
        isDrawer: false,
        isNotification: true,
      },
    ];

    if (!isAgent) {
      items.push({
        id: "team",
        href: isSuperAdmin ? "/hierarchy" : "/users",
        label: isSuperAdmin ? "Hierarchy" : "Team",
        icon: isSuperAdmin ? Network : UserCheck,
        matchesRoute: isSuperAdmin
          ? pathname.startsWith("/hierarchy")
          : pathname.startsWith("/users"),
        isDrawer: false,
        isNotification: false,
      });
    }

    items.push({
      id: "more",
      href: "#",
      label: "More",
      icon: Menu,
      matchesRoute: false,
      isDrawer: true,
      isNotification: false,
    });

    return items;
  }, [pathname, isAgent, isSuperAdmin]);

  // Find initial active index from current route
  const currentRouteIndex = useMemo(() => {
    const idx = visibleTabs.findIndex((t) => t.matchesRoute);
    return idx >= 0 ? idx : 0;
  }, [visibleTabs]);

  const [activeIdx, setActiveIdx] = useState<number>(currentRouteIndex);

  // Synchronize active indicator whenever pathname changes
  useEffect(() => {
    if (!isNotificationOpen) {
      setActiveIdx(currentRouteIndex);
    }
  }, [currentRouteIndex, isNotificationOpen]);

  const handleItemClick = (
    idx: number,
    isDrawer?: boolean,
    isNotification?: boolean
  ) => {
    setActiveIdx(idx);

    // Subtle tactile haptic vibration on mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore devices without vibration support
      }
    }

    if (isNotification) {
      setIsNotificationOpen(true);
      return;
    }

    if (isDrawer) {
      setIsNotificationOpen(false);
      onOpenDrawer();
      return;
    }

    setIsNotificationOpen(false);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
    setActiveIdx(currentRouteIndex);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsNotificationOpen(false);
    setActiveIdx(currentRouteIndex);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const totalTabs = visibleTabs.length;

  return (
    <>
      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden flex-col items-center magic-nav-container pb-[env(safe-area-inset-bottom)] select-none"
      >
        <ul className="relative flex w-full max-w-lg items-center justify-around h-[66px] m-0 p-0 list-none">
          {/* Animated Magic Floating Indicator Bubble */}
          <div
            className="magic-indicator-slot"
            style={{
              width: `${100 / totalTabs}%`,
              transform: `translateX(${activeIdx * 100}%)`,
            }}
          >
            <div className="magic-indicator-bubble" />
          </div>

          {/* Navigation Items */}
          {visibleTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeIdx === idx;
            const hasNotificationBadge = tab.isNotification && unreadCount > 0;

            return (
              <li key={tab.id} className="relative flex-1 h-full list-none">
                {tab.isDrawer ? (
                  <button
                    type="button"
                    onClick={() => handleItemClick(idx, true, false)}
                    className={`magic-nav-item cursor-pointer ${isActive ? "active" : ""}`}
                    aria-label="Open more menu drawer"
                  >
                    <span className="magic-circle-ring" />
                    <span className="magic-nav-icon relative">
                      <Icon className="w-[22px] h-[22px] stroke-[2.2]" />
                    </span>
                    <span className="magic-nav-text">{tab.label}</span>
                  </button>
                ) : tab.isNotification ? (
                  <button
                    type="button"
                    onClick={() => handleItemClick(idx, false, true)}
                    className={`magic-nav-item cursor-pointer ${isActive ? "active" : ""}`}
                    aria-label="Open notifications"
                  >
                    <span className="magic-circle-ring" />
                    <span className="magic-nav-icon relative">
                      <Icon className="w-[22px] h-[22px] stroke-[2.2]" />
                      {hasNotificationBadge && (
                        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="magic-nav-text">{tab.label}</span>
                  </button>
                ) : (
                  <Link
                    href={tab.href}
                    onClick={() => handleItemClick(idx, false, false)}
                    className={`magic-nav-item cursor-pointer ${isActive ? "active" : ""}`}
                    aria-label={tab.label}
                  >
                    <span className="magic-circle-ring" />
                    <span className="magic-nav-icon relative">
                      <Icon className="w-[22px] h-[22px] stroke-[2.2]" />
                    </span>
                    <span className="magic-nav-text">{tab.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ================= MOBILE NOTIFICATIONS BOTTOM SHEET ================= */}
      {isNotificationOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleCloseNotifications}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            aria-hidden="true"
          />

          {/* Slide-Up Bottom Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] flex flex-col rounded-t-3xl bg-white shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Grab Handle */}
            <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-slate-300 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <NotificationCircleIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Notifications
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="text-[11px] font-semibold text-brand-primary">
                      {unreadCount} unread alert{unreadCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      All caught up
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseNotifications}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-3 py-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <NotificationCircleIcon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    No notifications yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                    We will notify you here whenever task follow-ups or alerts occur.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer my-1 ${
                      !notif.isRead
                        ? notif.type === "TASK_OVERDUE"
                          ? "bg-red-50/80 border-l-3 border-red-500"
                          : notif.type === "TASK_DUE_SOON"
                          ? "bg-amber-50/80 border-l-3 border-amber-500"
                          : "bg-blue-50/70 border-l-3 border-brand-primary"
                        : "hover:bg-slate-50 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-bold leading-snug ${
                          !notif.isRead ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium whitespace-nowrap">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
