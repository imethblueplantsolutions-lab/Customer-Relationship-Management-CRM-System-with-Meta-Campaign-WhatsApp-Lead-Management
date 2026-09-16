"use client";

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
import type { PieLabelRenderProps } from "recharts";

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

interface DashboardChartsProps {
  statusData: ChartDataItem[];
}

export default function DashboardCharts({ statusData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Bar Chart */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 text-center mb-6">Leads by Status</h3>
        <ResponsiveContainer width="100%" height={290}>
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
        <h3 className="text-base font-bold text-slate-800 text-center mb-6">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={290}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={(props: PieLabelRenderProps) => {
                const cx = Number(props.cx ?? 0);
                const cy = Number(props.cy ?? 0);
                const midAngle = Number(props.midAngle ?? 0);
                const oR = Number(props.outerRadius ?? 0);
                const name = String(props.name ?? "");
                const percent = Number(props.percent ?? 0);
                const fill = String(props.fill ?? "#94a3b8");

                const RADIAN = Math.PI / 180;
                const radius = oR + 28;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill={fill}
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {name} {(percent * 100).toFixed(0)}%
                  </text>
                );
              }}
              labelLine={{
                stroke: "#cbd5e1",
                strokeWidth: 1,
              }}
            >
              {statusData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
