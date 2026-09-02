"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { DashboardStats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, UserCheck, TrendingUp, Clock } from "lucide-react";

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
    (async () => {
      try {
        const res = await apiClient<DashboardStats>("/dashboard/stats");
        if (res.success && res.data) setStats(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#128c7e] border-t-transparent" />
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

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "bg-blue-500" },
    { label: "Converted", value: stats.statusBreakdown.CONVERTED || 0, icon: UserCheck, color: "bg-emerald-500" },
    { label: "Qualified", value: stats.statusBreakdown.QUALIFIED || 0, icon: TrendingUp, color: "bg-purple-500" },
    { label: "Pending Follow-ups", value: stats.pendingFollowups, icon: Clock, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-2">Campaign & Lead Analytics Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                    {card.label}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} rounded-xl p-3 text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        {/* Bar Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5">Leads by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={(props: { name?: string; percent?: number }) =>
                  `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5">Recent Leads</h3>
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
                  <td className="py-4 font-medium text-slate-800">{lead.name || "—"}</td>
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
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
