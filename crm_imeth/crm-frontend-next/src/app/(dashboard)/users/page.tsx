"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";
import {
  UserPlus,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Key,
  Copy,
  Check,
  RefreshCw,
  X,
  UserCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";

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
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"TEAM_LEAD" | "AGENT">("AGENT");
  const [autoGenPassword, setAutoGenPassword] = useState(true);
  const [customPassword, setCustomPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal State for Showing Provisioned Temp Password
  const [createdTempModal, setCreatedTempModal] = useState<{
    email: string;
    role: string;
    tempPasswordPreview: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isPrivileged = ["ADMIN", "TEAM_LEAD"].includes(user?.role || "");

  // Load Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await apiClient<User[]>("/users");
      if (res.success && res.data) {
        setUsersList(res.data);
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

  // Handle User Provisioning Submission
  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiClient<{
        user: User;
        tempPasswordPreview: string;
      }>("/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || undefined,
          role: newRole,
          customPassword: !autoGenPassword ? customPassword.trim() : undefined,
        }),
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        setCreatedTempModal({
          email: res.data.user.email,
          role: res.data.user.role,
          tempPasswordPreview: res.data.tempPasswordPreview,
        });

        // Reset form
        setNewEmail("");
        setNewName("");
        setNewRole("AGENT");
        setAutoGenPassword(true);
        setCustomPassword("");

        fetchUsers();
      } else {
        setErrorMsg(res.error || "Failed to provision user");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error provisioning user");
    } finally {
      setSubmitting(false);
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
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="space-y-8 pb-16">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#3282B8]" />
            Team & User Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision Team Leads and Sales Agents with automatic temporary passwords and OTP verification
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4C75] hover:bg-[#3282B8] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Provision New User
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-[#3282B8] flex items-center justify-center shrink-0">
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
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Leaders</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {usersList.filter((u) => u.role === "TEAM_LEAD").length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Agents</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {usersList.filter((u) => u.role === "AGENT").length}
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
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#3282B8] focus:ring-2 focus:ring-[#3282B8]/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-[#3282B8] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles ({usersList.length})</option>
            <option value="ADMIN">Admins</option>
            <option value="TEAM_LEAD">Team Leads</option>
            <option value="AGENT">Sales Agents</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto h-7 w-7 text-[#3282B8] animate-spin mb-2" />
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">User Account</th>
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
                      
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">
                              {u.name || "Unnamed User"}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        {isUserAdmin ? (
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {isAdmin && u.id !== user?.id ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
                              u.isActive
                                ? "bg-white hover:bg-red-50 text-red-600 border-red-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Self Account</span>
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

      {/* Modal: Provision User Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1B262C] via-[#0F4C75] to-[#3282B8] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#BBE1FA]" />
                  Provision Team Account
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Create a new Team Lead or Agent account with nodemailer-otp security
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProvisionUser} className="p-6 space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  User Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#3282B8] focus:ring-2 focus:ring-[#3282B8]/20 focus:outline-none transition-all"
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
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@organization.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#3282B8] focus:ring-2 focus:ring-[#3282B8]/20 focus:outline-none transition-all"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRole("AGENT")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      newRole === "AGENT"
                        ? "bg-[#3282B8] text-white border-[#3282B8] shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    Sales Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("TEAM_LEAD")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      newRole === "TEAM_LEAD"
                        ? "bg-[#3282B8] text-white border-[#3282B8] shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    Team Lead
                  </button>
                </div>
              </div>

              {/* Password Mode Toggle */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#3282B8]" />
                    Initial Temporary Password
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoGenPass"
                    checked={autoGenPassword}
                    onChange={(e) => setAutoGenPassword(e.target.checked)}
                    className="h-4 w-4 rounded text-[#3282B8] focus:ring-[#3282B8]"
                  />
                  <label htmlFor="autoGenPass" className="text-xs text-slate-600 font-medium cursor-pointer">
                    Auto-generate secure temporary password (recommended)
                  </label>
                </div>

                {!autoGenPassword && (
                  <input
                    type="text"
                    required
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter initial temporary password"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#3282B8] focus:outline-none"
                  />
                )}
              </div>

              {/* Security Banner Note */}
              <div className="p-3.5 rounded-xl bg-sky-50 border border-[#BBE1FA] text-[11px] text-[#0F4C75] leading-relaxed flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#3282B8] shrink-0 mt-0.5" />
                <span>
                  Welcome email will be sent automatically. The user must verify a 6-digit OTP code and set a new password on their first login.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#0F4C75] hover:bg-[#3282B8] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Provisioning Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Provision User Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Created Temp Password Preview Modal */}
      {createdTempModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-7 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-100 text-[#0F4C75] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-[#3282B8]" />
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
                  className="p-1 text-slate-400 hover:text-[#3282B8] transition-colors cursor-pointer"
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
  );
}
