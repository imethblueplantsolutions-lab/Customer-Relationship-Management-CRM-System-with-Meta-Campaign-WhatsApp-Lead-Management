"use client";

import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/RoleGuard";
import type { User, TenantQuotaStatus } from "@/types";
import PlanLimitAlert from "@/components/ui/PlanLimitAlert";
import {
  UserPlus,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  X,
  UserCheck,
  Clock,
  ShieldCheck,
  Phone,
  Crown,
  MoreVertical,
  Pencil,
  UserX,
} from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";

export default function UserManagementPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State for Adding User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "AGENT",
    reportsToId: "",
    password: "",
    maxTeamLeads: 1,
    maxAgents: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<TenantQuotaStatus | null>(null);
  const [planLimitAlert, setPlanLimitAlert] = useState<{
    title: string;
    message: string;
    variant?: "blue" | "teal" | "amber" | "dark";
  } | null>(null);

  // Dropdown State for Table Actions
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal State for Editing User
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "AGENT",
    reportsToId: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editPlanLimitAlert, setEditPlanLimitAlert] = useState<{
    title: string;
    message: string;
    variant?: "blue" | "teal" | "amber" | "dark";
  } | null>(null);

  // Modal State for Showing Provisioned Temp Password
  const [createdTempModal, setCreatedTempModal] = useState<{
    email: string;
    role: string;
    tempPasswordPreview: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isPrivileged = ["ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  // Role hierarchy levels for action permissions
  const ROLE_LEVELS: Record<string, number> = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    TEAM_LEAD: 2,
    AGENT: 1,
  };

  const getRoleLabel = (role: string) => {
    if (role === "SUPER_ADMIN") return "Super Administrator";
    if (role === "ADMIN") return "Administrator";
    if (role === "TEAM_LEAD") return "Team Lead";
    return "Sales Agent";
  };

  // Fetch Tenant Quota Status
  const fetchQuotaStatus = async () => {
    try {
      const res = await apiClient<TenantQuotaStatus>("/users/quota-status");
      if (res.success && res.data) {
        setQuotaStatus(res.data);
      }
    } catch {}
  };

  // Load Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [resUsers] = await Promise.all([
        apiClient<User[]>("/users"),
        fetchQuotaStatus(),
      ]);
      if (resUsers.success && resUsers.data) {
        setUsersList(resUsers.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPrivileged) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isPrivileged]);

  // Live Socket synchronization for real-time user updates across the tenant
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchUsers();
    };

    socket.on("user_updated", handleRefresh);
    socket.on("user_created", handleRefresh);
    socket.on("hierarchy_updated", handleRefresh);
    socket.on("user_deleted", handleRefresh);
    socket.on("quota_updated", handleRefresh);
    return () => {
      socket.off("user_updated", handleRefresh);
      socket.off("user_created", handleRefresh);
      socket.off("hierarchy_updated", handleRefresh);
      socket.off("user_deleted", handleRefresh);
      socket.off("quota_updated", handleRefresh);
    };
  }, [socket]);

  // Handle User Provisioning Submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    setPlanLimitAlert(null);

    try {
      const res = await apiClient<{
        user: User;
        tempPasswordPreview: string;
      }>("/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email.trim(),
          role: formData.role,
          reportsToId: formData.reportsToId.trim() || undefined,
          password: formData.password.trim() || undefined,
          maxTeamLeads: formData.role === "ADMIN" ? formData.maxTeamLeads : undefined,
          maxAgents: formData.role === "ADMIN" || formData.role === "TEAM_LEAD" ? formData.maxAgents : undefined,
        }),
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        toast.success(res.message || "User created successfully!");
        setFormData({ name: "", email: "", role: "AGENT", reportsToId: "", password: "", maxTeamLeads: 1, maxAgents: 1 });
        await fetchUsers();

        if (res.data.tempPasswordPreview) {
          setCreatedTempModal({
            email: res.data.user.email,
            role: res.data.user.role,
            tempPasswordPreview: res.data.tempPasswordPreview,
          });
        }
      } else {
        const errorText = typeof res.error === "string" ? res.error : "Failed to create user";
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT_REACHED") {
        setPlanLimitAlert({
          title: err.title || "Unavailable with your plan",
          message: err.message || "Upgrade to a pay-as-you-go account to use this feature.",
          variant: "blue",
        });
        toast.error(err.title || "Unavailable with your plan");
      } else {
        const errorText = err instanceof Error ? err.message : "Error creating user";
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Close Actions Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".actions-dropdown-container")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open Edit User Modal with Pre-filled Data
  const handleOpenEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditFormData({
      name: targetUser.name || "",
      email: targetUser.email,
      role: targetUser.role,
      reportsToId: targetUser.reportsToId || "",
    });
    setEditPlanLimitAlert(null);
    setOpenDropdownId(null);
  };

  // Submit Edit User Details
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFormData.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    setEditSubmitting(true);
    setEditPlanLimitAlert(null);

    try {
      const res = await apiClient<User>(`/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editFormData.name.trim() || undefined,
          email: editFormData.email.trim(),
          role: editFormData.role,
          reportsToId: editFormData.reportsToId.trim() || null,
        }),
      });

      if (res.success && res.data) {
        toast.success("User updated successfully!");
        setEditingUser(null);
        await fetchUsers();
      } else {
        const errorText = typeof res.error === "string" ? res.error : "Failed to update user";
        toast.error(errorText);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT_REACHED") {
        setEditPlanLimitAlert({
          title: err.title || "Unavailable with your plan",
          message: err.message || "Upgrade to a pay-as-you-go account to use this feature.",
          variant: "blue",
        });
        toast.error(err.title || "Unavailable with your plan");
      } else {
        const errorText = err instanceof Error ? err.message : "Error updating user";
        toast.error(errorText);
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Toggle User Active Status
  const handleToggleActive = async (targetUser: User) => {
    try {
      const res = await apiClient<User>(`/users/${targetUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });

      if (res.success && res.data) {
        const updatedIsActive = res.data.isActive;
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: updatedIsActive } : u))
        );
        setSuccessMsg(
          `User ${targetUser.email} status updated to ${!targetUser.isActive ? "Active" : "Inactive"}`
        );
        setTimeout(() => setSuccessMsg(""), 4000);
        await fetchQuotaStatus();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT_REACHED") {
        toast.error(err.title || "Unavailable with your plan");
      } else {
        const errorText = err instanceof Error ? err.message : "Failed to toggle status";
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPrivileged) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Only Administrators and Team Leaders have permission to manage team accounts and provision users.
        </p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "TEAM_LEAD"]} redirectTo="/hierarchy">
      <div className="space-y-8 pb-16">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-primary" />
            Team & User Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision Team Leads and Sales Agents with automatic temporary passwords and OTP verification
          </p>
        </div>

        {isPrivileged && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            + Add User
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{usersList.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Leaders</p>
              {quotaStatus && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Cap: {quotaStatus.teamLeads.max}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {usersList.filter((u) => u.role === "TEAM_LEAD").length}
              {quotaStatus && (
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  / {quotaStatus.teamLeads.max} allowed
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Agents</p>
              {quotaStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${quotaStatus.agents.canCreate ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-800"}`}>
                  {quotaStatus.agents.canCreate ? `Cap: ${quotaStatus.agents.max}` : "Plan limit reached"}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {usersList.filter((u) => u.role === "AGENT").length}
              {quotaStatus && (
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  / {quotaStatus.agents.max} allowed
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending First OTP</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {usersList.filter((u) => u.isFirstLogin).length}
            </p>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm text-red-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles ({usersList.length})</option>
            {user?.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admins</option>}
            {user?.role === "SUPER_ADMIN" && <option value="ADMIN">Admins</option>}
            <option value="TEAM_LEAD">Team Leads</option>
            <option value="AGENT">Sales Agents</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto h-7 w-7 text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No user accounts found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or role filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">User Account</th>
                  <th className="py-4 px-6">Reporting Manager</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Security Verification</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.map((u) => {
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase();
                  const isUserAdmin = u.role === "ADMIN";
                  const isUserTeamLead = u.role === "TEAM_LEAD";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Name, Email, Avatar & Bio */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name || "Avatar"}
                              className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug truncate">
                              {u.name || "Unnamed User"}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5 truncate">{u.email}</p>
                            {u.bio && (
                              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate" title={u.bio}>
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reporting Manager (Superior) */}
                      <td className="py-4 px-6">
                        {u.manager ? (
                          <div className="flex items-center gap-2">
                            {u.manager.avatar ? (
                              <img
                                src={u.manager.avatar}
                                alt={u.manager.name || "Manager"}
                                className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                {(u.manager.name || u.manager.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-xs truncate max-w-[130px]">
                                {u.manager.name || u.manager.email.split("@")[0]}
                              </p>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {u.manager.role === "SUPER_ADMIN" ? "Super Admin" : u.manager.role === "ADMIN" ? "Administrator" : "Team Lead"}
                              </span>
                            </div>
                          </div>
                        ) : u.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Root Superior
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 px-6">
                        {u.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono font-medium">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[11px] shadow-xs">
                            <Crown className="h-3.5 w-3.5 text-amber-600" />
                            Super Administrator
                          </span>
                        ) : isUserAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Administrator
                          </span>
                        ) : isUserTeamLead ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                            <UserCheck className="h-3.5 w-3.5" />
                            Team Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                            <Users className="h-3.5 w-3.5" />
                            Sales Agent
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Security Verification Status */}
                      <td className="py-4 px-6">
                        {u.isFirstLogin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <Clock className="h-3.5 w-3.5" />
                            Pending First OTP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified Account
                          </span>
                        )}
                      </td>

                      {/* Actions Column with Dropdown Menu */}
                      <td className="py-4 px-6 text-right">
                        {u.id === user?.id ? (
                          <span className="text-[11px] text-slate-400 italic">Self Account</span>
                        ) : (ROLE_LEVELS[user?.role || ""] || 0) <= (ROLE_LEVELS[u.role] || 0) && user?.role !== "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-400 border border-slate-200">
                            <ShieldCheck className="h-3 w-3 text-slate-400" />
                            Protected
                          </span>
                        ) : (
                          <div className="relative inline-block text-left actions-dropdown-container">
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Manage Account"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openDropdownId === u.id && (
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                {((ROLE_LEVELS[user?.role || ""] || 0) > (ROLE_LEVELS[u.role] || 0) || user?.role === "SUPER_ADMIN") && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(u)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                    Edit Details
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleToggleActive(u);
                                  }}
                                  className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    u.isActive
                                      ? "text-red-600 hover:bg-red-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  {u.isActive ? (
                                    <>
                                      <UserX className="h-3.5 w-3.5 text-red-500" />
                                      Deactivate User
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      Activate User
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add User Account */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#BBE1FA]" />
                  Add User
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Create a new team account with temporary password & verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Plan Limit Alert Banner (Matching Picture 1: Icon, Title, Body, Close, Themeable) */}
              {(planLimitAlert || (quotaStatus && ((formData.role === "AGENT" && !quotaStatus.agents.canCreate) || (formData.role === "TEAM_LEAD" && !quotaStatus.teamLeads.canCreate)))) && (
                <PlanLimitAlert
                  title={planLimitAlert?.title || "Unavailable with your plan"}
                  message={
                    planLimitAlert?.message ||
                    (formData.role === "AGENT"
                      ? `Upgrade to a pay-as-you-go account to use this feature. Your Free Plan allows a maximum of 1 Sales Agent across your organization (${quotaStatus?.agents.current} of ${quotaStatus?.agents.max} active).`
                      : `Upgrade to a pay-as-you-go account to use this feature. Your Free Plan allows a maximum of 1 Team Lead across your organization (${quotaStatus?.teamLeads.current} of ${quotaStatus?.teamLeads.max} active).`)
                  }
                  variant={planLimitAlert?.variant || "blue"}
                  onClose={() => setPlanLimitAlert(null)}
                />
              )}
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@organization.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Dynamic Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="AGENT">Sales Agent</option>
                  {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                    <option value="TEAM_LEAD">Team Lead</option>
                  )}
                  {user?.role === "SUPER_ADMIN" && (
                    <option value="ADMIN">Administrator</option>
                  )}
                </select>
              </div>

              {/* Direct Reporting Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Reporting Manager (Superior)
                </label>
                <select
                  value={formData.reportsToId}
                  onChange={(e) => {
                    const selectedMgrId = e.target.value;
                    const mgr = usersList.find((u) => u.id === selectedMgrId);
                    setFormData((prev) => ({
                      ...prev,
                      reportsToId: selectedMgrId,
                      ...(formData.role === "TEAM_LEAD" && mgr ? { maxAgents: mgr.maxAgents ?? 1 } : {}),
                    }));
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">No Superior (Executive Root / Unassigned)</option>
                  {usersList
                    .filter((m) => {
                      const targetTenantId = user?.tenantId;
                      if (targetTenantId && m.role !== "SUPER_ADMIN" && m.tenantId && m.tenantId !== targetTenantId) {
                        return false;
                      }
                      if (formData.role === "AGENT") return m.role === "TEAM_LEAD" || m.role === "ADMIN";
                      if (formData.role === "TEAM_LEAD") return m.role === "ADMIN";
                      if (formData.role === "ADMIN") return m.role === "SUPER_ADMIN";
                      return false;
                    })
                    .map((m) => {
                      const targetSubRole = formData.role;
                      const activeCount = usersList.filter(
                        (sub) => sub.reportsToId === m.id && sub.role === targetSubRole && sub.isActive !== false
                      ).length;
                      const limit = targetSubRole === "TEAM_LEAD" ? (m.maxTeamLeads ?? 1) : targetSubRole === "AGENT" ? (m.maxAgents ?? 1) : 999;
                      const isFull = activeCount >= limit;

                      return (
                        <option key={m.id} value={m.id} disabled={isFull}>
                          {m.name ? `${m.name} (${m.email})` : m.email} — {m.role} ({activeCount}/{limit}){isFull ? " ⚠️ FULL" : ""}
                        </option>
                      );
                    })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Places this user directly under this manager in their reporting branch.
                </p>
              </div>

              {/* Dual Quota Input Fields for Admin */}
              {formData.role === "ADMIN" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Team Lead Capacity Quota (Max Team Leads) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.maxTeamLeads}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxTeamLeads: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Maximum number of Team Leads this Administrator can create and manage.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sales Agent Quota per Team Lead (Max Agents per TL) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.maxAgents}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxAgents: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Default baseline quota limit for Sales Agents assigned to Team Leads under this Administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Quota Input Field for Team Lead */}
              {formData.role === "TEAM_LEAD" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sales Agent Capacity Quota (Max Agents) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.maxAgents}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxAgents: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Maximum number of Sales Agents this Team Lead can manage.
                  </p>
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Temporary password (leave blank to auto-generate)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If left blank, a secure temporary password will automatically be generated.
                </p>
              </div>

              {/* Security Banner Note */}
              <div className="p-3.5 rounded-xl bg-sky-50 border border-[#BBE1FA] text-[11px] text-[#0F4C75] leading-relaxed flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Welcome email will be sent automatically. The user must verify a 6-digit OTP code and set a new password on their first login.
                </span>
              </div>

              </div>

              {/* Sticky Footer Actions */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl mt-auto">
                {(() => {
                  const isRoleLimitReached =
                    Boolean(quotaStatus && (
                      (formData.role === "AGENT" && !quotaStatus.agents.canCreate) ||
                      (formData.role === "TEAM_LEAD" && !quotaStatus.teamLeads.canCreate)
                    ));

                  return (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || isRoleLimitReached}
                        title={isRoleLimitReached ? "Plan limit reached for this role tier" : undefined}
                        className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                          isRoleLimitReached
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                            : "bg-brand-primary hover:bg-brand-accent text-white hover:shadow-lg disabled:opacity-50 cursor-pointer"
                        }`}
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Creating User...
                          </>
                        ) : isRoleLimitReached ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-slate-500" />
                            Limit Reached
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Add User
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Account */}
      {editingUser && (
        <div
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#BBE1FA]" />
                  Edit User Details
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Update account profile and reporting tier
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateUser} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Plan Limit Alert Banner */}
              {(() => {
                const isRoleChanged = editFormData.role !== editingUser.role;
                const isBlockedByQuota = isRoleChanged && (
                  (editFormData.role === "TEAM_LEAD" && quotaStatus && !quotaStatus.teamLeads.canCreate) ||
                  (editFormData.role === "AGENT" && quotaStatus && !quotaStatus.agents.canCreate)
                );

                if (editPlanLimitAlert || isBlockedByQuota) {
                  return (
                    <PlanLimitAlert
                      title={editPlanLimitAlert?.title || "Unavailable with your plan"}
                      message={
                        editPlanLimitAlert?.message ||
                        (editFormData.role === "TEAM_LEAD"
                          ? `Upgrade to a pay-as-you-go account to use this feature. Your Free Plan allows a maximum of 1 Team Lead across your organization (${quotaStatus?.teamLeads.current} of ${quotaStatus?.teamLeads.max} active).`
                          : `Upgrade to a pay-as-you-go account to use this feature. Your Free Plan allows a maximum of 1 Sales Agent across your organization (${quotaStatus?.agents.current} of ${quotaStatus?.agents.max} active).`)
                      }
                      variant={editPlanLimitAlert?.variant || "blue"}
                      onClose={() => setEditPlanLimitAlert(null)}
                    />
                  );
                }
                return null;
              })()}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@organization.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Tier *
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      reportsToId: "", // Clear manager selection to avoid tier mismatches
                    }));
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="AGENT">Sales Agent</option>
                  {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                    <option value="TEAM_LEAD">Team Lead</option>
                  )}
                  {user?.role === "SUPER_ADMIN" && (
                    <option value="ADMIN">Administrator</option>
                  )}
                </select>
              </div>

              {/* Direct Reporting Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Reporting Manager (Superior)
                </label>
                <select
                  value={editFormData.reportsToId}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, reportsToId: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Unassigned (Awaiting placement)</option>
                  {usersList
                    .filter((m) => {
                      if (m.id === editingUser.id || !m.isActive) return false;
                      const targetTenantId = editingUser.tenantId;
                      if (targetTenantId && m.role !== "SUPER_ADMIN" && m.tenantId && m.tenantId !== targetTenantId) {
                        return false;
                      }
                      if (editFormData.role === "AGENT") return m.role === "TEAM_LEAD" || m.role === "ADMIN";
                      if (editFormData.role === "TEAM_LEAD") return m.role === "ADMIN";
                      if (editFormData.role === "ADMIN") return m.role === "SUPER_ADMIN";
                      return false;
                    })
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email} ({getRoleLabel(m.role)})
                      </option>
                    ))}
                </select>
              </div>

              </div>

              {/* Sticky Footer Actions */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl mt-auto">
                {(() => {
                  const isRoleChanged = editFormData.role !== editingUser.role;
                  const isRoleLimitReached = isRoleChanged && Boolean(
                    quotaStatus && (
                      (editFormData.role === "AGENT" && !quotaStatus.agents.canCreate) ||
                      (editFormData.role === "TEAM_LEAD" && !quotaStatus.teamLeads.canCreate)
                    )
                  );

                  return (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editSubmitting || isRoleLimitReached}
                        title={isRoleLimitReached ? "Plan limit reached for this role tier" : undefined}
                        className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                          isRoleLimitReached
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                            : "bg-brand-primary hover:bg-brand-accent text-white hover:shadow-lg disabled:opacity-50 cursor-pointer"
                        }`}
                      >
                        {editSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : isRoleLimitReached ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-slate-500" />
                            Limit Reached
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Created Temp Password Preview Modal */}
      {createdTempModal && (
        <div
          onClick={() => setCreatedTempModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-y-auto p-6 sm:p-7 text-center space-y-5 my-auto"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-100 text-[#0F4C75] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">User Account Provisioned!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Account created for <strong>{createdTempModal.email}</strong> ({createdTempModal.role})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Initial Temporary Password
              </p>
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold text-[#0F4C75]">
                <span>{createdTempModal.tempPasswordPreview}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdTempModal.tempPasswordPreview)}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Copy password"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              A welcome email has been sent to the user. You may also copy and share the temporary password above with them directly.
            </p>

            <button
              type="button"
              onClick={() => setCreatedTempModal(null)}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Done & Return to List
            </button>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
