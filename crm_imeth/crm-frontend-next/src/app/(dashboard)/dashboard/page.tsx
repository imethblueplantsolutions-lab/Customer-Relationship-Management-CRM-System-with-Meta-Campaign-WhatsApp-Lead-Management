"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import type { DashboardStats } from "@/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { LayoutDashboard, ArrowRight, Plus, CheckCircle2, Users } from "lucide-react";

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mx-auto mb-6" />
          <div className="h-[290px] bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  ),
});

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#eab308",
  QUALIFIED: "#8b5cf6",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiClient<DashboardStats>("/dashboard/stats");
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          const msg = typeof res.error === "string" ? res.error : (res.error as any)?.message || "Failed to load stats";
          setError(msg);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
              <div className="h-10 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded mx-auto mb-6" />
              <div className="h-[290px] bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-red-700 max-w-xl mx-auto mt-12">
        <h3 className="font-bold mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || "#94a3b8",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <LayoutDashboard className="h-6 w-6 text-blue-600" />
          Dashboard
        </h2>
        <p className="text-sm text-slate-500 mt-1">Campaign & Lead Analytics Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Total Leads */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left flex flex-col justify-between">
          <div>
            <p className="text-[15px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Leads
            </p>
            <p className="text-4xl sm:text-[40px] font-extrabold text-slate-800 mt-2.5 leading-none">
              {stats.totalLeads}
            </p>
          </div>
          {stats.totalLeads === 0 && (
            <Link
              href="/leads"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Add your first lead <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Converted */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left">
          <p className="text-[15px] font-semibold text-slate-500 uppercase tracking-wider">
            Converted
          </p>
          <p className="text-4xl sm:text-[40px] font-extrabold text-slate-800 mt-2.5 leading-none">
            {stats.statusBreakdown.CONVERTED || 0}
          </p>
        </div>

        {/* Qualified */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left">
          <p className="text-[15px] font-semibold text-slate-500 uppercase tracking-wider">
            Qualified
          </p>
          <p className="text-4xl sm:text-[40px] font-extrabold text-slate-800 mt-2.5 leading-none">
            {stats.statusBreakdown.QUALIFIED || 0}
          </p>
        </div>

        {/* Pending Follow-ups */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left flex flex-col justify-between">
          <div>
            <p className="text-[15px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Follow-ups
            </p>
            <p className="text-4xl sm:text-[40px] font-extrabold text-slate-800 mt-2.5 leading-none">
              {stats.pendingFollowups}
            </p>
          </div>
          {stats.pendingFollowups === 0 ? (
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> All caught up! 🎉
            </span>
          ) : (
            <Link
              href="/followups"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View tasks <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Charts row — lazy loaded */}
      <DashboardCharts statusData={statusData} />

      {/* Recent Leads */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-700">Recent Leads</h3>
          {stats.recentLeads.length > 0 && (
            <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          )}
        </div>

        {stats.recentLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-700">No leads recorded yet</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Start adding customer leads to track their status, communications, and conversion pipeline.
            </p>
            <Link
              href="/leads"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Go to Leads
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-widest">Name</th>
                  <th className="pb-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-widest">Phone</th>
                  <th className="pb-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-widest">Status</th>
                  <th className="pb-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-widest">Updated</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">
                      <Link href={`/leads/${lead.id}`} className="hover:text-blue-600">
                        {lead.name || "—"}
                      </Link>
                    </td>
                    <td className="py-4 text-slate-600">{lead.phoneNumber}</td>
                    <td className="py-4">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${STATUS_COLORS[lead.status] || "#94a3b8"}20`,
                          color: STATUS_COLORS[lead.status] || "#94a3b8",
                        }}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 text-xs">
                      {formatDate(lead.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
