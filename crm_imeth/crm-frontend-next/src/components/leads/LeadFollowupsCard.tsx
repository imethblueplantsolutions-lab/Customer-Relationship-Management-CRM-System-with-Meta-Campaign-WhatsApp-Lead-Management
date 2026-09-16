"use client";

import { useState, memo } from "react";
import { Calendar, Check } from "lucide-react";
import type { Followup } from "@/types";

interface LeadFollowupsCardProps {
  followups: Followup[];
  canManageAssignment: boolean;
  agents: { id: string; name?: string; email: string; role: string }[];
  userEmail?: string;
  onAddFollowup: (data: {
    type: string;
    note: string;
    dueAt: string;
    assignedToId?: string;
  }) => Promise<void>;
  onToggleComplete: (followupId: string, currentCompleted: boolean) => Promise<void>;
  addingFollowup: boolean;
}

export default memo(function LeadFollowupsCard({
  followups,
  canManageAssignment,
  agents,
  userEmail,
  onAddFollowup,
  onToggleComplete,
  addingFollowup,
}: LeadFollowupsCardProps) {
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupType, setFollowupType] = useState("CALL");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState("");
  const [followupAssignee, setFollowupAssignee] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingFollowup || !followupNote.trim()) return;

    await onAddFollowup({
      type: followupType,
      note: followupNote.trim(),
      dueAt: followupDueAt,
      assignedToId: canManageAssignment && followupAssignee ? followupAssignee : undefined,
    });

    setFollowupNote("");
    setFollowupDueAt("");
    setFollowupAssignee("");
    setShowFollowupForm(false);
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
                <option value="CALL">Phone Call</option>
                <option value="MEETING">Video / Live Meeting</option>
                <option value="DEMO">Product Demo</option>
                <option value="NOTE">General Note</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={followupDueAt}
                onChange={(e) => setFollowupDueAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
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
              disabled={addingFollowup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {addingFollowup ? "Saving..." : "Save Reminder"}
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
          {followups.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                item.completed
                  ? "border-emerald-100 bg-emerald-50/40"
                  : "border-slate-100 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleComplete(item.id, item.completed)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                    item.completed
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white hover:border-blue-500"
                  }`}
                  title={item.completed ? "Mark as pending" : "Mark as completed"}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </button>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    item.completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.type.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      item.completed ? "text-slate-400 line-through" : "text-slate-800"
                    }`}
                  >
                    {item.note || item.type}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>
                      {item.dueAt ? `Due: ${new Date(item.dueAt).toLocaleString()}` : "No due date set"}
                    </span>
                    {item.assignedTo && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          Assigned: {item.assignedTo.name || item.assignedTo.email}
                        </span>
                      </>
                    )}
                    {item.createdBy && item.createdBy.id !== item.assignedTo?.id && (
                      <>
                        <span>•</span>
                        <span>By: {item.createdBy.name || item.createdBy.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 ml-2">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
