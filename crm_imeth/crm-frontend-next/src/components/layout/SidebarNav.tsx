"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  GitBranch,
  Workflow,
  UserCheck,
  AlertOctagon,
  Settings,
  Network,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";

interface NavItem {
  href: string;
  label: string | ((role?: string) => string);
  icon: LucideIcon;
  allowedRoles?: string[];
  hidden?: boolean;
}

/**
 * Navigation Item Registry with Role-Based Access Control (RBAC)
 * Role Hierarchy: SUPER_ADMIN > ADMIN > TEAM_LEAD > AGENT
 */
const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["ADMIN", "TEAM_LEAD", "AGENT"],
  },
  {
    href: "/leads",
    label: (role) => (role === "AGENT" ? "My Leads" : "Leads"),
    icon: Users,
    allowedRoles: ["ADMIN", "TEAM_LEAD", "AGENT"],
  },
  {
    href: "/followups",
    label: "Follow-ups",
    icon: Clock,
    allowedRoles: ["ADMIN", "TEAM_LEAD", "AGENT"],
  },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch, hidden: true },
  { href: "/flows", label: "Automation Flows", icon: Workflow, hidden: true },
  {
    href: "/users",
    label: "Users",
    icon: UserCheck,
    allowedRoles: ["ADMIN", "TEAM_LEAD"],
  },
  {
    href: "/hierarchy",
    label: "User Hierarchy",
    icon: Network,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    href: "/admin/dead-letters",
    label: "Dead Leads",
    icon: AlertOctagon,
    allowedRoles: ["ADMIN"],
  },
  {
    href: "/settings",
    label: "Account Settings",
    icon: Settings,
  },
];

interface SidebarNavProps {
  user?: User | null;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export default function SidebarNav({ user: propUser, isCollapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const userRole = user?.role;

  // Filter navigation items based on strict RBAC allowances
  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.hidden) {
      return false;
    }
    // Items with explicit role restrictions
    if (item.allowedRoles) {
      if (!userRole || !item.allowedRoles.includes(userRole)) {
        return false;
      }
    }
    return true;
  });

  return (
    <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4 overflow-y-auto">
      {filteredItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        const itemLabel = typeof item.label === "function" ? item.label(userRole) : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={isCollapsed ? itemLabel : undefined}
            className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all group ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <Icon
              className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-blue-300"
              }`}
            />
            {!isCollapsed && <span className="truncate">{itemLabel}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
