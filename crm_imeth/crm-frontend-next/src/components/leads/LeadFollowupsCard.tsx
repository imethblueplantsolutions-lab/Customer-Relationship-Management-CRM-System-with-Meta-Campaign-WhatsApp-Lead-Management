"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Calendar, Check, Trash2, Clock, User } from "lucide-react";
import type { Followup } from "@/types";
import DateTimePicker24h from "@/components/ui/DateTimePicker24h";

function formatDueDate(dueAt?: string | null) {
  if (!dueAt) return "No due date set";
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Props for the LeadFollowupsCard component.
 * Allows scheduling tasks, reminders, and toggling completion status.
 */
interface LeadFollowupsCardProps {
  /** List of follow-ups linked to this lead */
  followups: Followup[];
  /** Whether the current user can assign reminders to other agents */
  canManageAssignment: boolean;
  /** List of agents available for assignment */
  agents: { id: string; name?: string; email: string; role: string; avatar?: string }[];
  /** Current user's email */
  userEmail?: string;
  /** Handler to schedule a new follow-up */
  onAddFollowup: (data: {
    type: string;
    note: string;
    dueAt: string;
    assignedToId?: string;
  }) => Promise<void>;
  /** Handler to toggle completion status */
  onToggleComplete: (followupId: string, currentCompleted: boolean) => Promise<void>;
  /** Handler to delete a follow-up (Admins & Team Leads) */
  onDeleteFollowup?: (followupId: string) => Promise<void>;
  /** Loading indicator when saving a new reminder */
  addingFollowup: boolean;
  /** Optional trigger timestamp to programmatically open the schedule form */
  openFormTrigger?: number;
}

export default memo(function LeadFollowupsCard({
  followups,
  canManageAssignment,
  agents,
  userEmail,
  onAddFollowup,
  onToggleComplete,
  onDeleteFollowup,
  addingFollowup,
  openFormTrigger,
}: LeadFollowupsCardProps) {
  const [showFollowupForm, setShowFollowupForm] = useState(false);

  useEffect(() => {
    if (openFormTrigger) {
      setShowFollowupForm(true);
    }
  }, [openFormTrigger]);
  const [followupType, setFollowupType] = useState("CALL");
  const [customFollowupType, setCustomFollowupType] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState("");
  const [followupAssignee, setFollowupAssignee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || addingFollowup || isSubmitting || !followupNote.trim()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const finalType =
        followupType === "OTHER"
          ? customFollowupType.trim() || "Other"
          : followupType;

      await onAddFollowup({
        type: finalType,
        note: followupNote.trim(),
        dueAt: followupDueAt,
        assignedToId: canManageAssignment && followupAssignee ? followupAssignee : undefined,
      });

      setFollowupNote("");
      setCustomFollowupType("");
      setFollowupDueAt("");
      setFollowupAssignee("");
      setShowFollowupForm(false);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">
            Follow-ups & Reminders
          </h3>
        </div>
        <button
          onClick={() => setShowFollowupForm(!showFollowupForm)}
          className="text-xs font-bold text-blue-600 hover:text-[#0F4C75] hover:underline cursor-pointer"
        >
          {showFollowupForm ? "Cancel" : "+ Schedule Task"}
        </button>
      </div>

      {/* Add Follow-up Form */}
      {showFollowupForm && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Task Type
              </label>
              <select
                value={followupType}
                onChange={(e) => setFollowupType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="CALL"> Call(Normal,WhatsApp,imo)</option>
                <option value="MEETING">Video / Live Meeting(Google meet,Zoom,Skype)</option>
                <option value="DEMO">Product Demonstration</option>
                <option value="NOTE">General Note</option>
                <option value="OTHER">Other</option>
              </select>

              {followupType === "OTHER" && (
                <div className="mt-2">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Specify Task Type
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Site Visit, Send Contract..."
                    value={customFollowupType}
                    onChange={(e) => setCustomFollowupType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Due Date & Time (24H)
              </label>
              <DateTimePicker24h
                value={followupDueAt}
                onChange={setFollowupDueAt}
                placeholder="Select date & 24h time"
              />
            </div>
          </div>

          {/* Role-aware Assign To Dropdown (Admin / Team Lead can delegate to any sales agent) */}
          {canManageAssignment && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Assign Reminder To
              </label>
              <select
                value={followupAssignee}
                onChange={(e) => setFollowupAssignee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Assign to myself ({userEmail || "Me"})</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name ? `${ag.name} (${ag.email})` : ag.email} ({ag.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Notes / Next Action
            </label>
            <input
              type="text"
              placeholder="e.g. Call to discuss Enterprise tier pricing proposal"
              value={followupNote}
              onChange={(e) => setFollowupNote(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingFollowup || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {addingFollowup || isSubmitting ? "Saving..." : "Save Reminder"}
            </button>
          </div>
        </form>
      )}

      {/* Follow-up List */}
      {followups.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No follow-ups scheduled. Click &quot;+ Schedule Task&quot; above to set reminders.
        </p>
      ) : (
        <div className="space-y-2.5">
          {followups.map((item) => {
            const isOverdue = !item.completed && item.dueAt && new Date(item.dueAt) < new Date();
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 sm:p-3.5 transition-colors ${item.completed
                  ? "border-emerald-100 bg-emerald-50/40"
                  : isOverdue
                    ? "border-red-200 bg-red-50/30"
                    : "border-slate-100 bg-slate-50/70"
                  }`}
              >
                <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
                  {/* Completion Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id, item.completed)}
                    className={`mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${item.completed
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : isOverdue
                        ? "border-red-300 bg-white hover:border-red-500"
                        : "border-slate-300 bg-white hover:border-blue-500"
                      }`}
                    title={item.completed ? "Mark as pending" : "Mark as completed"}
                  >
                    {item.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </button>

                  {/* Type Avatar Badge (Hidden on mobile per user request: hidden sm:flex) */}
                  <div
                    className={`hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${item.completed
                      ? "bg-emerald-100 text-emerald-700"
                      : isOverdue
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {item.type.charAt(0)}
                  </div>

                  {/* Main Details Body */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row: Note/Title & Badges/Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs sm:text-sm font-semibold leading-snug break-words ${item.completed
                          ? "text-slate-400 line-through"
                          : isOverdue
                            ? "text-red-900 font-bold"
                            : "text-slate-800"
                          }`}
                      >
                        {item.note || item.type}
                      </p>

                      {/* Mobile Actions / Badges (Right-aligned in top row on mobile) */}
                      <div className="flex items-center gap-1.5 shrink-0 sm:hidden">
                        {isOverdue && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 uppercase">
                            Overdue
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {item.type}
                        </span>
                        {canManageAssignment && onDeleteFollowup && (
                          <button
                            type="button"
                            onClick={() => onDeleteFollowup(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Follow-up"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata Row: Due Date & Assignee */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-500 mt-1">
                      <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                        <Clock className="h-3 w-3 shrink-0 opacity-70" />
                        {item.dueAt ? `Due: ${formatDueDate(item.dueAt)}` : "No due date set"}
                      </span>

                      {item.assignedTo && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <User className="h-3 w-3 shrink-0 opacity-70 sm:hidden" />
                          {item.assignedTo.avatar ? (
                            <img
                              src={item.assignedTo.avatar}
                              alt={item.assignedTo.name || "Assignee"}
                              className="h-3.5 w-3.5 rounded-full object-cover ring-1 ring-white shrink-0"
                            />
                          ) : null}
                          Assigned: {item.assignedTo.name || item.assignedTo.email}
                        </span>
                      )}

                      {/* Assigned By (Creator) text (Hidden on mobile per user request: hidden sm:inline-flex) */}
                      {item.createdBy && item.createdBy.id !== item.assignedTo?.id && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                          <span className="text-slate-300">•</span>
                          {item.createdBy.avatar ? (
                            <img
                              src={item.createdBy.avatar}
                              alt={item.createdBy.name || "Creator"}
                              className="h-3.5 w-3.5 rounded-full object-cover ring-1 ring-white shrink-0"
                            />
                          ) : null}
                          By: {item.createdBy.name || item.createdBy.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop Actions / Badges (hidden on mobile, visible on sm:flex) */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2">
                    {isOverdue && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 uppercase tracking-wide">
                        Overdue
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {item.type}
                    </span>
                    {canManageAssignment && onDeleteFollowup && (
                      <button
                        type="button"
                        onClick={() => onDeleteFollowup(item.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                        title="Delete Follow-up (Admin & Team Lead)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
