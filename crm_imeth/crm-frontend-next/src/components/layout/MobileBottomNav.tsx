"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  UserCheck,
  Network,
  Menu,
} from "lucide-react";
import type { User } from "@/types";

interface MobileBottomNavProps {
  user?: User | null;
  onOpenDrawer: () => void;
}

export default function MobileBottomNav({
  user,
  onOpenDrawer,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const role = user?.role;

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgent = role === "AGENT";

  // Define bottom navigation tabs based on user role
  const visibleTabs = useMemo(() => {
    const items = [
      {
        id: "home",
        href: "/dashboard",
        label: "Home",
        icon: LayoutDashboard,
        matchesRoute: pathname === "/dashboard",
        isDrawer: false,
      },
      {
        id: "leads",
        href: "/leads",
        label: isAgent ? "My Leads" : "Leads",
        icon: Users,
        matchesRoute: pathname.startsWith("/leads"),
        isDrawer: false,
      },
      {
        id: "followups",
        href: "/followups",
        label: "Tasks",
        icon: Clock,
        matchesRoute: pathname.startsWith("/followups"),
        isDrawer: false,
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
      });
    }

    items.push({
      id: "more",
      href: "#",
      label: "More",
      icon: Menu,
      matchesRoute: false,
      isDrawer: true,
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
    setActiveIdx(currentRouteIndex);
  }, [currentRouteIndex]);

  const handleItemClick = (idx: number, isDrawer?: boolean) => {
    setActiveIdx(idx);

    // Subtle tactile haptic vibration on mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore devices without vibration support
      }
    }

    if (isDrawer) {
      onOpenDrawer();
    }
  };

  const totalTabs = visibleTabs.length;

  return (
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

          return (
            <li key={tab.id} className="relative flex-1 h-full list-none">
              {tab.isDrawer ? (
                <button
                  type="button"
                  onClick={() => handleItemClick(idx, true)}
                  className={`magic-nav-item cursor-pointer ${isActive ? "active" : ""}`}
                  aria-label="Open more menu drawer"
                >
                  <span className="magic-circle-ring" />
                  <span className="magic-nav-icon">
                    <Icon className="w-[22px] h-[22px] stroke-[2.2]" />
                  </span>
                  <span className="magic-nav-text">{tab.label}</span>
                </button>
              ) : (
                <Link
                  href={tab.href}
                  onClick={() => handleItemClick(idx, false)}
                  className={`magic-nav-item cursor-pointer ${isActive ? "active" : ""}`}
                  aria-label={tab.label}
                >
                  <span className="magic-circle-ring" />
                  <span className="magic-nav-icon">
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
  );
}
