"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { Lead } from "@/types";
import { useCrmWinCelebration } from "@/hooks/useCrmWinCelebration";

export const PIPELINE_STAGES = [
  { value: "NEW", label: "New Lead", order: 1, color: "bg-blue-500", text: "text-blue-600", activeBg: "bg-blue-600 text-white" },
  { value: "CONTACTED", label: "Contacted", order: 2, color: "bg-amber-500", text: "text-amber-600", activeBg: "bg-amber-500 text-white" },
  { value: "QUALIFIED", label: "Qualified", order: 3, color: "bg-purple-500", text: "text-purple-600", activeBg: "bg-purple-600 text-white" },
  { value: "CONVERTED", label: "Converted", order: 4, color: "bg-emerald-500", text: "text-emerald-600", activeBg: "bg-emerald-600 text-white" },
  { value: "LOST", label: "Lost", order: 5, color: "bg-rose-500", text: "text-rose-600", activeBg: "bg-rose-600 text-white" },
];

export const STATUS_OPTIONS = PIPELINE_STAGES;

interface LeadHeaderProps {
  lead: Lead;
  canDeleteLead: boolean;
  deletingLead: boolean;
  statusUpdating: boolean;
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onDeleteLead: () => Promise<void>;
}

export default memo(function LeadHeader({
  lead,
  canDeleteLead,
  deletingLead,
  statusUpdating,
  onUpdateStatus,
  onDeleteLead,
}: LeadHeaderProps) {
  // Gamified celebration hook: fires audio chime and confetti on transition into Converted stage
  useCrmWinCelebration(lead.status);

  // Calculate Stage Duration (relative from updatedAt)
  const durationInfo = useMemo(() => {
    const now = Date.now();
    const updated = new Date(lead.updatedAt || lead.createdAt).getTime();
    const diffMs = Math.max(0, now - updated);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return { days: diffDays, text: `${diffDays}d in stage`, isStale: diffDays >= 3 && ["NEW", "CONTACTED"].includes(lead.status) };
    }
    if (diffHours > 0) {
      return { days: 0, text: `${diffHours}h in stage`, isStale: false };
    }
    return { days: 0, text: "Just moved", isStale: false };
  }, [lead.updatedAt, lead.createdAt, lead.status]);

  const currentStageIndex = useMemo(
    () => PIPELINE_STAGES.findIndex((s) => s.value === lead.status),
    [lead.status]
  );
  const isLost = lead.status === "LOST";

  const currentStatusObj = useMemo(
    () => STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0],
    [lead.status]
  );

  return (
    <div className="space-y-4">
      {/* ─── Breadcrumb & Top Bar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {/* Row 1: Left Arrow + Title + Badges (Horizontally Aligned) */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/leads"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
              title="Back to Leads"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 truncate">
              {lead.name || "Unknown Customer"}
            </h1>
            {lead.category && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                {lead.category}
              </span>
            )}
            {durationInfo.isStale && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Stale ({durationInfo.text})
              </span>
            )}
          </div>

          {/* Row 2: Phone & Created Date (Indented to align with lead name) */}
          <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1 ml-12">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{lead.phoneNumber}</span>
            <span className="text-slate-300">•</span>
            <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Delete Lead Button (Admin / Team Lead only) */}
          {canDeleteLead && (
            <button
              onClick={onDeleteLead}
              disabled={deletingLead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Delete Lead"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span className="hidden sm:inline">{deletingLead ? "Deleting..." : "Delete Lead"}</span>
            </button>
          )}

          {/* Status Badge (Read-Only Indicator) */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs select-none">
            <span className={`h-2 w-2 rounded-full ${currentStatusObj.color}`} />
            <span>{currentStatusObj.label}</span>
          </div>
        </div>
      </div>

      {/* ─── Interactive Pipeline Stage Stepper ─────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 tracking-tight uppercase">
              Pipeline Stage
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Clock className="h-3 w-3 text-slate-400" />
              {durationInfo.text}
            </span>
          </div>

          {/* Lost Notice (Only shown when closed as lost) */}
          {isLost && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700">
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                Lead Closed as Lost
              </span>
            </div>
          )}
        </div>

        {/* Stepper Chevrons / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = lead.status === stage.value;
            const isCompleted = currentStageIndex > idx && !isLost;

            let style = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300";
            let badge = "bg-slate-200 text-slate-600";

            if (isCurrent) {
              const ringColor = isLost ? "ring-rose-500/20" : "ring-blue-500/20";
              style = `${stage.activeBg} border-transparent shadow-sm ring-2 ${ringColor} font-bold scale-[1.01]`;
              badge = "bg-white/25 text-white";
            } else if (isCompleted) {
              style = "bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60";
              badge = "bg-emerald-200 text-emerald-800";
            } else if (isLost && stage.value !== "LOST") {
              style = "bg-slate-50/60 border-slate-200/80 text-slate-400 hover:bg-slate-100/60";
              badge = "bg-slate-200/80 text-slate-400";
            }

            return (
              <button
                key={stage.value}
                type="button"
                onClick={() => onUpdateStatus(stage.value)}
                disabled={statusUpdating}
                className={`relative flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer select-none text-left ${style}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${badge}`}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="truncate font-semibold">{stage.label}</span>
                </div>

                {isCurrent && (
                  <span className="hidden xl:inline-block text-[10px] uppercase font-bold opacity-90">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
