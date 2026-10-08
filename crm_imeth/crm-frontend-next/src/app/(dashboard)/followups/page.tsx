"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
  RefreshCw,
  X,
  Trash2,
  LayoutList,
  CalendarDays,
  Filter,
  BellRing,
  ExternalLink,
  Share2,
  Pencil,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAgentList } from "@/hooks/use-agent-list";
import { RoleGuard } from "@/components/RoleGuard";
import FollowupCalendarView from "@/components/followups/FollowupCalendarView";
import FollowupDetailDrawer from "@/components/followups/FollowupDetailDrawer";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar-sync";

type ViewMode = "LIST" | "CALENDAR";

export default function FollowupsPage() {
  const { user } = useAuth();
  const canManageAssignment = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";
  const canDelete = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";

  const { agents } = useAgentList(canManageAssignment);

  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "TODAY" | "UPCOMING">("OVERDUE");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Drawer state
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Desktop notifications permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        toast.success("Desktop notifications enabled for scheduled reminders!");
      }
    }
  };

  // Fetch all follow-ups
  const fetchFollowups = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchFollowups();
    // Auto-refresh tasks every 30s so overdue tasks transition in real-time
    const interval = setInterval(fetchFollowups, 30000);
    return () => clearInterval(interval);
  }, [fetchFollowups]);

  // Filter follow-ups by selected agent
  const filteredFollowups = useMemo(() => {
    if (!selectedAgentId) return followups;
    return followups.filter((f) => f.assignedToId === selectedAgentId);
  }, [followups, selectedAgentId]);

  // Categorize into Overdue, Today, Upcoming based on current time
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdueList = useMemo(() => {
    return filteredFollowups.filter((f) => {
      if (f.completed) return false;
      if (!f.dueAt) return false;
      return new Date(f.dueAt) < now;
    });
  }, [filteredFollowups, now]);

  const todayList = useMemo(() => {
    return filteredFollowups.filter((f) => {
      if (f.completed) return false;
      if (!f.dueAt) return false;
      const dueDate = new Date(f.dueAt);
      return dueDate >= now && dueDate <= endOfToday;
    });
  }, [filteredFollowups, now, endOfToday]);

  const upcomingList = useMemo(() => {
    return filteredFollowups.filter((f) => {
      if (f.completed) return true;
      if (!f.dueAt) return true;
      return new Date(f.dueAt) > endOfToday;
    });
  }, [filteredFollowups, endOfToday]);

  // Toggle completed status with optimistic update and rollback
  const handleToggleComplete = async (f: Followup) => {
    if (!f.leadId) return;
    const previousState = f.completed;
    const nextCompleted = !f.completed;

    // Optimistic update
    setFollowups((prev) =>
      prev.map((item) => (item.id === f.id ? { ...item, completed: nextCompleted } : item))
    );
    if (selectedFollowup?.id === f.id) {
      setSelectedFollowup((prev) => (prev ? { ...prev, completed: nextCompleted } : null));
    }

    try {
      const res = await apiClient<Followup>(`/leads/${f.leadId}/followups/${f.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: nextCompleted }),
      });

      if (res.success && res.data) {
        const msg = nextCompleted ? "Follow-up marked as completed!" : "Follow-up reopened";
        toast.success(msg);
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        // Rollback
        setFollowups((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, completed: previousState } : item))
        );
        if (selectedFollowup?.id === f.id) {
          setSelectedFollowup((prev) => (prev ? { ...prev, completed: previousState } : null));
        }
        toast.error("Failed to update follow-up");
      }
    } catch (err: unknown) {
      setFollowups((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, completed: previousState } : item))
      );
      if (selectedFollowup?.id === f.id) {
        setSelectedFollowup((prev) => (prev ? { ...prev, completed: previousState } : null));
      }
      toast.error(err instanceof Error ? err.message : "Failed to update follow-up");
    }
  };

  // Update follow-up details (reschedule, type, notes, reassign)
  const handleUpdateFollowup = async (
    followupId: string,
    leadId: string,
    data: {
      type?: string;
      note?: string;
      dueAt?: string | null;
      assignedToId?: string | null;
      completed?: boolean;
    }
  ) => {
    try {
      const res = await apiClient<Followup>(`/leads/${leadId}/followups/${followupId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (res.success && res.data) {
        setFollowups((prev) =>
          prev.map((item) => (item.id === followupId ? { ...item, ...res.data } : item))
        );
        toast.success("Follow-up updated successfully");
      } else {
        toast.error(res.error || "Failed to update follow-up");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update follow-up");
    }
  };

  // Delete follow-up handler (Admins & Team Leads only)
  const handleDeleteFollowup = async (f: Followup) => {
    if (!f.leadId) return;

    setDeletingId(f.id);
    const previousFollowups = [...followups];

    // Optimistic removal
    setFollowups((prev) => prev.filter((item) => item.id !== f.id));

    try {
      const res = await apiClient<{ success: boolean; error?: string }>(
        `/leads/${f.leadId}/followups/${f.id}`,
        { method: "DELETE" }
      );

      if (res.success) {
        toast.success("Follow-up deleted successfully");
        if (selectedFollowup?.id === f.id) {
          setIsDrawerOpen(false);
          setSelectedFollowup(null);
        }
      } else {
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
    <RoleGuard allowedRoles={["ADMIN", "TEAM_LEAD", "AGENT"]} redirectTo="/hierarchy">
      <div className="space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Clock className="h-6 w-6 text-blue-600" />
              Follow-ups & Scheduling
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage scheduled activities, track overdue calls, and synchronize deadlines with external calendars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop Notification Request Banner */}
            {notifPermission === "default" && (
              <button
                type="button"
                onClick={requestDesktopPermission}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
                title="Enable browser alerts for upcoming follow-ups"
              >
                <BellRing className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enable Desktop Alerts</span>
              </button>
            )}

            {/* View Mode Toggle: List vs Calendar */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "LIST"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title="List View"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("CALENDAR")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "CALENDAR"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title="Calendar View"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Calendar View</span>
              </button>
            </div>

            <button
              onClick={() => fetchFollowups()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
              title="Refresh follow-ups"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
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

        {/* Filters & Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Controls (For List View) */}
          {viewMode === "LIST" ? (
            <div className="grid grid-cols-3 gap-1 p-1 w-full rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs max-w-xl">
              <button
                type="button"
                onClick={() => setActiveTab("OVERDUE")}
                className={`py-2 px-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === "OVERDUE"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Overdue ({overdueList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("TODAY")}
                className={`py-2 px-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === "TODAY"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Due Today ({todayList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("UPCOMING")}
                className={`py-2 px-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === "UPCOMING"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Upcoming ({upcomingList.length})</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Showing scheduled tasks on the interactive calendar. Click any event to reschedule or export.
            </div>
          )}

          {/* Workload Filter: Team Lead & Admin Dropdown / Agent Scoping Pill */}
          <div className="flex items-center gap-2">
            {canManageAssignment ? (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Assignee:</span>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">All Team Members ({followups.length})</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name || ag.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Assigned to Me
              </span>
            )}
          </div>
        </div>

        {/* ─── CALENDAR VIEW ────────────────────────────────────────── */}
        {viewMode === "CALENDAR" && (
          <FollowupCalendarView
            followups={filteredFollowups}
            onSelectFollowup={(f) => {
              setSelectedFollowup(f);
              setIsDrawerOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {/* ─── LIST VIEW ────────────────────────────────────────────── */}
        {viewMode === "LIST" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skel-fu-${i}`}
                    className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 shadow-xs space-y-3"
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
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-12 text-center shadow-xs">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                <h3 className="text-base font-bold text-slate-800">
                  No {activeTab.toLowerCase()} follow-ups!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === "OVERDUE"
                    ? "Great job! All pending tasks are up to date."
                    : "No follow-up reminders scheduled for this timeframe."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeList.map((f) => {
                  const isOverdue = !f.completed && f.dueAt && new Date(f.dueAt) < now;
                  const leadName = f.lead?.name || f.lead?.phoneNumber || "Unassigned Lead";

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFollowup(f);
                        setIsDrawerOpen(true);
                      }}
                      className={`rounded-2xl bg-white border shadow-xs transition-all p-3.5 sm:p-5 space-y-3 cursor-pointer group ${
                        isOverdue
                          ? "border-red-300 bg-red-50/15 ring-1 ring-red-200"
                          : f.completed
                          ? "border-slate-200 bg-slate-50/50 opacity-75"
                          : "border-slate-200/80 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(f);
                            }}
                            className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                              f.completed
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 hover:border-blue-500 bg-white text-transparent"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                                {getFollowupIcon(f.type)}
                              </span>
                              <h4
                                className={`text-sm font-bold text-slate-800 truncate ${
                                  f.completed ? "line-through text-slate-400" : ""
                                }`}
                              >
                                {leadName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border border-slate-200/60 shrink-0">
                                {f.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Quick Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full mt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {isOverdue && (
                            <span
                              title="Overdue"
                              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-full bg-red-100 text-red-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">OVERDUE</span>
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/60 whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {f.dueAt ? formatDateTime(f.dueAt) : "No Date"}
                          </span>
                        </div>

                        {/* 4 Action Buttons */}
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          {/* Quick Calendar Link */}
                          <a
                            href={generateGoogleCalendarUrl(f)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Add to Google Calendar"
                          >
                            <Calendar className="h-4 w-4" />
                          </a>

                          {/* Quick Download .ics */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadIcsFile(f);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Download .ics file"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFollowup(f);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit or Reschedule"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFollowup(f);
                              }}
                              disabled={deletingId === f.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Follow-up (Admin & Team Lead)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Note Content */}
                      {f.note && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                          {f.note}
                        </div>
                      )}

                      {/* Footer Meta */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        {f.assignedTo ? (
                          <span className="flex items-center gap-1 font-semibold text-blue-600">
                            <User className="h-3.5 w-3.5" />
                            Assigned: {f.assignedTo.name || f.assignedTo.email}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}

                        {f.leadId && (
                          <Link
                            href={`/leads/${f.leadId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 font-semibold transition-colors"
                          >
                            <span>Lead details</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── INTERACTIVE DETAIL & RESCHEDULE DRAWER ───────────── */}
        <FollowupDetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedFollowup(null);
          }}
          followup={selectedFollowup}
          canManageAssignment={canManageAssignment}
          canDelete={canDelete}
          agents={agents}
          currentUserId={user?.id}
          onUpdate={handleUpdateFollowup}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteFollowup}
        />
      </div>
    </RoleGuard>
  );
}
