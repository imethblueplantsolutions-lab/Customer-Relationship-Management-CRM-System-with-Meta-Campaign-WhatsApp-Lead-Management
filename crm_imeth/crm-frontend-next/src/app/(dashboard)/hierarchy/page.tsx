"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { apiClient } from "@/lib/api-client";
import type { User, HierarchyResponse, HierarchyStats } from "@/types";

const OrgChartTree = dynamic(() => import("@/components/hierarchy/OrgChartTree"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-xs text-slate-500">Loading Organizational Chart...</p>
      </div>
    </div>
  ),
});
import {
  Network,
  Users,
  Crown,
  Shield,
  Zap,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Link2,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Building2,
  UserX,
  ArrowRight,
  SlidersHorizontal,
  Table,
  GitGraph,
  Grid3X3,
  X,
  Layers,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// Role styling and metadata
const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    tier: number;
    tierLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    bgClass: string;
    borderClass: string;
    scope: string;
  }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    tier: 1,
    tierLabel: "Tier 1 • Executive Root",
    icon: Crown,
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    scope: "Global Platform, Multi-Tenant Governance & Full Hierarchy",
  },
  ADMIN: {
    label: "Administrator",
    tier: 2,
    tierLabel: "Tier 2 • Operational Lead",
    icon: Shield,
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    scope: "Tenant Operations, User Management & System Configuration",
  },
  TEAM_LEAD: {
    label: "Team Lead",
    tier: 3,
    tierLabel: "Tier 3 • Squad Supervisor",
    icon: Zap,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    scope: "Sales Squad Pipelines, Lead Distribution & Agent Supervision",
  },
  AGENT: {
    label: "Sales Agent",
    tier: 4,
    tierLabel: "Tier 4 • Frontline Specialist",
    icon: Briefcase,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    scope: "Direct WhatsApp & Lead Engagements, Follow-ups & Deals",
  },
};

function getRoleMeta(role?: string) {
  return ROLE_CONFIG[role || "AGENT"] || ROLE_CONFIG.AGENT;
}

