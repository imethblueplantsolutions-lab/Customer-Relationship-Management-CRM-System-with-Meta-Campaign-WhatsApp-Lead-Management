"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { Followup } from "@/types";
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
  Trash2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function FollowupsPage() {
  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "TODAY" | "UPCOMING">("OVERDUE");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch all follow-ups to populate tabs and counts accurately
  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await apiClient<Followup[]>(`/leads/followups/all`);
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
    // Auto-refresh tasks every 30s so overdue tasks transition in real-time
    const interval = setInterval(() => {
      fetchFollowups();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter follow-ups into 3 distinct sections based on current time
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Overdue: Uncompleted tasks whose deadline has passed (dueAt < now)
  const overdueList = followups.filter((f) => {
    if (f.completed) return false;
    if (!f.dueAt) return false;
    return new Date(f.dueAt) < now;
  });

  // Due Today: Uncompleted tasks remaining for today (now <= dueAt <= endOfToday)
  const todayList = followups.filter((f) => {
    if (f.completed) return false;
    if (!f.dueAt) return false;
    const dueDate = new Date(f.dueAt);
    return dueDate >= now && dueDate <= endOfToday;
  });

  // Upcoming: Future tasks beyond today, or completed tasks history
  const upcomingList = followups.filter((f) => {
    if (f.completed) return true; // Include completed tasks in history
    if (!f.dueAt) return true;
    return new Date(f.dueAt) > endOfToday;
  });

  // Toggle completed status with optimistic update and rollback
  const handleToggleComplete = async (f: Followup) => {
    if (!f.leadId) return;
    const previousState = f.completed;
    const nextCompleted = !f.completed;

    // Optimistic update
    setFollowups((prev) =>
      prev.map((item) => (item.id === f.id ? { ...item, completed: nextCompleted } : item))
    );

    try {
      const res = await apiClient<Followup>(`/leads/${f.leadId}/followups/${f.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: nextCompleted }),
      });

      if (res.success && res.data) {
        toast.success(nextCompleted ? "Follow-up marked as completed!" : "Follow-up reopened");
      } else {
        // Rollback on non-success
        setFollowups((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, completed: previousState } : item))
        );
        toast.error("Failed to update follow-up");
      }
    } catch (err: unknown) {
      // Rollback on network/server error
      setFollowups((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, completed: previousState } : item))
      );
      toast.error(err instanceof Error ? err.message : "Failed to update follow-up");
    }
  };

  // Delete follow-up handler (Admins & Team Leads only)
  const handleDeleteFollowup = async (f: Followup) => {
    if (!f.leadId) return;
    const leadName = f.lead?.name || f.lead?.phoneNumber || "Lead";
    if (
      !window.confirm(
        `Are you sure you want to delete this follow-up for "${leadName}"? This will also remove it from timelines and notifications.`
      )
    ) {
      return;
    }

    setDeletingId(f.id);
    const previousFollowups = [...followups];

    // Optimistic removal
    setFollowups((prev) => prev.filter((item) => item.id !== f.id));

    try {
      const res = await apiClient<{ success: boolean; message?: string }>(
        `/leads/${f.leadId}/followups/${f.id}`,
        { method: "DELETE" }
      );

      if (res.success) {
        toast.success("Follow-up and timeline records deleted successfully");
      } else {
        // Rollback
        setFollowups(previousFollowups);
        toast.error(res.error || "Failed to delete follow-up");
      }
    } catch (err: unknown) {
      setFollowups(previousFollowups);
      toast.error(err instanceof Error ? err.message : "Failed to delete follow-up");
    } finally {
      setDeletingId(null);
    }
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
          onClick={() => fetchFollowups()}
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skel-fu-${i}`}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
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
              !f.completed && f.dueAt && new Date(f.dueAt) < now;
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

                  {/* Due Date, Status Badge & Delete Button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs border border-red-200 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        OVERDUE
                      </span>
                    )}

                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {f.dueAt ? formatDateTime(f.dueAt) : "No Date"}
                    </span>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFollowup(f)}
                        disabled={deletingId === f.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete Follow-up (Admin & Team Lead)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Followup Note Content */}
                {f.note && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                    {f.note}
                  </div>
                )}

                {/* Footer Meta */}
                {f.assignedTo && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <User className="h-3.5 w-3.5" />
                      Assigned: {f.assignedTo.name || f.assignedTo.email}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
