"use client";

import { useState, useEffect, memo } from "react";
import {
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  FileText,
  Sparkles,
  Smartphone,
  UserCheck,
  CheckCircle2,
  Trash2,
  Layers,
  X,
  Loader2,
  Pencil,
  User as UserIcon,
  ArrowRightLeft,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { Activity } from "@/types";
import { formatDateTime } from "@/lib/utils";
import DateTimePicker24h from "@/components/ui/DateTimePicker24h";

interface ActivityTypeStyle {
  circleBg: string;
  Icon: LucideIcon;
  label: string;
  tagBg: string;
}

const ACTIVITY_TYPE_CONFIG: Record<string, ActivityTypeStyle> = {
  PHONE_CALL: {
    circleBg: "bg-blue-100 text-blue-600",
    Icon: Phone,
    label: "Phone Call",
    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  MESSAGE: {
    circleBg: "bg-emerald-100 text-emerald-600",
    Icon: MessageCircle,
    label: "Direct Message",
    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  WHATSAPP_MOBILE_REPLY: {
    circleBg: "bg-emerald-100 text-emerald-700",
    Icon: Smartphone,
    label: "Mobile Reply",
    tagBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  MEETING: {
    circleBg: "bg-purple-100 text-purple-600",
    Icon: Calendar,
    label: "Meeting",
    tagBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  NOTE: {
    circleBg: "bg-amber-100 text-amber-600",
    Icon: FileText,
    label: "Note",
    tagBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SYSTEM_ASSIGNMENT: {
    circleBg: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Icon: UserCheck,
    label: "System Assignment",
    tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  STAGE_CHANGE: {
    circleBg: "bg-blue-100 text-blue-700 border border-blue-200",
    Icon: ArrowRightLeft,
    label: "Stage Changed",
    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  TASK_SCHEDULED: {
    circleBg: "bg-teal-50 text-teal-700 border border-teal-200",
    Icon: Clock,
    label: "Task Scheduled",
    tagBg: "bg-teal-50 text-teal-700 border-teal-200",
  },
  TASK_COMPLETED: {
    circleBg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Icon: CheckCircle2,
    label: "Task Completed",
    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const DEFAULT_ACTIVITY_STYLE: ActivityTypeStyle = {
  circleBg: "bg-slate-100 text-slate-600",
  Icon: FileText,
  label: "Activity",
  tagBg: "bg-slate-50 text-slate-700 border-slate-200",
};

function getStageConfig(stageStr: string) {
  const norm = stageStr.toUpperCase().replace(/\s+/g, "_").replace(/["']/g, "").trim();
  if (norm.includes("QUALIF")) {
    return {
      label: "Qualified",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      text: "text-purple-600 dark:text-purple-300",
      border: "border-purple-200/60 dark:border-purple-800/40",
      style: { backgroundColor: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" },
    };
  }
  if (norm.includes("CONVERT")) {
    return {
      label: "Converted",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-300",
      border: "border-emerald-200/60 dark:border-emerald-800/40",
      style: { backgroundColor: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
    };
  }
  if (norm.includes("CONTACT")) {
    return {
      label: "Contacted",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-600 dark:text-amber-300",
      border: "border-amber-200/60 dark:border-amber-800/40",
      style: { backgroundColor: "rgba(234, 179, 8, 0.12)", color: "#d97706" },
    };
  }
  if (norm.includes("NEW")) {
    return {
      label: "New Lead",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-600 dark:text-blue-300",
      border: "border-blue-200/60 dark:border-blue-800/40",
      style: { backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#2563eb" },
    };
  }
  if (norm.includes("LOST")) {
    return {
      label: "Lost",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-600 dark:text-rose-300",
      border: "border-rose-200/60 dark:border-rose-800/40",
      style: { backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#dc2626" },
    };
  }
  const cleanLabel = stageStr.replace(/["']/g, "").trim();
  const titleCased = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase();
  return {
    label: titleCased || stageStr,
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-200/60 dark:border-slate-700/40",
    style: { backgroundColor: "rgba(100, 116, 139, 0.12)", color: "#475569" },
  };
}

function StagePill({ stage }: { stage: string }) {
  const config = getStageConfig(stage);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors shadow-2xs ${config.bg} ${config.text} ${config.border}`}
      style={config.style}
    >
      {config.label}
    </span>
  );
}

function renderStageChangeTitle(title: string) {
  const arrowMatch = title.match(/^(Stage Changed:\s*)?(.*?)\s*(?:→|->|>)\s*(.*)$/i);
  if (arrowMatch && (arrowMatch[2] || arrowMatch[3])) {
    const prefix = arrowMatch[1] || "Stage Changed: ";
    const fromStage = arrowMatch[2].trim();
    const toStage = arrowMatch[3].trim();
    return (
      <span className="inline-flex items-center flex-wrap gap-1.5 font-bold text-slate-900">
        <span>{prefix}</span>
        <StagePill stage={fromStage} />
        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-0.5 inline-block" />
        <StagePill stage={toStage} />
      </span>
    );
  }
  return title;
}

function renderStageChangeDescription(description: string) {
  // Matches: Lead pipeline stage was moved from "Qualified" to "Converted"
  const match = description.match(/^(.*?from\s+)["']?([^"']+)["']?(\s+to\s+)["']?([^"']+)["']?(.*)$/i);
  if (match) {
    const prefix = match[1];
    const fromStage = match[2].trim();
    const mid = match[3];
    const toStage = match[4].trim();
    const suffix = match[5];
    return (
      <span className="inline-flex items-center flex-wrap gap-1.5 leading-normal">
        <span>{prefix}</span>
        <StagePill stage={fromStage} />
        <span>{mid}</span>
        <StagePill stage={toStage} />
        {suffix && <span>{suffix}</span>}
      </span>
    );
  }

  // Fallback: check if description contains an arrow like "StageA → StageB"
  const arrowMatch = description.match(/^(.*?)\s*["']?([^"'\s]+(?:\s+[^"'\s]+)?)["']?\s*(?:→|->|>)\s*["']?([^"'\s]+(?:\s+[^"'\s]+)?)["']?(.*)$/i);
  if (arrowMatch) {
    return (
      <span className="inline-flex items-center flex-wrap gap-1.5 leading-normal">
        {arrowMatch[1] && <span>{arrowMatch[1]}</span>}
        <StagePill stage={arrowMatch[2].trim()} />
        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-0.5 inline-block" />
        <StagePill stage={arrowMatch[3].trim()} />
        {arrowMatch[4] && <span>{arrowMatch[4]}</span>}
      </span>
    );
  }

  return description;
}

/**
 * Props for the LeadActivityTimeline component.
 * Manages chronological lead events, quick logging, and inline editing.
 */
interface LeadActivityTimelineProps {
  /** Array of chronological activities linked to this lead */
  activities: Activity[];
  /** Timestamp when the lead was originally created */
  leadCreatedAt: string;
  /** Whether the current user can reassign or manage assignments */
  canManageAssignment: boolean;
  /** List of available agents in the tenant */
  agents: { id: string; name?: string; email: string; role: string; avatar?: string }[];
  /** Current logged-in user ID */
  currentUserId?: string;
  /** Current logged-in user role */
  currentUserRole?: string;
  /** Current user display name */
  currentUserName?: string;
  /** Current user email */
  currentUserEmail?: string;
  /** Handler to log a new activity */
  onCreateActivity: (data: {
    type: string;
    title: string;
    description: string;
    occurredAt: string;
    createdById?: string;
  }) => Promise<void>;
  onUpdateActivity?: (
    activityId: string,
    data: {
      type?: string;
      title?: string;
      description?: string;
      occurredAt?: string;
    }
  ) => Promise<void>;
  onDeleteActivity: (activityId: string) => Promise<void>;
  isSubmittingActivity: boolean;
  /** Optional trigger to programmatically open the activity creation modal with a given type */
  openActivityTrigger?: { type: string; timestamp: number } | null;
}

export default memo(function LeadActivityTimeline({
  activities,
  leadCreatedAt,
  canManageAssignment,
  agents,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserEmail,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  isSubmittingActivity,
  openActivityTrigger,
}: LeadActivityTimelineProps) {
  // Classification: Timeline entries vs user Activity items
  const TIMELINE_TYPES = ["STAGE_CHANGE", "SYSTEM_ASSIGNMENT", "TASK_SCHEDULED", "TASK_COMPLETED"];

  // Role-based deletion permission:
  // - Admins: delete both timeline and activity items
  // - Team Leads: delete activity items but NOT timeline entries
  // - Sales Agents: restricted from deleting anything in Timeline & Activity
  const canDeleteActivityItem = (activityType: string): boolean => {
    if (!currentUserRole || currentUserRole === "AGENT") return false;
    if (currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "TEAM_LEAD") {
      return !TIMELINE_TYPES.includes(activityType);
    }
    return false;
  };

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    type: string;
    description: string;
    occurredAt: string;
    createdById?: string;
  }>({
    type: "NOTE",
    description: "",
    occurredAt: new Date().toISOString(),
    createdById: "",
  });

  // Edit Activity Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isUpdatingActivity, setIsUpdatingActivity] = useState(false);
  const [editForm, setEditForm] = useState<{
    type: string;
    description: string;
    occurredAt: string;
  }>({
    type: "NOTE",
    description: "",
    occurredAt: new Date().toISOString(),
  });

  const openActivityModal = (type: string) => {
    setActivityForm({
      type,
      description: "",
      occurredAt: new Date().toISOString(),
      createdById: currentUserId || "",
    });
    setIsActivityModalOpen(true);
  };

  useEffect(() => {
    if (openActivityTrigger?.timestamp) {
      openActivityModal(openActivityTrigger.type || "NOTE");
    }
  }, [openActivityTrigger]);

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setEditForm({
      type: activity.type,
      description: activity.description || "",
      occurredAt: activity.occurredAt || new Date().toISOString(),
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingActivity) return;

    await onCreateActivity({
      type: activityForm.type,
      title: "",
      description: activityForm.description.trim(),
      occurredAt: new Date(activityForm.occurredAt).toISOString(),
      createdById: activityForm.createdById || undefined,
    });

    setIsActivityModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !onUpdateActivity || isUpdatingActivity) return;
    setIsUpdatingActivity(true);
    try {
      await onUpdateActivity(editingActivity.id, {
        type: editForm.type,
        description: editForm.description.trim(),
        occurredAt: new Date(editForm.occurredAt).toISOString(),
      });
      setIsEditModalOpen(false);
      setEditingActivity(null);
    } finally {
      setIsUpdatingActivity(false);
    }
  };

  const getAuthorDisplayName = (createdBy?: { name?: string; email?: string; role?: string; avatar?: string }) => {
    if (!createdBy) return "Sales Agent";
    if (createdBy.name && createdBy.name.trim()) return createdBy.name;
    if (createdBy.email) {
      const namePart = createdBy.email.split("@")[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return "Sales Agent";
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">
            Timeline & Activity
          </h3>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {activities.length} entries
        </span>
      </div>

      {/* Quick-add Activity Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button
          type="button"
          onClick={() => openActivityModal("PHONE_CALL")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <Phone className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-700">Call</span>
        </button>
        <button
          type="button"
          onClick={() => openActivityModal("MESSAGE")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
            <MessageCircle className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-700">Message</span>
        </button>
        <button
          type="button"
          onClick={() => openActivityModal("MEETING")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-purple-700">Meeting</span>
        </button>
        <button
          type="button"
          onClick={() => openActivityModal("NOTE")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-amber-700">Note</span>
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-5 border-l-2 border-slate-200 space-y-5">
        {/* Lead Creation Node */}
        <div className="relative">
          <div className="absolute -left-[23px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
          <div className="ml-1">
            <p className="text-xs font-bold text-slate-700">Lead Created</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatDateTime(leadCreatedAt)}
            </p>
          </div>
        </div>

        {/* Dynamic Activity Nodes */}
        {activities.map((activity) => {
          const config = ACTIVITY_TYPE_CONFIG[activity.type] || DEFAULT_ACTIVITY_STYLE;
          const IconComponent = config.Icon;
          const authorName = getAuthorDisplayName(activity.createdBy);

          return (
            <div key={activity.id} className="relative group/activity">
              {/* Activity Icon on Vertical Track */}
              <div
                className={`absolute -left-[27px] mt-1.5 flex h-7 w-7 items-center justify-center rounded-full ${config.circleBg} ring-4 ring-white shadow-xs transition-transform group-hover/activity:scale-110`}
              >
                <IconComponent className="h-3.5 w-3.5" />
              </div>

              <div className="ml-3 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title & Type Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center flex-wrap gap-1.5">
                        {activity.type === "STAGE_CHANGE" || activity.title?.toLowerCase().includes("stage changed")
                          ? renderStageChangeTitle(activity.title || config.label)
                          : activity.title || config.label}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${config.tagBg}`}
                      >
                        <IconComponent className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>

                    {/* Activity Description */}
                    {activity.description && (
                      <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {activity.type === "STAGE_CHANGE" || activity.description.toLowerCase().includes("stage was moved")
                          ? renderStageChangeDescription(activity.description)
                          : <p className="whitespace-pre-wrap">{activity.description}</p>}
                      </div>
                    )}

                    {/* Footer with Creator & Timestamp */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      {activity.createdBy && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-[#BBE1FA]/30 px-2 py-1 text-xs font-bold text-[#0F4C75] shadow-xs">
                            {activity.createdBy.avatar ? (
                              <img
                                src={activity.createdBy.avatar}
                                alt={authorName}
                                className="h-4 w-4 rounded-full object-cover ring-1 ring-white shrink-0"
                              />
                            ) : (
                              <UserIcon className="h-3.5 w-3.5 text-black stroke-[2.5] shrink-0" />
                            )}
                            By {authorName}
                          </span>
                          {activity.createdBy.role && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({activity.createdBy.role === "ADMIN" ? "Admin" : activity.createdBy.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})
                            </span>
                          )}
                        </div>
                      )}

                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 ml-auto">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(activity.occurredAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons in top right corner */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!["SYSTEM_ASSIGNMENT", "STAGE_CHANGE"].includes(activity.type) && (
                      <button
                        type="button"
                        onClick={() => openEditModal(activity)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit activity"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDeleteActivityItem(activity.type) && (
                      <button
                        type="button"
                        onClick={() => onDeleteActivity(activity.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title={
                          TIMELINE_TYPES.includes(activity.type)
                            ? "Delete timeline entry (Admin only)"
                            : "Delete activity"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="ml-1 py-3">
            <p className="text-[11px] text-slate-400">No activities logged yet. Use the buttons above to add one.</p>
          </div>
        )}
      </div>

      {/* ─── Log Activity Modal Overlay ──────────────────────── */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Log Activity
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Activity Type
                </label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all"
                >
                  <option value="PHONE_CALL">📞 Phone Call</option>
                  <option value="MESSAGE">💬 Direct Message</option>
                  <option value="MEETING">📅 Meeting</option>
                  <option value="NOTE">📝 Note</option>
                </select>
              </div>

              {canManageAssignment && agents.length > 0 && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                    Logged By / Sales Agent
                  </label>
                  <select
                    value={activityForm.createdById || currentUserId || ""}
                    onChange={(e) => setActivityForm({ ...activityForm, createdById: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all"
                  >
                    <option value={currentUserId || ""}>
                      Me ({currentUserName || currentUserEmail?.split("@")[0] || "Me"})
                    </option>
                    {agents
                      .filter((a) => a.id !== currentUserId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.email} ({a.role === "ADMIN" ? "Admin" : a.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Date & Time (24H)
                </label>
                <DateTimePicker24h
                  value={activityForm.occurredAt}
                  onChange={(val) => setActivityForm({ ...activityForm, occurredAt: val })}
                  placeholder="Select date & 24h time"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  placeholder="Add notes about this activity..."
                  rows={4}
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingActivity}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingActivity ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {isSubmittingActivity ? "Saving..." : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Activity Modal Overlay ──────────────────────── */}
      {isEditModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-blue-600" />
                Edit Activity
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingActivity(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {!["SYSTEM_ASSIGNMENT", "TASK_SCHEDULED", "TASK_COMPLETED"].includes(editingActivity.type) ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                    Activity Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all"
                  >
                    <option value="PHONE_CALL">📞 Phone Call</option>
                    <option value="MESSAGE">💬 Direct Message</option>
                    <option value="MEETING">📅 Meeting</option>
                    <option value="NOTE">📝 Note</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                    Activity Type
                  </label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
                    {ACTIVITY_TYPE_CONFIG[editingActivity.type]?.label || editingActivity.type}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Date & Time (24H)
                </label>
                <DateTimePicker24h
                  value={editForm.occurredAt}
                  onChange={(val) => setEditForm({ ...editForm, occurredAt: val })}
                  placeholder="Select date & 24h time"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  placeholder="Add notes about this activity..."
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingActivity(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingActivity}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isUpdatingActivity ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {isUpdatingActivity ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