export default function UserHierarchyPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();

  // State
  const [hierarchyData, setHierarchyData] = useState<HierarchyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeView, setActiveView] = useState<"matrix" | "chart" | "tree" | "grid">("matrix");

  // Modals
  const [reassignModalUser, setReassignModalUser] = useState<User | null>(null);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [savingReassignment, setSavingReassignment] = useState(false);
  const [confirmAutoLinkOpen, setConfirmAutoLinkOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Security barrier
  useEffect(() => {
    if (!authLoading && currentUser?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [currentUser, authLoading, router]);

  // Load Hierarchy Data
  const fetchHierarchy = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setErrorMsg("");

      const res = await apiClient<HierarchyResponse>("/users/hierarchy");
      if (res.success && res.data) {
        setHierarchyData(res.data);
      } else {
        setErrorMsg(res.error || "Failed to load organizational hierarchy");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading hierarchy");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "SUPER_ADMIN") {
      fetchHierarchy();
    }
  }, [currentUser, fetchHierarchy]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleHierarchyUpdated = () => {
      fetchHierarchy(true);
    };
    const handleUserUpdated = () => {
      fetchHierarchy(true);
    };
    const handleUserDeleted = () => {
      fetchHierarchy(true);
    };

    socket.on("hierarchy_updated", handleHierarchyUpdated);
    socket.on("user_updated", handleUserUpdated);
    socket.on("user_deleted", handleUserDeleted);

    return () => {
      socket.off("hierarchy_updated", handleHierarchyUpdated);
      socket.off("user_updated", handleUserUpdated);
      socket.off("user_deleted", handleUserDeleted);
    };
  }, [socket, fetchHierarchy]);

  // Auto-link standard hierarchy
  const handleAutoLinkHierarchy = async () => {
    setAutoLinking(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>("/users/hierarchy/auto-link", {
        method: "POST",
      });
      if (res.success) {
        toast.success(res.message || "Standard hierarchy established successfully!");
        setConfirmAutoLinkOpen(false);
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Failed to auto-link hierarchy");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to auto-link hierarchy");
    } finally {
      setAutoLinking(false);
    }
  };

  // Change manager for a specific user
  const handleAssignManager = async (userId: string, managerId: string | null) => {
    setUpdatingUserId(userId);
    try {
      const res = await apiClient<User>(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          reportsToId: managerId,
        }),
      });

      if (res.success) {
        toast.success("Reporting line updated successfully!");
        setReassignModalUser(null);
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Failed to update reporting line");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update manager");
    } finally {
      setUpdatingUserId(null);
      setSavingReassignment(false);
    }
  };

  // Delete user permanently (Super Admin only)
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>(`/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.success) {
        toast.success(res.message || "User deleted successfully");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Failed to delete user");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  // Filtered users for Matrix Table
  const filteredUsers = useMemo(() => {
    if (!hierarchyData?.users) return [];
    return hierarchyData.users.filter((u) => {
      // Role filter
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "ASSIGNED" && !u.reportsToId && u.role !== "SUPER_ADMIN") return false;
      if (statusFilter === "UNASSIGNED" && (u.reportsToId || u.role === "SUPER_ADMIN")) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const managerMatch = u.manager?.name?.toLowerCase().includes(q) || u.manager?.email.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !managerMatch) return false;
      }

      return true;
    });
  }, [hierarchyData?.users, roleFilter, statusFilter, searchTerm]);

  // Potential managers for the reassign modal (cannot report to oneself)
  const potentialManagers = useMemo(() => {
    if (!hierarchyData?.users || !reassignModalUser) return [];
    return hierarchyData.users.filter((u) => u.id !== reassignModalUser.id);
  }, [hierarchyData?.users, reassignModalUser]);

  if (authLoading || currentUser?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent shadow-lg" />
          <p className="text-sm font-medium text-slate-500">Verifying Super Admin clearance...</p>
        </div>
      </div>
    );
  }

  const stats = hierarchyData?.stats;

  return (
    <div className="min-h-full space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <Network className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  User Hierarchy Matrix
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Crown className="h-3 w-3" />
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage organizational chain of command, evaluate multi-tier reporting lines, and configure team supervision.
              </p>
            </div>
          </div>
        </div>

        {/* Global Matrix Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setConfirmAutoLinkOpen(true)}
            disabled={autoLinking || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Auto-link Super Admin -> Admin -> Team Lead -> Sales Agent"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto-Link Standard Hierarchy</span>
          </button>

          <button
            onClick={() => fetchHierarchy(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ================= ERROR BANNER ================= */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchHierarchy()}
            className="underline font-semibold hover:text-red-800 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= HIERARCHY MATRIX KPI CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tier 1 - Super Admin */}
        <div className="rounded-2xl border border-purple-200/80 bg-white p-4 shadow-xs dark:border-purple-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tier 1 • Root</span>
            <Crown className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.superAdmins ?? 0}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Super Admins
          </div>
        </div>

        {/* Tier 2 - Admins */}
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-blue-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tier 2 • Executive</span>
            <Shield className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.admins ?? 0}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Administrators
          </div>
        </div>

        {/* Tier 3 - Team Leads */}
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs dark:border-amber-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tier 3 • Leads</span>
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.teamLeads ?? 0}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Team Leads
          </div>
        </div>

        {/* Tier 4 - Agents */}
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tier 4 • Frontline</span>
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.agents ?? 0}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Sales Agents
          </div>
        </div>

        {/* Reporting Link Compliance */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Chain Health</span>
            <Link2 className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.assignedCount ?? 0}/{Math.max(0, (stats?.totalUsers ?? 0) - (stats?.superAdmins ?? 0))}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {stats?.unassignedCount === 0 ? "100% Linked" : `${stats?.unassignedCount} Unassigned`}
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Reporting Lines Assigned
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & VIEW SWITCHER ================= */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, email or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-blue-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="ADMIN">Administrators</option>
              <option value="TEAM_LEAD">Team Leads</option>
              <option value="AGENT">Sales Agents</option>
            </select>
          </div>

          {/* Reporting Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by reporting status"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Has Manager</option>
            <option value="UNASSIGNED">Unassigned Manager</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveView("matrix")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "matrix"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Matrix Table</span>
          </button>

          <button
            onClick={() => setActiveView("chart")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "chart"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <GitGraph className="h-3.5 w-3.5" />
            <span>Org Chart</span>
          </button>

          <button
            onClick={() => setActiveView("tree")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "tree"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tree List</span>
          </button>

          <button
            onClick={() => setActiveView("grid")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "grid"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Role Grid</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: MATRIX TABLE ================= */}
      {activeView === "matrix" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  <th className="py-3.5 px-4 w-28">Tier Level</th>
                  <th className="py-3.5 px-4 min-w-[200px]">User Profile</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Designated Role</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Direct Manager (Reports To)</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Direct Reports (Subordinates)</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Authority Scope</th>
                  <th className="py-3.5 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  // Skeleton loader
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-6 w-16 bg-slate-200 rounded-md dark:bg-slate-800" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-24 bg-slate-200 rounded-sm dark:bg-slate-800" />
                            <div className="h-2.5 w-32 bg-slate-200 rounded-sm dark:bg-slate-800" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-20 bg-slate-200 rounded-md dark:bg-slate-800" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-8 w-36 bg-slate-200 rounded-md dark:bg-slate-800" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-md dark:bg-slate-800" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-40 bg-slate-200 rounded-sm dark:bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-7 w-16 bg-slate-200 rounded-md ml-auto dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserX className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">No team members match the current filter.</p>
                        <p className="text-xs text-slate-400">Try changing your search term or role filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const meta = getRoleMeta(u.role);
                    const RoleIcon = meta.icon;
                    const isSelf = u.id === currentUser?.id;
                    const isSuper = u.role === "SUPER_ADMIN";
                    const directReportsCount = u.teamMembers?.length || 0;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40 ${
                          isSuper ? "bg-purple-50/20 dark:bg-purple-950/10" : ""
                        }`}
                      >
                        {/* 1. Tier Level */}
                        <td className="py-4 px-4 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${meta.badgeClass}`}
                          >
                            <span className="font-mono">Tier {meta.tier}</span>
                          </span>
                        </td>

                        {/* 2. User Profile */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.name || u.email}
                                  className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 font-bold text-white text-xs shadow-xs">
                                  {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                  u.isActive !== false ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                                title={u.isActive !== false ? "Active User" : "Inactive User"}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {u.name || u.email.split("@")[0]}
                                </span>
                                {isSelf && (
                                  <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Role */}
                        <td className="py-4 px-4 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${meta.badgeClass}`}
                          >
                            <RoleIcon className="h-3.5 w-3.5" />
                            <span>{meta.label}</span>
                          </span>
                        </td>

                        {/* 4. Reporting Manager (Reports To) */}
                        <td className="py-4 px-4 align-middle">
                          {isSuper ? (
                            <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                              <Crown className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span>Executive Root (Self-Governed)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Quick Reassign Dropdown */}
                              <select
                                value={u.reportsToId || ""}
                                disabled={updatingUserId === u.id}
                                onChange={(e) => handleAssignManager(u.id, e.target.value || null)}
                                aria-label={`Select manager for ${u.name || u.email}`}
                                className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer max-w-[200px] truncate ${
                                  u.reportsToId
                                    ? "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 font-bold"
                                }`}
                              >
                                <option value="">⚠️ Unassigned (None)</option>
                                {hierarchyData?.users
                                  ?.filter((cand) => cand.id !== u.id)
                                  .map((cand) => (
                                    <option key={cand.id} value={cand.id}>
                                      {cand.name || cand.email} ({cand.role})
                                    </option>
                                  ))}
                              </select>

                              {updatingUserId === u.id && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Direct Reports (Subordinates) */}
                        <td className="py-4 px-4 align-middle">
                          {directReportsCount > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                  {directReportsCount} Direct {directReportsCount === 1 ? "Report" : "Reports"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {u.teamMembers?.map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                                    title={`${sub.name || sub.email} (${sub.role})`}
                                  >
                                    <span className="truncate max-w-[85px]">{sub.name || sub.email.split("@")[0]}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              No direct reports
                            </span>
                          )}
                        </td>

                        {/* 6. Authority Scope */}
                        <td className="py-4 px-4 align-middle">
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2" title={meta.scope}>
                            {meta.scope}
                          </p>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-4 px-4 align-middle text-right">
                          {!isSuper && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setReassignModalUser(u);
                                  setTargetManagerId(u.reportsToId || "");
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer shadow-xs"
                              >
                                <span>Manage</span>
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                              </button>

                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setIsDeleteModalOpen(true);
                                }}
                                title={`Delete ${u.name || u.email}`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 cursor-pointer transition-colors shadow-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: VISUAL TOP-DOWN ORG FLOWCHART ================= */}
      {activeView === "chart" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Top-Down Organizational Chart
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected visual flowchart mapping supervisory reporting lines across all tiers.
              </p>
            </div>
            <button
              onClick={() => setConfirmAutoLinkOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Restructure with Auto-Link</span>
            </button>
          </div>

          <OrgChartTree
            data={hierarchyData?.tree || []}
            onAssignManager={(user) => {
              setReassignModalUser(user);
              setTargetManagerId(user.reportsToId || "");
            }}
            onDeleteUser={(user) => {
              setUserToDelete(user);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* ================= VIEW 3: ORG TREE LIST ================= */}
      {activeView === "tree" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Organizational Hierarchy Tree
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual cascade from executive root down to frontline operations.
              </p>
            </div>
            <button
              onClick={() => setConfirmAutoLinkOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Restructure with Auto-Link</span>
            </button>
          </div>

          {/* Hierarchical Tree Rendering */}
          <div className="space-y-6">
            {hierarchyData?.tree && hierarchyData.tree.length > 0 ? (
              hierarchyData.tree.map((rootNode) => (
                <OrgTreeNode
                  key={rootNode.id}
                  node={rootNode}
                  onAssignManager={(user) => {
                    setReassignModalUser(user);
                    setTargetManagerId(user.reportsToId || "");
                  }}
                  onDeleteUser={(user) => {
                    setUserToDelete(user);
                    setIsDeleteModalOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="py-12 text-center text-slate-500">
                No tree nodes available. Click &quot;Auto-Link Standard Hierarchy&quot; to initialize structure.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 4: ROLE X MANAGER MATRIX GRID ================= */}
      {activeView === "grid" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Role Cross-Tabulation Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of personnel grouped by their designated role and their supervisor&apos;s role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["SUPER_ADMIN", "ADMIN", "TEAM_LEAD", "AGENT"].map((roleKey) => {
              const meta = getRoleMeta(roleKey);
              const RoleIcon = meta.icon;
              const roleUsers = hierarchyData?.users?.filter((u) => u.role === roleKey) || [];

              return (
                <div
                  key={roleKey}
                  className={`rounded-xl border p-4 flex flex-col justify-between ${meta.bgClass} ${meta.borderClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${meta.badgeClass}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        <span>{meta.label}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {roleUsers.length} {roleUsers.length === 1 ? "User" : "Users"}
                      </span>
                    </div>

                    <div className="space-y-2 mt-4">
                      {roleUsers.length > 0 ? (
                        roleUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-xs dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {u.name || u.email.split("@")[0]}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                Reports to: {u.manager?.name || u.manager?.email || (u.role === "SUPER_ADMIN" ? "Root" : "⚠️ None")}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                              {u.teamMembers?.length || 0} subs
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No users in this role tier</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-700/60 text-[10px] text-slate-500">
                    Tier {meta.tier} Authority
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN / CHANGE MANAGER ================= */}
      {reassignModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Assign Reporting Manager
                </h3>
              </div>
              <button
                onClick={() => setReassignModalUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Target User Info */}
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Target Employee</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {reassignModalUser.name || reassignModalUser.email}
                    </p>
                    <p className="text-[11px] text-slate-500">{reassignModalUser.email}</p>
                  </div>
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {reassignModalUser.role}
                  </span>
                </div>
              </div>

              {/* Select Manager Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Reporting Manager (Superior)
                </label>
                <select
                  value={targetManagerId}
                  onChange={(e) => setTargetManagerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">No Manager (Root Level / Unassigned)</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email} — {m.role}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  The subordinate will directly report to this manager for leads, escalations, and oversight.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReassignModalUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReassignment}
                onClick={() => {
                  setSavingReassignment(true);
                  handleAssignManager(reassignModalUser.id, targetManagerId || null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {savingReassignment && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM AUTO-LINK ================= */}
      {confirmAutoLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Auto-Link Standard Hierarchy?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly organize all tenant personnel into an enterprise reporting cascade.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600 shrink-0" />
                <span><strong>Super Admin:</strong> Executive Root (No superior)</span>
              </div>
              <div className="flex items-center gap-2 pl-4 border-l-2 border-purple-300 dark:border-purple-800">
                <Shield className="h-4 w-4 text-blue-600 shrink-0" />
                <span><strong>Administrators:</strong> Report to Super Admin</span>
              </div>
              <div className="flex items-center gap-2 pl-8 border-l-2 border-blue-300 dark:border-blue-800">
                <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                <span><strong>Team Leads:</strong> Report to primary Administrator</span>
              </div>
              <div className="flex items-center gap-2 pl-12 border-l-2 border-amber-300 dark:border-amber-800">
                <Briefcase className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>Sales Agents:</strong> Report to primary Team Lead</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAutoLinkOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={autoLinking}
                onClick={handleAutoLinkHierarchy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {autoLinking && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm & Auto-Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM USER DELETION ================= */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0 border border-red-200 dark:border-red-900">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Delete User Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal from tenant organizational hierarchy
                </p>
              </div>
            </div>

            {/* Target User Info */}
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    {userToDelete.name || userToDelete.email.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {userToDelete.email}
                  </p>
                </div>
                <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {userToDelete.role}
                </span>
              </div>
            </div>

            {/* Warning Message per User Prompt */}
            <div className="rounded-xl border border-red-200/80 bg-red-50/60 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 mb-5 leading-relaxed">
              <p>
                Are you sure you want to delete <strong>{userToDelete.name || userToDelete.email}</strong>? This action cannot be undone. Any agents reporting to them will lose their manager, and any leads assigned to them will be returned to the unassigned pool.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUser}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {deletingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{deletingUser ? "Deleting..." : "Delete User"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Recursive Org Tree Node ──────────────────────────────────
function OrgTreeNode({
  node,
  onAssignManager,
  onDeleteUser,
}: {
  node: User;
  onAssignManager: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = getRoleMeta(node.role);
  const RoleIcon = meta.icon;
  const hasMembers = node.teamMembers && node.teamMembers.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Expand / Collapse Button */}
        {hasMembers ? (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand subordinates" : "Collapse subordinates"}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-6 h-6 flex items-center justify-center text-slate-300 dark:text-slate-700">
            •
          </span>
        )}

        {/* User Card */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 flex-1 rounded-xl border p-3 bg-white shadow-xs dark:bg-slate-800 ${meta.borderClass}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {node.avatar ? (
              <img
                src={node.avatar}
                alt={node.name || node.email}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs">
                {node.name ? node.name.charAt(0).toUpperCase() : node.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {node.name || node.email.split("@")[0]}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${meta.badgeClass}`}>
                  <RoleIcon className="h-3 w-3" />
                  <span>{meta.label}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 truncate block">{node.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMembers && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {node.teamMembers?.length} subordinates
              </span>
            )}
            {node.role !== "SUPER_ADMIN" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAssignManager(node)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Reassign
                </button>
                {onDeleteUser && (
                  <button
                    onClick={() => onDeleteUser(node)}
                    title={`Delete ${node.name || node.email}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 cursor-pointer transition-colors shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children branches */}
      {hasMembers && !collapsed && (
        <div className="ml-6 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3">
          {node.teamMembers?.map((sub) => (
            <OrgTreeNode
              key={sub.id}
              node={sub}
              onAssignManager={onAssignManager}
              onDeleteUser={onDeleteUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
