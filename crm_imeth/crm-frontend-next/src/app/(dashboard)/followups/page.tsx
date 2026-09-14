"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { Followup, Attachment } from "@/types";
import AttachmentUploader from "@/components/AttachmentUploader";
import {
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Video,
  CheckSquare,
  User,
  Plus,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "TODAY" | "UPCOMING">("OVERDUE");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedFollowupForUpload, setSelectedFollowupForUpload] = useState<Followup | null>(null);

  // Fetch all follow-ups
  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await apiClient<Followup[]>("/leads/followups/all");
      if (res.success && res.data) {
        setFollowups(res.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  // Filter follow-ups into 3 distinct sections
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdueList = followups.filter((f) => {
    if (f.completed) return false;
    if (!f.dueAt) return false;
    return new Date(f.dueAt) < startOfToday;
  });

  const todayList = followups.filter((f) => {
    if (!f.dueAt) return false;
    const dueDate = new Date(f.dueAt);
    return dueDate >= startOfToday && dueDate <= endOfToday;
  });

  const upcomingList = followups.filter((f) => {
    if (f.completed) return true; // Include completed tasks in upcoming/history
    if (!f.dueAt) return true;
    return new Date(f.dueAt) > endOfToday;
  });

  // Toggle completed status
  const handleToggleComplete = async (f: Followup) => {
    if (!f.leadId) return;
    try {
      const nextCompleted = !f.completed;
      const res = await apiClient<Followup>(`/leads/${f.leadId}/followups/${f.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: nextCompleted }),
      });

      if (res.success && res.data) {
        setFollowups((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, completed: nextCompleted } : item))
        );
        setSuccessMsg(
          nextCompleted ? "Follow-up marked as completed!" : "Follow-up reopened"
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update follow-up");
    }
  };

  // Handle new attachment upload success
  const handleAttachmentSuccess = (newAttachment: Attachment) => {
    if (!selectedFollowupForUpload) return;
    setFollowups((prev) =>
      prev.map((f) => {
        if (f.id === selectedFollowupForUpload.id) {
          const currentAttachments = f.attachments || [];
          return {
            ...f,
            attachments: [newAttachment, ...currentAttachments],
          };
        }
        return f;
      })
    );
    setSelectedFollowupForUpload(null);
    setSuccessMsg("File attachment uploaded successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Handle attachment delete
  const handleAttachmentDelete = (deletedId: string) => {
    setFollowups((prev) =>
      prev.map((f) => ({
        ...f,
        attachments: (f.attachments || []).filter((a) => a.id !== deletedId),
      }))
    );
    if (selectedFollowupForUpload) {
      setSelectedFollowupForUpload((prev) =>
        prev
          ? {
              ...prev,
              attachments: (prev.attachments || []).filter((a) => a.id !== deletedId),
            }
          : null
      );
    }
    setSuccessMsg("Attachment deleted successfully");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const getFollowupIcon = (type: string) => {
    switch (type.toUpperCase()) {
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

  const activeList =
    activeTab === "OVERDUE"
      ? overdueList
      : activeTab === "TODAY"
      ? todayList
      : upcomingList;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-blue-600" />
            Follow-up Reminders & Tasks
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage scheduled lead activities, track overdue calls, and upload document attachments
          </p>
        </div>

        <button
          onClick={fetchFollowups}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 text-blue-600 ${loading ? "animate-spin" : ""}`} />
          Refresh Tasks
        </button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm text-red-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Controls (Overdue / Today / Upcoming) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab("OVERDUE")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "OVERDUE"
              ? "bg-red-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Overdue ({overdueList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TODAY")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "TODAY"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Due Today ({todayList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("UPCOMING")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "UPCOMING"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock className="h-4 w-4" />
          Upcoming ({upcomingList.length})
        </button>
      </div>

      {/* Follow-up Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading follow-ups...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No {activeTab.toLowerCase()} follow-ups!</h3>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === "OVERDUE"
              ? "Great job! All pending tasks are up to date."
              : "No follow-up reminders scheduled for this timeframe."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeList.map((f) => {
            const isOverdue =
              !f.completed && f.dueAt && new Date(f.dueAt) < startOfToday;
            const leadName = f.lead?.name || f.lead?.phoneNumber || "Unassigned Lead";

            return (
              <div
                key={f.id}
                className={`rounded-2xl bg-white border shadow-xs transition-all overflow-hidden p-5 sm:p-6 space-y-4 ${
                  isOverdue
                    ? "border-red-300 bg-red-50/20 shadow-red-500/5 ring-1 ring-red-200"
                    : f.completed
                    ? "border-slate-200 bg-slate-50/50 opacity-75"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(f)}
                      className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        f.completed
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 hover:border-blue-500 bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                          {getFollowupIcon(f.type)}
                        </span>
                        <h4
                          className={`text-sm font-bold text-slate-900 ${
                            f.completed ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {leadName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {f.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs border border-red-200 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        OVERDUE
                      </span>
                    )}

                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {f.dueAt ? new Date(f.dueAt).toLocaleString() : "No Date"}
                    </span>
                  </div>
                </div>

                {/* Followup Note Content */}
                {f.note && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                    {f.note}
                  </div>
                )}

                {/* Footer Meta + Attachments */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    {f.assignedTo && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <User className="h-3.5 w-3.5" />
                        Assigned: {f.assignedTo.name || f.assignedTo.email}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFollowupForUpload(f)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-[#0F4C75] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Attach File ({f.attachments?.length || 0})
                  </button>
                </div>

                {/* Attachments List */}
                {f.attachments && f.attachments.length > 0 && (
                  <div className="pt-2">
                    <AttachmentUploader
                      followupId={f.id}
                      attachments={f.attachments}
                      onUploadSuccess={handleAttachmentSuccess}
                      onDeleteAttachment={handleAttachmentDelete}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog for Uploading Attachment to Followup */}
      {selectedFollowupForUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Upload Attachment for Follow-up
              </h3>
              <button
                onClick={() => setSelectedFollowupForUpload(null)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AttachmentUploader
              followupId={selectedFollowupForUpload.id}
              attachments={selectedFollowupForUpload.attachments || []}
              onUploadSuccess={handleAttachmentSuccess}
              onDeleteAttachment={handleAttachmentDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
