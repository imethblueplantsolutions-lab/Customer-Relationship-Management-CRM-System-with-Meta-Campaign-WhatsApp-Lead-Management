"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/RoleGuard";
import { useSocket } from "@/hooks/use-socket";
import { apiClient, ApiError } from "@/lib/api-client";
import type { User, HierarchyResponse, HierarchyStats } from "@/types";
import PlanLimitAlert from "@/components/ui/PlanLimitAlert";

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
import ActivityFeed from "@/components/hierarchy/ActivityFeed";
import {
  Network,
  History,
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
  UserPlus,
  Copy,
  Lock,
  Unlock,
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

// Role manager requirement map (mirrors backend hierarchyValidation.js)
const REQUIRED_MANAGER_ROLE: Record<string, string[]> = {
  AGENT: ["TEAM_LEAD", "ADMIN"],
  TEAM_LEAD: ["ADMIN"],
  ADMIN: ["SUPER_ADMIN"],
};

const REQUIRED_MANAGER_LABEL: Record<string, string> = {
  AGENT: "Team Lead or Administrator",
  TEAM_LEAD: "Administrator",
  ADMIN: "Super Admin",
};

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
  const [activeView, setActiveView] = useState<"matrix" | "chart" | "tree" | "grid" | "audit">("matrix");

  // Modals
  const [reassignModalUser, setReassignModalUser] = useState<User | null>(null);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [savingReassignment, setSavingReassignment] = useState(false);
  const [confirmAutoLinkOpen, setConfirmAutoLinkOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockingUser, setBlockingUser] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    role: "AGENT",
    reportsToId: "",
    password: "",
    maxTeamLeads: 1,
    maxAgents: 1,
  });
  const [quotaMaxTeamLeads, setQuotaMaxTeamLeads] = useState<number>(1);
  const [quotaMaxAgents, setQuotaMaxAgents] = useState<number>(1);
  const [hierarchyPlanAlert, setHierarchyPlanAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (reassignModalUser) {
      setQuotaMaxTeamLeads(reassignModalUser.maxTeamLeads ?? 1);
      setQuotaMaxAgents(reassignModalUser.maxAgents ?? 1);
    }
  }, [reassignModalUser]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdTempModal, setCreatedTempModal] = useState<{
    email: string;
    role: string;
    tempPasswordPreview: string;
  } | null>(null);
  const [copiedTempPass, setCopiedTempPass] = useState(false);

  // Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkReassignModalOpen, setIsBulkReassignModalOpen] = useState(false);
  const [bulkTargetManagerId, setBulkTargetManagerId] = useState<string>("");
  const [bulkReassigning, setBulkReassigning] = useState(false);

  // Load Hierarchy Data
  const fetchHierarchy = useCallback(async (isSilent = false) => {
    if (currentUser && !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return;
    }
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setErrorMsg("");

      const res = await apiClient<HierarchyResponse>(`/users/hierarchy?_t=${Date.now()}`);
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

  // Change manager & quota settings for a specific user
  const handleAssignManager = async (
    userId: string,
    managerId: string | null,
    quotaUpdates?: { maxTeamLeads?: number; maxAgents?: number }
  ) => {
    setUpdatingUserId(userId);
    try {
      const payload: Record<string, any> = {
        reportsToId: managerId,
      };
      if (quotaUpdates) {
        if (quotaUpdates.maxTeamLeads !== undefined) payload.maxTeamLeads = quotaUpdates.maxTeamLeads;
        if (quotaUpdates.maxAgents !== undefined) payload.maxAgents = quotaUpdates.maxAgents;
      }

      const res = await apiClient<User>(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("User management settings updated successfully!");
        setReassignModalUser(null);
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Failed to update user settings");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update user settings");
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

  // Block or reactivate user account (Super Admin only)
  const handleToggleBlockUser = async () => {
    if (!userToBlock) return;
    const shouldBlock = userToBlock.isActive !== false;
    setBlockingUser(true);
    try {
      const res = await apiClient<User>(`/users/${userToBlock.id}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: !shouldBlock,
        }),
      });

      if (res.success) {
        toast.success(
          shouldBlock
            ? `Account for ${userToBlock.name || userToBlock.email} has been blocked.`
            : `Account for ${userToBlock.name || userToBlock.email} has been reactivated.`
        );
        setIsBlockModalOpen(false);
        setUserToBlock(null);
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Failed to update user status");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setBlockingUser(false);
    }
  };

  // Copy temporary credentials helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTempPass(true);
      toast.success("Temporary password copied to clipboard!");
      setTimeout(() => setCopiedTempPass(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Provision new user into the hierarchy
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email.trim()) {
      toast.error("Email address is required");
      return;
    }
    setCreatingUser(true);
    setHierarchyPlanAlert(null);
    try {
      const res = await apiClient<{
        user: User;
        tempPasswordPreview?: string;
      }>("/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUserForm.name.trim() || undefined,
          email: newUserForm.email.trim(),
          role: newUserForm.role,
          reportsToId: newUserForm.reportsToId.trim() || undefined,
          password: newUserForm.password.trim() || undefined,
          maxTeamLeads: newUserForm.role === "ADMIN" ? newUserForm.maxTeamLeads : undefined,
          maxAgents: newUserForm.role === "TEAM_LEAD" ? newUserForm.maxAgents : undefined,
        }),
      });

      if (res.success && res.data) {
        toast.success(`User ${newUserForm.name || newUserForm.email} provisioned successfully!`);
        setIsAddUserModalOpen(false);
        const tempPass = res.data.tempPasswordPreview;
        const createdRole = newUserForm.role;
        const createdEmail = newUserForm.email.trim();
        setNewUserForm({
          name: "",
          email: "",
          role: "AGENT",
          reportsToId: "",
          password: "",
          maxTeamLeads: 1,
          maxAgents: 1,
        });
        await fetchHierarchy(true);

        if (tempPass) {
          setCreatedTempModal({
            email: createdEmail,
            role: createdRole,
            tempPasswordPreview: tempPass,
          });
        }
      } else {
        toast.error(res.error || "Failed to create user");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT_REACHED") {
        setHierarchyPlanAlert({
          title: err.title || "Unavailable with your plan",
          message: err.message || "Upgrade to a pay-as-you-go account to use this feature.",
        });
        toast.error(err.title || "Unavailable with your plan");
      } else {
        toast.error(err instanceof Error ? err.message : "Error creating user");
      }
    } finally {
      setCreatingUser(false);
    }
  };

  // Filtered users for Matrix Table (declared before bulk helpers that depend on it)
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

  // ─── Bulk Selection Helpers ──────────────────────────────────────────────────
  const toggleSelection = useCallback((id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    // Only toggle non-SUPER_ADMIN users from the filtered list
    const selectable = filteredUsers.filter((u) => u.role !== "SUPER_ADMIN");
    const allSelected = selectable.every((u) => selectedUserIds.has(u.id));
    if (allSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectable.map((u) => u.id)));
    }
  }, [filteredUsers, selectedUserIds]);

  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
  }, []);

  // Detect whether the current checkbox selection spans multiple role tiers
  const selectedRolesSet = useMemo(() => {
    return new Set(
      Array.from(selectedUserIds)
        .map((id) => hierarchyData?.users?.find((u) => u.id === id)?.role)
        .filter(Boolean) as string[]
    );
  }, [selectedUserIds, hierarchyData?.users]);

  const isMixedRoleSelection = selectedRolesSet.size > 1;

  // Bulk reassign all selected users to a new manager
  const handleBulkReassign = async () => {
    if (selectedUserIds.size === 0) return;
    setBulkReassigning(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>("/users/hierarchy/bulk-reassign", {
        method: "PUT",
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          reportsToId: bulkTargetManagerId || null,
        }),
      });

      if (res.success) {
        toast.success(res.message || `${selectedUserIds.size} users reassigned successfully!`);
        setIsBulkReassignModalOpen(false);
        setBulkTargetManagerId("");
        setSelectedUserIds(new Set());
        // Socket.IO listener will auto-refetch, but also do an explicit silent refresh
        await fetchHierarchy(true);
      } else {
        toast.error(res.error || "Bulk reassignment failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to perform bulk reassignment");
    } finally {
      setBulkReassigning(false);
    }
  };

  // Potential managers for the reassign modal (cannot report to oneself)
  // Recursively collect all downstream subordinate IDs to prevent circular hierarchy assignment
  const potentialManagers = useMemo(() => {
    if (!hierarchyData?.users || !reassignModalUser) return [];

    const getSubordinateIds = (user: User): Set<string> => {
      const ids = new Set<string>();
      const traverse = (node: User) => {
        if (node.teamMembers) {
          for (const sub of node.teamMembers) {
            ids.add(sub.id);
            const fullSub = hierarchyData!.users.find((u) => u.id === sub.id);
            if (fullSub) traverse(fullSub);
          }
        }
      };
      traverse(user);
      return ids;
    };

    const subordinateIds = getSubordinateIds(reassignModalUser);

    // Upward Reporting: AGENT -> TEAM_LEAD / ADMIN, TEAM_LEAD -> ADMIN, ADMIN -> SUPER_ADMIN
    const allowedManagerRoles = REQUIRED_MANAGER_ROLE[reassignModalUser.role] || [];
    const targetTenantId = reassignModalUser.tenantId;

    return hierarchyData.users.filter(
      (u) =>
        u.id !== reassignModalUser.id &&
        !subordinateIds.has(u.id) &&
        (u.role === "SUPER_ADMIN" || !targetTenantId || u.tenantId === targetTenantId) &&
        (allowedManagerRoles.length > 0 ? allowedManagerRoles.includes(u.role) : false)
    );
  }, [hierarchyData?.users, reassignModalUser]);

  // Potential managers for the BULK reassign modal — exclude all selected users & their downstream subordinates
  const bulkPotentialManagers = useMemo(() => {
    if (!hierarchyData?.users || selectedUserIds.size === 0) return [];

    const excludeIds = new Set<string>(selectedUserIds);

    // For each selected user, collect their downstream subordinates
    for (const selectedId of selectedUserIds) {
      const selectedUser = hierarchyData.users.find((u) => u.id === selectedId);
      if (selectedUser) {
        const traverse = (node: User) => {
          if (node.teamMembers) {
            for (const sub of node.teamMembers) {
              excludeIds.add(sub.id);
              const fullSub = hierarchyData!.users.find((u) => u.id === sub.id);
              if (fullSub) traverse(fullSub);
            }
          }
        };
        traverse(selectedUser);
      }
    }

    // Determine if all selected users share a common tier
    const selectedRoles = new Set(
      Array.from(selectedUserIds)
        .map((id) => hierarchyData.users.find((u) => u.id === id)?.role)
        .filter(Boolean)
    );

    let allowedManagerRoles: string[] | null = null;
    let targetTenantId: string | null = null;
    if (selectedRoles.size === 1) {
      const singleRole = Array.from(selectedRoles)[0];
      if (singleRole && REQUIRED_MANAGER_ROLE[singleRole]) {
        allowedManagerRoles = REQUIRED_MANAGER_ROLE[singleRole];
      }
      const firstUser = hierarchyData.users.find((u) => selectedUserIds.has(u.id));
      if (firstUser) targetTenantId = firstUser.tenantId;
    }

    return hierarchyData.users.filter(
      (u) =>
        !excludeIds.has(u.id) &&
        (u.role === "SUPER_ADMIN" || !targetTenantId || u.tenantId === targetTenantId) &&
        (allowedManagerRoles ? allowedManagerRoles.includes(u.role) : true)
    );
  }, [hierarchyData?.users, selectedUserIds]);

  const stats = hierarchyData?.stats;

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
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
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-purple-600/20 hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Member</span>
          </button>

          <button
            onClick={() => setConfirmAutoLinkOpen(true)}
            disabled={autoLinking || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
            title="Auto-link Super Admin -> Admin -> Team Lead -> Sales Agent"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto-Link Hierarchy</span>
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

          <button
            onClick={() => setActiveView("audit")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "audit"
                ? "bg-white text-purple-600 shadow-xs dark:bg-slate-700 dark:text-purple-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit Feed</span>
          </button>
        </div>
      </div>

      {/* ================= BULK ACTION BAR (Sticky) ================= */}
      {selectedUserIds.size > 0 && activeView === "matrix" && (
        <div className="sticky top-0 z-30 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/90 px-5 py-3 shadow-md backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/80">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
                {selectedUserIds.size}
              </div>
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-100">
                  {selectedUserIds.size} {selectedUserIds.size === 1 ? "user" : "users"} selected
                </span>
                <p className="text-[10px] text-blue-600 dark:text-blue-300">
                  Use bulk actions to reassign all selected users at once
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isMixedRoleSelection}
                onClick={() => {
                  setBulkTargetManagerId("");
                  setIsBulkReassignModalOpen(true);
                }}
                title={
                  isMixedRoleSelection
                    ? "All selected users must share the same role tier before bulk reassignment"
                    : "Bulk reassign all selected users to a new manager"
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 ${
                  isMixedRoleSelection
                    ? "bg-slate-400 cursor-not-allowed opacity-70"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Bulk Reassign Manager</span>
              </button>
              {isMixedRoleSelection && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Mixed tiers selected
                </span>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200 cursor-pointer transition-all"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: MATRIX TABLE ================= */}
      {activeView === "matrix" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  <th className="py-3.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.filter((u) => u.role !== "SUPER_ADMIN").length > 0 &&
                        filteredUsers.filter((u) => u.role !== "SUPER_ADMIN").every((u) => selectedUserIds.has(u.id))
                      }
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      aria-label="Select all users"
                    />
                  </th>
                  <th className="py-3.5 px-4 w-28">Tier Level</th>
                  <th className="py-3.5 px-4 min-w-[200px]">User Profile</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Designated Role</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Direct Manager (Reports To)</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Direct Reports (Subordinates)</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Capacity Quota</th>
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
                    <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
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
                    const isSelected = selectedUserIds.has(u.id);

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40 ${
                          isSuper ? "bg-purple-50/20 dark:bg-purple-950/10" : ""
                        } ${isSelected ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`}
                      >
                        {/* 0. Selection Checkbox */}
                        <td className="py-4 px-3 align-middle">
                          {!isSuper ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(u.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                              aria-label={`Select ${u.name || u.email}`}
                            />
                          ) : (
                            <span className="block h-4 w-4" />
                          )}
                        </td>
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
                                onChange={(e) => {
                                  const newManagerId = e.target.value || null;
                                  const managerUser = hierarchyData?.users?.find((m) => m.id === newManagerId);
                                  const managerLabel = managerUser
                                    ? (managerUser.name || managerUser.email)
                                    : "None (Unassigned)";
                                  if (window.confirm(`Reassign ${u.name || u.email} to report to ${managerLabel}?`)) {
                                    handleAssignManager(u.id, newManagerId);
                                  } else {
                                    e.target.value = u.reportsToId || "";
                                  }
                                }}
                                aria-label={`Select manager for ${u.name || u.email}`}
                                className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer max-w-[200px] truncate ${
                                  u.reportsToId
                                    ? "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 font-bold"
                                }`}
                              >
                                <option value="">⚠️ Unassigned (None)</option>
                                {(() => {
                                  const allowedRoles = REQUIRED_MANAGER_ROLE[u.role] || [];
                                  const targetTenantId = u.tenantId;
                                  const tierCandidates = hierarchyData?.users?.filter(
                                    (cand) =>
                                      cand.id !== u.id &&
                                      (cand.role === "SUPER_ADMIN" || !targetTenantId || cand.tenantId === targetTenantId) &&
                                      (allowedRoles.length > 0 ? allowedRoles.includes(cand.role) : false)
                                  ) || [];
                                  if (tierCandidates.length === 0) {
                                    return (
                                      <option disabled value="__none__">
                                        — No {REQUIRED_MANAGER_LABEL[u.role] || "eligible"} managers available —
                                      </option>
                                    );
                                  }
                                  return tierCandidates.map((cand) => {
                                    const targetSubRole = u.role;
                                    const activeCount = hierarchyData?.users?.filter(
                                      (sub) => sub.reportsToId === cand.id && sub.role === targetSubRole && sub.isActive !== false
                                    ).length || 0;
                                    const limit = targetSubRole === "TEAM_LEAD" ? (cand.maxTeamLeads ?? 1) : targetSubRole === "AGENT" ? (cand.maxAgents ?? 1) : 999;
                                    const isFull = activeCount >= limit && u.reportsToId !== cand.id;

                                    return (
                                      <option key={cand.id} value={cand.id} disabled={isFull}>
                                        {cand.name ? `${cand.name} (${cand.email})` : cand.email} ({activeCount}/{limit}){isFull ? " ⚠️ FULL" : ""}
                                      </option>
                                    );
                                  });
                                })()}
                              </select>
                              {!u.reportsToId && REQUIRED_MANAGER_LABEL[u.role] && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                  Must report to a {REQUIRED_MANAGER_LABEL[u.role]}
                                </p>
                              )}

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

                        {/* 6. Capacity Quota */}
                        <td className="py-4 px-4 align-middle">
                          {u.role === "ADMIN" ? (() => {
                            const activeCount = hierarchyData?.users?.filter(
                              (sub) => sub.reportsToId === u.id && sub.role === "TEAM_LEAD" && sub.isActive !== false
                            ).length || 0;
                            const maxTL = u.maxTeamLeads ?? 1;
                            const maxAgents = u.maxAgents ?? 1;
                            const isFull = activeCount >= maxTL;
                            return (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                    isFull
                                      ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  }`}
                                >
                                  <span>TL Quota: {activeCount} / {maxTL}</span>
                                  {isFull && (
                                    <span className="text-[9px] uppercase font-extrabold bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 px-1.5 py-0.2 rounded-md">
                                      Full
                                    </span>
                                  )}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  Agent Cap / TL: {maxAgents}
                                </span>
                              </div>
                            );
                          })() : u.role === "TEAM_LEAD" ? (() => {
                            const activeCount = hierarchyData?.users?.filter(
                              (sub) => sub.reportsToId === u.id && sub.role === "AGENT" && sub.isActive !== false
                            ).length || 0;
                            const max = u.maxAgents ?? 1;
                            const isFull = activeCount >= max;
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                  isFull
                                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                }`}
                              >
                                <span>Agent Quota: {activeCount} / {max}</span>
                                {isFull && (
                                  <span className="text-[9px] uppercase font-extrabold bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 px-1.5 py-0.2 rounded-md">
                                    Full
                                  </span>
                                )}
                              </span>
                            );
                          })() : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">—</span>
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
                                  setUserToBlock(u);
                                  setIsBlockModalOpen(true);
                                }}
                                title={u.isActive !== false ? `Block ${u.name || u.email}` : `Reactivate ${u.name || u.email}`}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer transition-colors shadow-xs ${
                                  u.isActive !== false
                                    ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                                }`}
                              >
                                {u.isActive !== false ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
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
          <div className="mb-5 flex items-center justify-between">
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

          {/* Role Chain Legend Banner */}
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
              Strict Chain:
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              <Crown className="h-3 w-3" />
              Super Admin
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              <Shield className="h-3 w-3" />
              Admin
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Zap className="h-3 w-3" />
              Team Lead
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Briefcase className="h-3 w-3" />
              Agent
            </span>
            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
              Each tier reports strictly to the tier directly above it
            </span>
          </div>

          {/* Hierarchical Tree Rendering */}
          <div className="space-y-6">
            {hierarchyData?.tree && hierarchyData.tree.length > 0 ? (
              hierarchyData.tree.map((rootNode) => (
                <OrgTreeNode
                  key={rootNode.id}
                  node={rootNode}
                  depth={0}
                  onAssignManager={(user) => {
                    setReassignModalUser(user);
                    setTargetManagerId(user.reportsToId || "");
                  }}
                  onDeleteUser={(user) => {
                    setUserToDelete(user);
                    setIsDeleteModalOpen(true);
                  }}
                  onBlockUser={(user) => {
                    setUserToBlock(user);
                    setIsBlockModalOpen(true);
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
                            <div className="min-w-0 pr-2 flex-1">
                              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {u.name || u.email.split("@")[0]}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {u.email}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                Reports to: {u.manager?.name ? `${u.manager.name} (${u.manager.email})` : (u.manager?.email || (u.role === "SUPER_ADMIN" ? "Root" : "⚠️ None"))}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                {u.teamMembers?.length || 0} subs
                              </span>
                              {u.role !== "SUPER_ADMIN" && (() => {
                                const allowedMgrRoles = REQUIRED_MANAGER_ROLE[u.role] || [];
                                const managerRole = u.manager?.role;
                                const hasManager = !!u.reportsToId;
                                const isCompliant = hasManager && Boolean(managerRole && allowedMgrRoles.includes(managerRole));
                                const isViolation = hasManager && Boolean(managerRole && !allowedMgrRoles.includes(managerRole));
                                if (!hasManager) {
                                  return (
                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                      ⚠ Unassigned
                                    </span>
                                  );
                                }
                                if (isViolation) {
                                  return (
                                    <span
                                      title={`Expected manager role: ${allowedMgrRoles.join(" or ")}, got: ${managerRole}`}
                                      className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
                                    >
                                      ✗ Wrong Tier
                                    </span>
                                  );
                                }
                                if (isCompliant) {
                                  return (
                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                      ✓ Tier OK
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
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

      {/* ================= AUDIT LOG ACTIVITY FEED ================= */}
      {activeView === "audit" && (
        <ActivityFeed
          users={hierarchyData?.users || []}
          title="Organizational Audit Trail"
          subtitle="Real-time chronological timeline of reporting chain updates, reassignments, and user provisioning events"
        />
      )}

      {/* ================= MODAL: ASSIGN / CHANGE MANAGER ================= */}
      {reassignModalUser && (
        <div
          onClick={() => setReassignModalUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="shrink-0 flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
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

            <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4">
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
                  {potentialManagers.map((m) => {
                    const targetSubRole = reassignModalUser.role;
                    const activeCount = hierarchyData?.users?.filter(
                      (sub) => sub.reportsToId === m.id && sub.role === targetSubRole && sub.isActive !== false
                    ).length || 0;
                    const limit = targetSubRole === "TEAM_LEAD" ? (m.maxTeamLeads ?? 1) : targetSubRole === "AGENT" ? (m.maxAgents ?? 1) : 999;
                    const isFull = activeCount >= limit && reassignModalUser.reportsToId !== m.id;

                    return (
                      <option key={m.id} value={m.id} disabled={isFull}>
                        {m.name ? `${m.name} (${m.email})` : m.email} — {m.role} ({activeCount}/{limit}){isFull ? " ⚠️ FULL" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  The subordinate will directly report to this manager for leads, escalations, and oversight.
                </p>
              </div>

              {/* Super Admin Quota Control */}
              {currentUser?.role === "SUPER_ADMIN" && reassignModalUser.role === "ADMIN" && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Team Lead Quota Limit (Max Team Leads) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quotaMaxTeamLeads}
                      onChange={(e) => setQuotaMaxTeamLeads(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Super Admin authorization limit for maximum Team Leads this Administrator can supervise.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sales Agent Quota per Team Lead (Max Agents per TL) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quotaMaxAgents}
                      onChange={(e) => setQuotaMaxAgents(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Default baseline quota limit for Sales Agents that Team Leads under this Administrator can supervise.
                    </p>
                  </div>
                </div>
              )}

              {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN") && reassignModalUser.role === "TEAM_LEAD" && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Agent Quota Limit (Max Agents) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quotaMaxAgents}
                    onChange={(e) => setQuotaMaxAgents(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Capacity limit for maximum Sales Agents this Team Lead can supervise.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="shrink-0 p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto flex items-center justify-end gap-2.5">
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
                  handleAssignManager(
                    reassignModalUser.id,
                    targetManagerId || null,
                    reassignModalUser.role === "ADMIN" && currentUser?.role === "SUPER_ADMIN"
                      ? { maxTeamLeads: quotaMaxTeamLeads, maxAgents: quotaMaxAgents }
                      : reassignModalUser.role === "TEAM_LEAD"
                      ? { maxAgents: quotaMaxAgents }
                      : undefined
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {savingReassignment && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM AUTO-LINK ================= */}
      {confirmAutoLinkOpen && (
        <div
          onClick={() => setConfirmAutoLinkOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
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
        <div
          onClick={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
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

      {/* ================= MODAL: ADD NEW TEAM MEMBER ================= */}
      {isAddUserModalOpen && (
        <div
          onClick={() => setIsAddUserModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Provision Team Member
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create an Admin, Team Lead, or Sales Agent in the hierarchy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateMember} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4">
                {/* Plan Limit Alert Banner */}
              {hierarchyPlanAlert && (
                <PlanLimitAlert
                  title={hierarchyPlanAlert.title}
                  message={hierarchyPlanAlert.message}
                  variant="blue"
                  onClose={() => setHierarchyPlanAlert(null)}
                />
              )}
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. sarah@organization.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This email is the user&apos;s login username and where account credentials will be sent.
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hierarchy Role Tier *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      role: "ADMIN",
                      label: "Admin",
                      tier: "Tier 2",
                      icon: Shield,
                    },
                    {
                      role: "TEAM_LEAD",
                      label: "Team Lead",
                      tier: "Tier 3",
                      icon: Zap,
                    },
                    {
                      role: "AGENT",
                      label: "Sales Agent",
                      tier: "Tier 4",
                      icon: Briefcase,
                    },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = newUserForm.role === item.role;
                    return (
                      <button
                        type="button"
                        key={item.role}
                        onClick={() => setNewUserForm({ ...newUserForm, role: item.role })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300 shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4 mb-1" />
                        <span className="text-xs font-bold">{item.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{item.tier}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Reporting Manager (reportsToId) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direct Reporting Manager (Superior)
                </label>
                <select
                  value={newUserForm.reportsToId}
                  onChange={(e) => setNewUserForm({ ...newUserForm, reportsToId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">No Superior (Executive Root / Unassigned)</option>
                  {hierarchyData?.users
                    ?.filter((u) => {
                      const targetTenantId = currentUser?.tenantId;
                      if (targetTenantId && u.role !== "SUPER_ADMIN" && u.tenantId && u.tenantId !== targetTenantId) {
                        return false;
                      }
                      if (newUserForm.role === "AGENT") return u.role === "TEAM_LEAD" || u.role === "ADMIN";
                      if (newUserForm.role === "TEAM_LEAD") return u.role === "ADMIN";
                      if (newUserForm.role === "ADMIN") return u.role === "SUPER_ADMIN";
                      return false;
                    })
                    .map((u) => {
                      const targetSubRole = newUserForm.role;
                      const activeCount = hierarchyData?.users?.filter(
                        (sub) => sub.reportsToId === u.id && sub.role === targetSubRole && sub.isActive !== false
                      ).length || 0;
                      const limit = targetSubRole === "TEAM_LEAD" ? (u.maxTeamLeads ?? 1) : targetSubRole === "AGENT" ? (u.maxAgents ?? 1) : 999;
                      const isFull = activeCount >= limit;

                      return (
                        <option key={u.id} value={u.id} disabled={isFull}>
                          {u.name ? `${u.name} (${u.email})` : u.email} — {u.role} ({activeCount}/{limit}){isFull ? " ⚠️ FULL" : ""}
                        </option>
                      );
                    })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assigning a manager automatically places this user directly underneath them in the organizational chart.
                </p>
              </div>

              {/* Dual Quota Input Fields for Admin */}
              {newUserForm.role === "ADMIN" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Team Lead Capacity Quota (Max Team Leads) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newUserForm.maxTeamLeads}
                      onChange={(e) => setNewUserForm({ ...newUserForm, maxTeamLeads: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maximum number of Team Leads this Administrator will be permitted to manage (Default: 1).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sales Agent Quota per Team Lead (Max Agents per TL) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newUserForm.maxAgents}
                      onChange={(e) => setNewUserForm({ ...newUserForm, maxAgents: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Default baseline quota limit for Sales Agents that Team Leads under this Administrator can supervise (Default: 1).
                    </p>
                  </div>
                </div>
              )}

              {/* Quota Input Field for Team Lead */}
              {newUserForm.role === "TEAM_LEAD" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Agent Capacity Quota (Max Agents) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newUserForm.maxAgents}
                    onChange={(e) => setNewUserForm({ ...newUserForm, maxAgents: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maximum number of Sales Agents this Team Lead will be permitted to manage (Default: 1).
                  </p>
                </div>
              )}

              {/* Optional Custom Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Password (Optional)
                </label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Leave empty to auto-generate secure password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If left empty, a secure temporary password will be generated and shown immediately on screen.
                </p>
              </div>

              </div>

              {/* Modal Actions */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={creatingUser}
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {creatingUser ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Provision Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TEMPORARY CREDENTIALS PREVIEW ================= */}
      {createdTempModal && (
        <div
          onClick={() => setCreatedTempModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex-1 overflow-y-auto p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-inner">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Member Provisioned Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Account created for <strong>{createdTempModal.email}</strong> ({createdTempModal.role})
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Initial Temporary Password
                </p>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                  <span>{createdTempModal.tempPasswordPreview}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdTempModal.tempPasswordPreview)}
                    className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                    title="Copy password"
                  >
                    {copiedTempPass ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                A welcome email has been dispatched with login instructions. You can also copy and provide the temporary password above directly.
              </p>
            </div>

            <div className="shrink-0 p-6 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto">
              <button
                type="button"
                onClick={() => setCreatedTempModal(null)}
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Done & View Hierarchy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BULK REASSIGN MANAGER ================= */}
      {isBulkReassignModalOpen && (
        <div
          onClick={() => setIsBulkReassignModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Bulk Reassign Manager
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reassign {selectedUserIds.size} selected {selectedUserIds.size === 1 ? "user" : "users"} to a new reporting manager
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4">
              {/* Mixed-Role Tier Warning Banner */}
              {isMixedRoleSelection && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">Mixed Role Tiers Selected</p>
                    <p className="text-[11px] leading-relaxed">
                      Your selection includes users from <strong>{selectedRolesSet.size} different role tiers</strong>.
                      Strict hierarchy rules require all bulk-reassigned users to share the same tier so the
                      correct manager pool can be determined. Please deselect and retry with a uniform role tier.
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Users Summary */}
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Selected Users</span>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {Array.from(selectedUserIds).map((id) => {
                    const user = hierarchyData?.users?.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        <span className="truncate max-w-[100px]">{user.name || user.email.split("@")[0]}</span>
                        <button
                          type="button"
                          onClick={() => toggleSelection(id)}
                          className="text-blue-500 hover:text-blue-800 cursor-pointer ml-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Select New Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Reporting Manager for All Selected Users
                </label>
                <select
                  value={bulkTargetManagerId}
                  onChange={(e) => setBulkTargetManagerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">No Manager (Unassigned / Root Level)</option>
                  {bulkPotentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ? `${m.name} (${m.email})` : m.email} — {m.role}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  All {selectedUserIds.size} selected users will be moved under this manager simultaneously.
                  Circular hierarchy assignments are automatically blocked.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="shrink-0 p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={bulkReassigning}
                onClick={() => setIsBulkReassignModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkReassigning || isMixedRoleSelection}
                onClick={handleBulkReassign}
                title={isMixedRoleSelection ? "Cannot bulk reassign across mixed role tiers" : ""}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkReassigning && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{bulkReassigning ? "Reassigning..." : `Reassign ${selectedUserIds.size} Users`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= BLOCK / ACTIVATION CONFIRMATION MODAL ================= */}
      {isBlockModalOpen && userToBlock && (
        <div
          onClick={() => {
            setIsBlockModalOpen(false);
            setUserToBlock(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 shrink-0">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {userToBlock.isActive !== false ? "Block User Account" : "Reactivate User Account"}
                </h3>
                <p className="text-xs text-slate-500">
                  {userToBlock.name || userToBlock.email} ({userToBlock.role})
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 space-y-2">
              {userToBlock.isActive !== false ? (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Are you sure you want to block this account?
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                    <li>
                      Direct reports will be automatically reassigned to their manager to prevent orphaned leads.
                    </li>
                    <li>
                      Active sessions will be immediately revoked, and the user will be force-redirected to the login page.
                    </li>
                    <li>
                      Subsequent API requests using their token will return 401 Unauthorized.
                    </li>
                  </ul>
                </>
              ) : (
                <p>
                  Reactivating this user will restore their ability to log in and access the system.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setUserToBlock(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleToggleBlockUser}
                disabled={blockingUser}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  userToBlock.isActive !== false
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {blockingUser ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                ) : userToBlock.isActive !== false ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Block Account
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Reactivate Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}

// ─── Sub-component: Recursive Org Tree Node ──────────────────────────────────
const DEPTH_STRIPE_CLASSES = [
  "border-l-purple-400 dark:border-l-purple-600",   // depth 0 — SUPER_ADMIN
  "border-l-blue-400 dark:border-l-blue-600",       // depth 1 — ADMIN
  "border-l-amber-400 dark:border-l-amber-500",     // depth 2 — TEAM_LEAD
  "border-l-emerald-400 dark:border-l-emerald-500", // depth 3 — AGENT
];

function OrgTreeNode({
  node,
  depth = 0,
  onAssignManager,
  onDeleteUser,
  onBlockUser,
}: {
  node: User;
  depth?: number;
  onAssignManager: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onBlockUser?: (user: User) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = getRoleMeta(node.role);
  const RoleIcon = meta.icon;
  const depthStripe = DEPTH_STRIPE_CLASSES[Math.min(depth, DEPTH_STRIPE_CLASSES.length - 1)];
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

        {/* User Card — depth-based left border stripe for visual tier distinction */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 flex-1 rounded-xl border border-l-4 p-3 bg-white shadow-xs dark:bg-slate-800 ${meta.borderClass} ${depthStripe}`}
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
                {node.isActive === false && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                    <Lock className="h-2.5 w-2.5" /> Blocked
                  </span>
                )}
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
                {onBlockUser && (
                  <button
                    onClick={() => onBlockUser(node)}
                    title={node.isActive !== false ? `Block ${node.name || node.email}` : `Reactivate ${node.name || node.email}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer transition-colors shadow-xs ${
                      node.isActive !== false
                        ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400"
                        : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                    }`}
                  >
                    {node.isActive !== false ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                )}
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

      {/* Children branches — pass depth + 1 for progressive stripe coloring */}
      {hasMembers && !collapsed && (
        <div className="ml-6 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3">
          {node.teamMembers?.map((sub) => (
            <OrgTreeNode
              key={sub.id}
              node={sub}
              depth={depth + 1}
              onAssignManager={onAssignManager}
              onDeleteUser={onDeleteUser}
              onBlockUser={onBlockUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
