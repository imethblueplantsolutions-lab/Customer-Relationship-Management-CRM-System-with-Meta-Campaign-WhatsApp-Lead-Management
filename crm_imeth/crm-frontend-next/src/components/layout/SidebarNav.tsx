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
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  hidden?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/followups", label: "Follow-ups", icon: Clock },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch, hidden: true },
  { href: "/flows", label: "Automation Flows", icon: Workflow, hidden: true },
  { href: "/users", label: "Users", icon: UserCheck },
  { href: "/admin/dead-letters", label: "Dead Leads", icon: AlertOctagon, adminOnly: true },
  { href: "/settings", label: "Account Settings", icon: Settings },
];

interface SidebarNavProps {
  user: User | null;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export default function SidebarNav({ user, isCollapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.hidden) {
      return false;
    }
    if (item.adminOnly && user?.role !== "ADMIN") {
      return false;
    }
    if (user?.role === "AGENT") {
      return item.href !== "/users";
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

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
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
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
