"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { Lead } from "@/types";
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Phone,
  Tag,
  Users,
  X,
  User,
  FolderOpen,
  Loader2,
  Mail,
  FileText,
  MessageCircle,
  GitMerge,
  Building2,
  Briefcase,
  Trash2,
  UserCheck,
  RotateCcw,
  Check,
} from "lucide-react";
import Link from "next/link";
import MergeLeadsModal from "@/components/leads/MergeLeadsModal";
import LeadFilters from "@/components/leads/LeadFilters";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { RoleGuard } from "@/components/RoleGuard";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#eab308",
  QUALIFIED: "#8b5cf6",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
};

const CATEGORY_OPTIONS = [
  "Manual Entry",
  "Direct Call",
  "Referral",
  "Event / Expo",
  "Website Form",
];

// Phase 1 toggle: Set to false when WhatsApp messaging feature is enabled
const HIDE_WHATSAPP_MESSAGING = true;

export default function LeadsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "TEAM_LEAD", "AGENT"]} redirectTo="/hierarchy">
      <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
        <LeadsPageContent />
      </Suspense>
    </RoleGuard>
  );
}

function LeadsPageContent() {
  const { user } = useAuth();
  const canAssign = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";
  const tagId = searchParams.get("tagId") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Add Lead form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsappNumber, setFormWhatsappNumber] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCategory, setFormCategory] = useState("Manual Entry");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [agents, setAgents] = useState<{ id: string; name?: string; email: string; role: string; avatar?: string }[]>([]);

  // ─── Bulk Multi-Select & Batch Operation State ──────────────
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState("NEW");
  const [selectedBulkAssignee, setSelectedBulkAssignee] = useState("");

  useEffect(() => {
    if (canAssign) {
      apiClient<{ id: string; name?: string; email: string; role: string; avatar?: string }[]>("/users")
        .then((res) => {
          if (res.success && res.data) setAgents(res.data);
        })
        .catch((err) => console.warn("Could not load users:", err));
    }
  }, [canAssign]);

  const categoryFilter = searchParams.get("category") || "";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
      if (tagId && tagId !== "ALL") params.set("tagId", tagId);
      if (categoryFilter && categoryFilter !== "ALL") params.set("category", categoryFilter);
      params.set("page", String(currentPage));
      params.set("limit", "25");

      const qs = params.toString();
      const res = await apiClient<Lead[]>(`/leads${qs ? `?${qs}` : ""}`);
      if (res.success && res.data) {
        setLeads(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tagId, categoryFilter, currentPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  // ─── Bulk Action Helpers ─────────────────────────────────────
  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const clearSelection = () => {
    setSelectedLeadIds([]);
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await apiClient<{ count: number; message: string }>("/leads/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          status: selectedBulkStatus,
        }),
      });
      if (res.success) {
        toast.success(res.data?.message || `Updated status for ${selectedLeadIds.length} lead(s)`);
        setShowBulkStatusModal(false);
        clearSelection();
        fetchLeads();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update leads");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkAssignAgent = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await apiClient<{ count: number; message: string }>("/leads/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          assignedToId: selectedBulkAssignee || null,
        }),
      });
      if (res.success) {
        toast.success(res.data?.message || `Reassigned ${selectedLeadIds.length} lead(s)`);
        setShowBulkAssignModal(false);
        clearSelection();
        fetchLeads();
      } else {
        toast.error(res.error || "Failed to assign leads");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign leads");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await apiClient<{ count: number; message: string }>("/leads/bulk-delete", {
        method: "POST",
        body: JSON.stringify({
          leadIds: selectedLeadIds,
        }),
      });
      if (res.success) {
        toast.success(res.data?.message || `Deleted ${selectedLeadIds.length} lead(s)`);
        setShowBulkDeleteConfirm(false);
        clearSelection();
        fetchLeads();
      } else {
        toast.error(res.error || "Failed to delete leads");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete leads");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await apiClient<Lead>("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: formName,
          displayName: formDisplayName || undefined,
          companyName: formCompanyName ? formCompanyName.trim() : undefined,
          designation: formDesignation ? formDesignation.trim() : undefined,
          phoneNumber: formPhone,
          whatsappNumber: formWhatsappNumber || undefined,
          email: formEmail || undefined,
          notes: formNotes || undefined,
          category: formCategory,
          assignedToId: canAssign && formAssignedTo ? formAssignedTo : undefined,
        }),
      });

      setFormSuccess("Lead added successfully!");
      setFormName("");
      setFormDisplayName("");
      setFormCompanyName("");
      setFormDesignation("");
      setFormPhone("");
      setFormWhatsappNumber("");
      setFormEmail("");
      setFormNotes("");
      setFormCategory("Manual Entry");
      setFormAssignedTo("");

      // Refresh the list & close after brief delay
      fetchLeads();
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess("");
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create lead";
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-primary" />
            Leads Pipeline
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {leads.length} leads total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canAssign && (
            <button
              type="button"
              onClick={() => setShowMergeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-primary hover:border-brand-primary/40 px-5 py-3.5 text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <GitMerge className="h-4 w-4 text-brand-primary" />
              Merge Duplicates
            </button>
          )}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError("");
              setFormSuccess("");
            }}
            className={`inline-flex items-center gap-3 rounded-xl px-7 py-3.5 text-sm font-bold shadow-md transition-all cursor-pointer ${showAddForm
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
              : "bg-brand-primary text-white hover:bg-brand-accent shadow-md hover:shadow-lg"
              }`}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add Lead
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Add Lead Inline Form ─────────────────────────────── */}
      {showAddForm && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Form Header */}
          <div className="flex items-center justify-between bg-slate-50/70 border-b border-slate-200/80 px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Plus className="h-4 w-4 text-brand-primary" />
                </span>
                Manual Lead Injection
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Insert a customer phone contact or organic sales prospect into
                the pipeline.
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleAddLead} className="p-6 space-y-5">
            {/* Error Alert */}
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                <X className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Success Alert */}
            {formSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {formSuccess}
              </div>
            )}

            {/* Row 1: Client Name & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Client Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. Katherine Lim"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. Katherine"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 ml-1 flex items-center gap-1">
                  Display name is what your clients will see
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500">i</span>
                </p>
              </div>
            </div>

            {/* Row: Company Name & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Designation / Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. Procurement Lead"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Mobile Number & WhatsApp Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. +94 1234 5678"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              {!HIDE_WHATSAPP_MESSAGING && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={formWhatsappNumber}
                      onChange={(e) => setFormWhatsappNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      placeholder="e.g. +94 1234 5678"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Email & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="e.g. katherine@example.com"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Source Category
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Role-aware Lead Assignment (Admin / Team Lead can delegate to any sales agent on creation) */}
            {canAssign && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign To Agent
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-base sm:text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.email} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Row 4: Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                  placeholder="Add notes about your client here..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormCompanyName("");
                  setFormDesignation("");
                  setFormError("");
                  setFormSuccess("");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-accent text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Lead…
                  </>
                ) : (
                  "💾 Save & Inject Lead"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified LeadFilters Component with Debounce, Tags & Status */}
      <LeadFilters />

      {/* Leads list */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-600">No leads found</h3>
          <p className="mt-1 text-sm text-slate-400">
            {search || statusFilter ? "Try adjusting your filters" : HIDE_WHATSAPP_MESSAGING ? "Leads will appear here once added or assigned" : "Leads will appear here from WhatsApp campaigns"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* List Header & Select All Row */}
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-2 hover:text-slate-800 transition-colors cursor-pointer select-none py-1"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  selectedLeadIds.length === leads.length && leads.length > 0
                    ? "bg-blue-600 border-blue-600 text-white"
                    : selectedLeadIds.length > 0
                    ? "bg-blue-100 border-blue-400 text-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedLeadIds.length === leads.length && leads.length > 0 ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : selectedLeadIds.length > 0 ? (
                  <span className="w-2 h-0.5 bg-blue-600 rounded-full" />
                ) : null}
              </div>
              <span>
                {selectedLeadIds.length === leads.length && leads.length > 0
                  ? "Deselect All"
                  : `Select All (${leads.length})`}
              </span>
            </button>

            {selectedLeadIds.length > 0 && (
              <span className="text-blue-600 font-bold">
                {selectedLeadIds.length} of {leads.length} selected
              </span>
            )}
          </div>

          {/* Lead Cards List */}
          {leads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.id);
            const rawPhone = lead.whatsappNumber || lead.phoneNumber || "";
            const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
            const waPhone = cleanPhone.replace(/^\+/, "");
            const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);

            return (
              <div
                key={lead.id}
                className={`flex items-start sm:items-center rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                  isSelected
                    ? "border-blue-500/80 bg-blue-50/20 ring-1 ring-blue-500/30"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Checkbox Trigger (Isolated Touch Area) */}
                <div
                  onClick={(e) => toggleSelectLead(lead.id, e)}
                  className="p-3 sm:p-4 flex items-center justify-center cursor-pointer shrink-0 select-none min-h-[44px] min-w-[44px]"
                  title={isSelected ? "Deselect lead" : "Select lead"}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Card Content (Tapping Navigates to Lead Detail) */}
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex-1 py-3.5 pr-4 pl-0 sm:py-4 sm:pr-5 min-w-0 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Initials Avatar (Hidden on mobile per user request: hidden sm:flex) */}
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] text-white text-xs font-bold shadow-xs mt-0.5 sm:mt-0">
                      {(lead.name || lead.phoneNumber).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Row 1: Name + Status Badge + Category */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {lead.name || "Unknown Prospect"}
                        </p>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[lead.status] || "#94a3b8"}18`,
                            color: STATUS_COLORS[lead.status] || "#94a3b8",
                          }}
                        >
                          {lead.status}
                        </span>
                        {lead.category && (
                          <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {lead.category}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Company & Designation */}
                      {(lead.companyName || lead.designation) && (
                        <p className="text-xs text-slate-600 truncate flex items-center gap-1 font-medium">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            {lead.companyName && lead.designation
                              ? `${lead.designation} at ${lead.companyName}`
                              : lead.companyName || lead.designation}
                          </span>
                        </p>
                      )}

                      {/* Row 3: Direct Actions (Call, WhatsApp) & Metadata */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {/* Direct Call Link */}
                        {hasPhone ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${cleanPhone}`;
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            title="Call lead directly"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{lead.phoneNumber}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {lead.phoneNumber}
                          </span>
                        )}

                        {/* Direct WhatsApp Link */}
                        {hasPhone && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${waPhone}`, "_blank", "noopener,noreferrer");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </span>
                        )}

                        {/* Assigned Agent */}
                        {lead.assignedTo && (
                          <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <User className="h-3 w-3 text-slate-400" />
                            <span>{lead.assignedTo.name || lead.assignedTo.email}</span>
                          </span>
                        )}

                        {/* Tags Count */}
                        {lead.tags && lead.tags.length > 0 && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Tag className="h-3 w-3" />
                            <span>{lead.tags.length}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && leads.length > 0 && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-bold text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-bold text-slate-800">{pagination.total}</span> leads
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>

            <span className="px-3 py-1 text-xs font-bold text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Floating Bulk Action Bar ─────────────────────────── */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl sm:rounded-full px-4 py-3 sm:px-6 sm:py-3 shadow-2xl border border-slate-700/80 flex items-center justify-between sm:justify-center gap-3 sm:gap-6 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[11px]">
              {selectedLeadIds.length}
            </span>
            <span className="hidden sm:inline">selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700 shrink-0" />

          <div className="flex items-center gap-2">
            {/* Status Change Button */}
            <button
              type="button"
              onClick={() => setShowBulkStatusModal(true)}
              disabled={bulkActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>Status</span>
            </button>

            {/* Assign Agent Button (Admin & Team Lead) */}
            {canAssign && (
              <button
                type="button"
                onClick={() => setShowBulkAssignModal(true)}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assign</span>
              </button>
            )}

            {/* Delete Button (Admin & Team Lead) */}
            {canAssign && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            {/* Clear Selection Button */}
            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkActionLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Bulk Status Modal ───────────────────────────────── */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Change Status ({selectedLeadIds.length} leads)
              </h4>
              <button
                type="button"
                onClick={() => setShowBulkStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedBulkStatus(st)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedBulkStatus === st
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkStatusModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleBulkUpdateStatus}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {bulkActionLoading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Assign Modal ───────────────────────────────── */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Assign Agent ({selectedLeadIds.length} leads)
              </h4>
              <button
                type="button"
                onClick={() => setShowBulkAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Agent</label>
              <select
                value={selectedBulkAssignee}
                onChange={(e) => setSelectedBulkAssignee(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name ? `${ag.name} (${ag.role})` : ag.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleBulkAssignAgent}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {bulkActionLoading ? "Assigning..." : "Assign Leads"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Delete Confirm Dialog ──────────────────────── */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete Selected Leads"
        message={`Are you sure you want to delete ${selectedLeadIds.length} selected lead(s)? This action cannot be undone.`}
        confirmLabel="Delete Leads"
        variant="danger"
        isLoading={bulkActionLoading}
        onConfirm={handleBulkDelete}
        onClose={() => setShowBulkDeleteConfirm(false)}
      />

      {/* ─── Merge Leads Modal ───────────────────────────────── */}
      <MergeLeadsModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        leads={leads}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
