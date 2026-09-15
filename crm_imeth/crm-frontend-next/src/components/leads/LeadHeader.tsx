"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  ChevronDown,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Lead } from "@/types";

export const PIPELINE_STAGES = [
  { value: "NEW", label: "New Lead", order: 1, color: "bg-blue-500", text: "text-blue-600", activeBg: "bg-blue-600 text-white" },
  { value: "CONTACTED", label: "Contacted", order: 2, color: "bg-amber-500", text: "text-amber-600", activeBg: "bg-amber-500 text-white" },
  { value: "QUALIFIED", label: "Qualified", order: 3, color: "bg-purple-500", text: "text-purple-600", activeBg: "bg-purple-600 text-white" },
  { value: "CONVERTED", label: "Converted", order: 4, color: "bg-emerald-500", text: "text-emerald-600", activeBg: "bg-emerald-600 text-white" },
];

export const STATUS_OPTIONS = [
  ...PIPELINE_STAGES,
  { value: "LOST", label: "Lost / Closed", order: 5, color: "bg-rose-500", text: "text-rose-600", activeBg: "bg-rose-600 text-white", bg: "bg-rose-50 border-rose-200" },
];

interface LeadHeaderProps {
  lead: Lead;
  canDeleteLead: boolean;
  deletingLead: boolean;
  statusUpdating: boolean;
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onDeleteLead: () => Promise<void>;
}

export default function LeadHeader({
  lead,
  canDeleteLead,
  deletingLead,
  statusUpdating,
  onUpdateStatus,
  onDeleteLead,
}: LeadHeaderProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Calculate Stage Duration (relative from updatedAt)
  const calculateStageDuration = () => {
    const now = new Date().getTime();
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
  };

  const durationInfo = calculateStageDuration();
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.value === lead.status);
  const isLost = lead.status === "LOST";

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* ─── Breadcrumb & Top Bar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/leads"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Back to Leads"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
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
            <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.phoneNumber}</span>
              <span className="text-slate-300">•</span>
              <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
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

          {/* WhatsApp Direct Link (Hidden in Phase 1) */}
          {false && (
            <a
              href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Web</span>
            </a>
          )}

          {/* Secondary Dropdown Status Selector */}
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={statusUpdating}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
              <span className={`h-2 w-2 rounded-full ${currentStatusObj.color}`} />
              <span>{currentStatusObj.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Change Lead Status
                </p>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onUpdateStatus(opt.value);
                      setStatusMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                      <span>{opt.label}</span>
                    </div>
                    {lead.status === opt.value && (
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = lead.status === stage.value;
            const isCompleted = currentStageIndex > idx && !isLost;
            const isUpcoming = currentStageIndex < idx && !isLost;

            let style = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300";
            let badge = "bg-slate-200 text-slate-600";

            if (isCurrent) {
              style = `${stage.activeBg} border-transparent shadow-sm ring-2 ring-blue-500/20 font-bold scale-[1.01]`;
              badge = "bg-white/25 text-white";
            } else if (isCompleted) {
              style = "bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60";
              badge = "bg-emerald-200 text-emerald-800";
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
}
