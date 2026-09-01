"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { Lead } from "@/types";
import { Search, Plus, ChevronRight, Phone, Tag, Users } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#eab308",
  QUALIFIED: "#8b5cf6",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leads Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">
            {leads.length} leads total
          </p>
        </div>
        <Link
          href="/leads/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#075e54] transition-all"
        >
          <Plus className="h-4 w-4" /> Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
        <div className="space-y-2">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between rounded-2xl bg-white border border-slate-200/60 px-5 py-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
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
