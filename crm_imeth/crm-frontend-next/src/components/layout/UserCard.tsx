"use client";

import { LogOut } from "lucide-react";
import type { User as UserType } from "@/types";

interface UserCardProps {
  user: UserType | null;
  isCollapsed: boolean;
  onLogout: () => void;
}

export default function UserCard({ user, isCollapsed, onLogout }: UserCardProps) {
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "A";

  const roleLabel =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "TEAM_LEAD"
      ? "Team Lead"
      : "Sales Agent";

  return (
    <div
      className={`flex items-center gap-4 rounded-xl bg-white/5 p-3 ${
        isCollapsed ? "justify-center flex-col gap-4" : ""
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-xs font-bold text-white shadow-sm">
        {userInitial}
      </div>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="truncate text-fluid-title font-semibold text-white leading-tight">
            {user?.name || user?.email || "admin@crm.com"}
          </p>
          <p className="text-fluid-meta text-slate-400 truncate">
            {roleLabel}
            {user?.name && (
              <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>
            )}
          </p>
        </div>
      )}
      <button
        onClick={onLogout}
        className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
