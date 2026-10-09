"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  User,
  Phone,
  Mail,
  Video,
  CheckSquare,
  Trash2,
  Share2,
  CalendarDays,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import type { Followup } from "@/types";
import { formatDateTime } from "@/lib/utils";
import DateTimePicker24h from "@/components/ui/DateTimePicker24h";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar-sync";

interface FollowupDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  followup: Followup | null;
  canManageAssignment: boolean;
  canDelete: boolean;
  agents: { id: string; name?: string; email: string; role: string; avatar?: string }[];
  currentUserId?: string;
  onUpdate: (
    followupId: string,
    leadId: string,
    data: {
      type?: string;
      note?: string;
      dueAt?: string | null;
      assignedToId?: string | null;
      completed?: boolean;
    }
  ) => Promise<void>;
  onToggleComplete: (f: Followup) => Promise<void>;
  onDelete: (f: Followup) => Promise<void>;
}

export default function FollowupDetailDrawer({
  isOpen,
  onClose,
  followup,
  canManageAssignment,
  canDelete,
  agents,
  currentUserId,
  onUpdate,
  onToggleComplete,
  onDelete,
}: FollowupDetailDrawerProps) {
  const [type, setType] = useState<string>("CALL");
  const [dueAt, setDueAt] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (followup) {
      setType(followup.type || "CALL");
      setDueAt(followup.dueAt ? new Date(followup.dueAt).toISOString() : "");
      setNote(followup.note || "");
      setAssignedToId(followup.assignedToId || "");
    }
  }, [followup]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !followup) return null;

  const now = new Date();
  const isOverdue = !followup.completed && followup.dueAt && new Date(followup.dueAt) < now;
  const leadName = followup.lead?.name || followup.lead?.phoneNumber || "Unassigned Lead";

  const isAssigneeOrCreator =
    followup.assignedToId === currentUserId || followup.createdById === currentUserId;
  const canEdit = canManageAssignment || isAssigneeOrCreator;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followup.leadId) return;

    setSaving(true);
    try {
      await onUpdate(followup.id, followup.leadId, {
        type,
        dueAt: dueAt || null,
        note,
        ...(canManageAssignment && { assignedToId: assignedToId || null }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this follow-up for "${leadName}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(followup);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t.toUpperCase()) {
      case "CALL":
        return <Phone className="h-4 w-4 text-emerald-600" />;
      case "EMAIL":
        return <Mail className="h-4 w-4 text-blue-600" />;
      case "MEETING":
        return <Video className="h-4 w-4 text-purple-600" />;
      default:
        return <CheckSquare className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl z-10 flex flex-col h-[100dvh] border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0">
              {getTypeIcon(followup.type)}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 truncate">
                {leadName}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                <span>Follow-up Details</span>
                {followup.lead?.phoneNumber && (
                  <>
                    <span>•</span>
                    <span>{followup.lead.phoneNumber}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {followup.leadId && (
              <Link
                href={`/leads/${followup.leadId}`}
                target="_blank"
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                title="Open Lead in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body with Vertical Elasticity */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {/* Status & Deadline Banner */}
          <div className="p-4 rounded-2xl border bg-slate-50/60 border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Task Status
              </span>

              {followup.completed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs border border-red-200 animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  <Clock className="h-3.5 w-3.5" />
                  Scheduled
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500 font-medium">Scheduled Deadline:</span>
              <span className="font-semibold text-slate-800">
                {followup.dueAt ? formatDateTime(followup.dueAt) : "No date set"}
              </span>
            </div>

            {/* Quick Completion Button */}
            <button
              type="button"
              onClick={() => onToggleComplete(followup)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-2xs ${
                followup.completed
                  ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
              }`}
            >
              {followup.completed ? (
                <>
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  Reopen Follow-up Task
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Task as Done
                </>
              )}
            </button>
          </div>

          {/* Form: Editable fields */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Task Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Activity Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "CALL", label: "Call", icon: Phone },
                  { id: "EMAIL", label: "Email", icon: Mail },
                  { id: "MEETING", label: "Meeting", icon: Video },
                  { id: "TASK", label: "Task", icon: CheckSquare },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setType(item.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date & Time */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Reschedule Date & 24H Time
              </label>
              <DateTimePicker24h
                value={dueAt}
                onChange={setDueAt}
                placeholder="Choose due date and time"
              />
            </div>

            {/* Assignee (Admins & Team Leads can reassign) */}
            {canManageAssignment && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Team Member
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  disabled={!canManageAssignment}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="">Unassigned / Current User</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name ? `${ag.name} (${ag.email})` : ag.email} - {ag.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note Content */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Task Note / Objective
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!canEdit}
                placeholder="e.g. Call client to discuss product demo and quotation..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Save Button */}
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes / Reschedule
              </button>
            )}
          </form>

          {/* Calendar Sync Section */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
              Calendar Sync & Export
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={generateGoogleCalendarUrl(followup)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                Google Calendar
              </a>

              <button
                type="button"
                onClick={() => downloadIcsFile(followup)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-600" />
                Download .ics
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Exports RFC 5545 calendar event compatible with Outlook, Apple Calendar, and Google.
            </p>
          </div>

          {/* Delete Action (Admins & Team Leads) */}
          {canDelete && (
            <div className="pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Follow-up Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
