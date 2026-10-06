"use client";

import { useMemo, memo, useRef, useState, useEffect } from "react";
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
  Building2,
  ChevronDown,
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
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const desktopConvertedWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownWrapperRef = useRef<HTMLDivElement | null>(null);

  // Close mobile dropdown when clicking or tapping outside
  useEffect(() => {
    if (!mobileDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        mobileDropdownWrapperRef.current &&
        !mobileDropdownWrapperRef.current.contains(e.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [mobileDropdownOpen]);

  // Gamified celebration hook: fires audio chime and localized button confetti on transition into Converted stage
  const { triggerCelebration } = useCrmWinCelebration(lead.status, desktopConvertedWrapperRef);

  const handleStageClick = async (stageValue: string, customContainer?: HTMLElement | null) => {
    if (stageValue === "CONVERTED") {
      const targetContainer =
        customContainer ||
        mobileDropdownWrapperRef.current ||
        desktopConvertedWrapperRef.current;
      triggerCelebration(targetContainer);
    }
    await onUpdateStatus(stageValue);
  };

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
        <div className="min-w-0 flex-1">
          {/* Row 1: Left Arrow + Title + Badges + Mobile Right-Side Top Delete Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
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

            {/* Mobile-Only Delete Button (Positioned at right-side top on mobile) */}
            {canDeleteLead && (
              <button
                onClick={onDeleteLead}
                disabled={deletingLead}
                className="sm:hidden inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Delete Lead"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            )}
          </div>

          {/* Row 2: Company/Designation (if present), Phone & Created Date (Indented to align with lead name) */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1 ml-12">
            {(lead.designation || lead.companyName) && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  {lead.designation && lead.companyName
                    ? `${lead.designation} at ${lead.companyName}`
                    : (lead.designation || lead.companyName)}
                </span>
                <span className="text-slate-300">•</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.phoneNumber}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Top Right Quick Actions (Desktop Position) */}
        <div className="flex items-center gap-2.5">
          {/* Delete Lead Button (Desktop only: hidden sm:inline-flex) */}
          {canDeleteLead && (
            <button
              onClick={onDeleteLead}
              disabled={deletingLead}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Delete Lead"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>{deletingLead ? "Deleting..." : "Delete Lead"}</span>
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

        {/* ─── Mobile View: Interactive Pipeline Stage Dropdown Selector (sm:hidden) ─── */}
        <div className="block sm:hidden relative button-wrapper" ref={mobileDropdownWrapperRef}>
          <button
            type="button"
            disabled={statusUpdating}
            onClick={() => setMobileDropdownOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/80 p-3 text-left shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
            aria-haspopup="listbox"
            aria-expanded={mobileDropdownOpen}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  isLost
                    ? "bg-rose-500 text-white"
                    : lead.status === "CONVERTED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isLost ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : lead.status === "CONVERTED" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  currentStageIndex >= 0 ? currentStageIndex + 1 : 1
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentStatusObj.label}
                  </p>
                  {lead.status === "CONVERTED" && (
                    <span className="text-[11px]">🎉</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Stage {currentStageIndex >= 0 ? currentStageIndex + 1 : 1} of {PIPELINE_STAGES.length} • Tap to switch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  lead.status === "CONVERTED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200/80 text-slate-700"
                }`}
              >
                Active
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  mobileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Mobile Dropdown Popover */}
          {mobileDropdownOpen && (
            <div
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
              role="listbox"
            >
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCurrent = lead.status === stage.value;
                const isCompleted = currentStageIndex > idx && !isLost;
                const isConverted = stage.value === "CONVERTED";

                let optionStyle = "hover:bg-slate-50 text-slate-700";
                if (isCurrent) {
                  optionStyle = isLost
                    ? "bg-rose-50 text-rose-800 font-bold"
                    : isConverted
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "bg-blue-50 text-blue-800 font-bold";
                }

                return (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => {
                      setMobileDropdownOpen(false);
                      handleStageClick(stage.value, mobileDropdownWrapperRef.current);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none text-left ${optionStyle}`}
                    role="option"
                    aria-selected={isCurrent}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                          isCurrent
                            ? stage.activeBg
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        ) : isCurrent ? (
                          <Sparkles className="h-3 w-3" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className="truncate">{stage.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConverted && (
                        <span className="text-[11px]">🎉</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Desktop View: Interactive Stepper Chevrons (hidden sm:grid) ─── */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = lead.status === stage.value;
            const isCompleted = currentStageIndex > idx && !isLost;
            const isConverted = stage.value === "CONVERTED";

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

            const buttonNode = (
              <button
                type="button"
                onClick={() => handleStageClick(stage.value, desktopConvertedWrapperRef.current)}
                disabled={statusUpdating}
                className={`relative flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer select-none text-left w-full h-full ${style} ${isConverted ? "confetti-button" : ""}`}
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

            if (isConverted) {
              return (
                <div
                  key={stage.value}
                  ref={desktopConvertedWrapperRef}
                  className="button-wrapper relative w-full h-full"
                >
                  {buttonNode}
                </div>
              );
            }

            return (
              <div key={stage.value} className="w-full h-full">
                {buttonNode}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
