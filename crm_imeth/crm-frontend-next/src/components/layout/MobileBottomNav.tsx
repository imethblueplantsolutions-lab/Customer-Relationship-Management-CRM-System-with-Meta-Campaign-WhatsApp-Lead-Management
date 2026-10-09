"use client";

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

  // Define the core bottom tabs
  const tabs = [
    {
      href: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      show: true,
    },
    {
      href: "/leads",
      label: isAgent ? "My Leads" : "Leads",
      icon: Users,
      isActive: pathname.startsWith("/leads"),
      show: true,
    },
    {
      href: "/followups",
      label: "Tasks",
      icon: Clock,
      isActive: pathname.startsWith("/followups"),
      show: true,
    },
    {
      href: isSuperAdmin ? "/hierarchy" : "/users",
      label: isSuperAdmin ? "Hierarchy" : "Team",
      icon: isSuperAdmin ? Network : UserCheck,
      isActive: isSuperAdmin
        ? pathname.startsWith("/hierarchy")
        : pathname.startsWith("/users"),
      show: !isAgent, // Sales Agents don't manage other users
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.08)] transition-all"
    >
      <div className="flex w-full items-center justify-around h-15">
        {tabs
          .filter((t) => t.show)
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
                  tab.isActive
                    ? "text-brand-primary font-bold"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                {/* Active indicator bar */}
                {tab.isActive && (
                  <span className="absolute -top-1 h-1 w-6 rounded-full bg-brand-primary" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    tab.isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
                <span className="mt-1 text-[10px] tracking-tight truncate max-w-[64px]">
                  {tab.label}
                </span>
              </Link>
            );
          })}

        {/* More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="relative flex flex-1 flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 font-medium transition-all active:scale-95 cursor-pointer"
          aria-label="Open more menu"
        >
          <Menu className="h-5 w-5 stroke-[1.8]" />
          <span className="mt-1 text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
