"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { Lead } from "@/types";
import {
  Search,
  Plus,
  ChevronRight,
  Phone,
  Tag,
  Users,
  X,
  User,
  FolderOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Add Lead form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCategory, setFormCategory] = useState("Manual Entry");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString();
      const res = await apiClient<Lead[]>(`/leads${qs ? `?${qs}` : ""}`);
      if (res.success && res.data) setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
          phoneNumber: formPhone,
          category: formCategory,
        }),
      });

      setFormSuccess("Lead added successfully!");
      setFormName("");
      setFormPhone("");
      setFormCategory("Manual Entry");

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
          <h2 className="text-2xl font-bold text-slate-800">Leads Pipeline</h2>
          <p className="text-sm text-slate-500 mt-2">
            {leads.length} leads total
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError("");
            setFormSuccess("");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition-all cursor-pointer ${
            showAddForm
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
              : "bg-[#128c7e] text-white hover:bg-[#075e54]"
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

      {/* ─── Add Lead Inline Form ─────────────────────────────── */}
      {showAddForm && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Form Header */}
          <div className="flex items-center justify-between bg-slate-50/70 border-b border-slate-200/80 px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-[#075e54] flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25d366]/10">
                  <Plus className="h-4 w-4 text-[#25d366]" />
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                    placeholder="e.g. Alice Smith"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 font-mono placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                    placeholder="e.g. 15551234567"
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
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-900 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all cursor-pointer"
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

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#25d366] hover:bg-[#128c7e] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Lead…
                  </>
                ) : (
                  "Save & Inject Lead"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="CONVERTED">Converted</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#128c7e] border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-600">No leads found</h3>
          <p className="mt-1 text-sm text-slate-400">
            {search || statusFilter ? "Try adjusting your filters" : "Leads will appear here from WhatsApp campaigns"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between rounded-2xl bg-white border border-slate-200/60 px-6 py-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128c7e]/10 text-sm font-bold text-[#128c7e]">
                  {(lead.name || lead.phoneNumber).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {lead.name || "Unknown"}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone className="h-3 w-3" /> {lead.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lead.tags && lead.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    <Tag className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">
                      {lead.tags.length}
                    </span>
                  </div>
                )}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${STATUS_COLORS[lead.status] || "#94a3b8"}20`,
                    color: STATUS_COLORS[lead.status] || "#94a3b8",
                  }}
                >
                  {lead.status}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#128c7e] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
