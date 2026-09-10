"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import type { Lead, Message, Followup, Activity, Attachment } from "@/types";
import AttachmentUploader from "@/components/AttachmentUploader";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Tag,
  User as UserIcon,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Layers,
  Check,
  Megaphone,
  Pencil,
  Save,
  X,
  Mail,
  MessageCircle,
  FileText,
  Trash2,
  UserCheck,
  Smartphone,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "NEW", label: "New Lead", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { value: "CONVERTED", label: "Converted", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  { value: "LOST", label: "Lost", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();

  const isAgent = user?.role === "AGENT";
  const canManageAssignment = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";
  const canDeleteLead = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Agent list for assignment (Admin / Team Lead)
  const [agents, setAgents] = useState<{ id: string; name?: string; email: string; role: string }[]>([]);
  const [assigningLead, setAssigningLead] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Status dropdown state
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Follow-up form state
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupType, setFollowupType] = useState("CALL");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState("");
  const [followupAssignee, setFollowupAssignee] = useState("");
  const [addingFollowup, setAddingFollowup] = useState(false);

  // Edit details state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // Activity / Timeline state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    type: string;
    title: string;
    description: string;
    occurredAt: string;
    createdById?: string;
  }>({
    type: "NOTE",
    title: "",
    description: "",
    occurredAt: new Date().toISOString().slice(0, 16),
    createdById: "",
  });
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const getAuthorDisplayName = (createdBy?: { name?: string; email?: string; role?: string }) => {
    if (!createdBy) return "Sales Agent";
    if (createdBy.name && createdBy.name.trim()) return createdBy.name;
    if (createdBy.email) {
      const namePart = createdBy.email.split("@")[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return "Sales Agent";
  };

  // Load active agents list if admin or team lead
  useEffect(() => {
    if (canManageAssignment) {
      apiClient<{ id: string; name?: string; email: string; role: string }[]>("/users")
        .then((res) => {
          if (res.success && res.data) {
            setAgents(res.data);
          }
        })
        .catch((err) => console.warn("Could not load users list:", err));
    }
  }, [canManageAssignment]);

  // ─── Real-Time Socket.IO Synchronization ──────────────────────
  useEffect(() => {
    if (!socket || !params.id) return;

    // 1. When an activity is created (manual or system assignment)
    const handleActivityCreated = (data: { leadId: string; activity: Activity }) => {
      if (data.leadId === params.id && data.activity) {
        setLead((prev) => {
          if (!prev) return prev;
          // Already have the real activity — skip
          if (prev.activities?.some((a) => a.id === data.activity.id)) return prev;
          // Replace an optimistic placeholder of the same type (created by this client)
          // so we don't show two identical timeline entries.
          const hasOptimistic = prev.activities?.some(
            (a) => a.id.startsWith("optimistic_") && a.type === data.activity.type
          );
          const base = hasOptimistic
            ? (prev.activities || []).filter(
                (a) => !(a.id.startsWith("optimistic_") && a.type === data.activity.type)
              )
            : prev.activities || [];
          const updatedActivities = [...base, data.activity].sort(
            (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
          );
          return { ...prev, activities: updatedActivities };
        });
      }
    };


    // 2. When an activity is deleted
    const handleActivityDeleted = (data: { leadId: string; activityId: string }) => {
      if (data.leadId === params.id) {
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: (prev.activities || []).filter((a) => a.id !== data.activityId),
          };
        });
      }
    };

    // 3. When lead details or assignee change
    const handleLeadUpdated = (data: { leadId: string; lead: Partial<Lead> }) => {
      if (data.leadId === params.id && data.lead) {
        setLead((prev) => (prev ? { ...prev, ...data.lead } : null));
      }
    };

    // 4. When a user profile is updated in real time (name change), update matching activities and agents
    const handleUserUpdated = (updatedUser: { id: string; name?: string; email: string; role: string }) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === updatedUser.id ? { ...a, ...updatedUser } : a))
      );
      setLead((prev) => {
        if (!prev) return prev;
        const updatedActivities = (prev.activities || []).map((act) => {
          if (act.createdBy?.id === updatedUser.id || act.createdById === updatedUser.id) {
            return {
              ...act,
              createdBy: {
                ...act.createdBy,
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
              },
            };
          }
          return act;
        });

        const updatedAssignedTo =
          prev.assignedTo?.id === updatedUser.id
            ? { ...prev.assignedTo, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }
            : prev.assignedTo;

        return { ...prev, activities: updatedActivities, assignedTo: updatedAssignedTo };
      });
    };

    // 5. When a new WhatsApp message is received or sent
    const handleNewMessage = (data: { leadId: string; message: Message }) => {
      if (data.leadId === params.id && data.message) {
        setLead((prev) => {
          if (!prev) return prev;
          if (prev.messages?.some((m) => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        });
      }
    };

    socket.on("lead_activity_created", handleActivityCreated);
    socket.on("lead_activity_deleted", handleActivityDeleted);
    socket.on("lead_updated", handleLeadUpdated);
    socket.on("user_updated", handleUserUpdated);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("lead_activity_created", handleActivityCreated);
      socket.off("lead_activity_deleted", handleActivityDeleted);
      socket.off("lead_updated", handleLeadUpdated);
      socket.off("user_updated", handleUserUpdated);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, params.id]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ─── Fetch Lead Details ──────────────────────────────────────
  const fetchLead = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await apiClient<Lead>(`/leads/${params.id}`);
      if (res.success && res.data) {
        setLead(res.data);
      } else {
        setError("Lead details not found.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead?.messages]);

  // ─── Update Lead Status ──────────────────────────────────────
  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead || lead.status === newStatus) {
      setStatusMenuOpen(false);
      return;
    }

    setStatusUpdating(true);
    // Optimistic update
    setLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    setStatusMenuOpen(false);

    try {
      await apiClient(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on failure
      fetchLead();
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Send Outbound WhatsApp Message ──────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !messageText.trim() || sendingMessage) return;

    const textToSend = messageText.trim();
    setSendingMessage(true);

    try {
      const res = await apiClient<Message>(`/leads/${lead.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: textToSend }),
      });

      if (res.success && res.data) {
        const newMsg = res.data;
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
          };
        });
        setMessageText("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Add Followup Task ───────────────────────────────────────
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || addingFollowup) return;

    setAddingFollowup(true);
    try {
      const res = await apiClient<Followup>(`/leads/${lead.id}/followups`, {
        method: "POST",
        body: JSON.stringify({
          type: followupType,
          note: followupNote.trim(),
          dueAt: followupDueAt ? new Date(followupDueAt).toISOString() : null,
          assignedToId: canManageAssignment && followupAssignee ? followupAssignee : undefined,
        }),
      });

      if (res.success && res.data) {
        const newFollowup = res.data;

        // Build a local optimistic TASK_SCHEDULED activity so the timeline
        // reflects the scheduled task immediately — without waiting for the
        // socket event (which still arrives and is safely deduped by id).
        const assigneeUser = newFollowup.assignedTo;
        const assigneeName = assigneeUser?.name || assigneeUser?.email?.split("@")[0] || "";
        const dueText = followupDueAt
          ? ` (Due: ${new Date(followupDueAt).toLocaleString()})`
          : "";
        const assignText = assigneeName ? ` [Assigned: ${assigneeName}]` : "";

        const optimisticActivity: Activity = {
          id: `optimistic_task_${Date.now()}`,
          leadId: lead.id,
          createdById: user?.id,
          createdBy: user
            ? { id: user.id, name: user.name, email: user.email, role: user.role }
            : undefined,
          type: "TASK_SCHEDULED",
          title: `Follow-up Scheduled: ${followupType}`,
          description: `Scheduled ${followupType} task: "${followupNote.trim() || "No notes"}"${dueText}${assignText}`,
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        setLead((prev) => {
          if (!prev) return prev;
          const updatedActivities = [...(prev.activities || []), optimisticActivity].sort(
            (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
          );
          return {
            ...prev,
            followups: [...(prev.followups || []), newFollowup],
            activities: updatedActivities,
          };
        });
        setFollowupNote("");
        setFollowupDueAt("");
        setFollowupAssignee("");
        setShowFollowupForm(false);
      }
    } catch (err) {
      console.error("Failed to schedule follow-up:", err);
    } finally {
      setAddingFollowup(false);
    }
  };

  // ─── Toggle Followup Completed Status ────────────────────────
  const handleToggleFollowupComplete = async (followupId: string, currentCompleted: boolean) => {
    if (!lead) return;
    try {
      const res = await apiClient<Followup>(`/leads/${lead.id}/followups/${followupId}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (res.success && res.data) {
        const updatedFollowup = res.data;
        const isNowCompleted = !currentCompleted;

        setLead((prev) => {
          if (!prev) return prev;

          let updatedActivities = prev.activities || [];

          if (isNowCompleted) {
            // Task marked DONE → inject a TASK_COMPLETED activity immediately
            const completedActivity: Activity = {
              id: `optimistic_done_${Date.now()}`,
              leadId: lead.id,
              createdById: user?.id,
              createdBy: user
                ? { id: user.id, name: user.name, email: user.email, role: user.role }
                : undefined,
              type: "TASK_COMPLETED",
              title: `Follow-up Completed: ${updatedFollowup.type || "Task"}`,
              description: `Marked ${updatedFollowup.type || "task"} as done: "${updatedFollowup.note || "Completed task"}"`,
              occurredAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            updatedActivities = [...updatedActivities, completedActivity].sort(
              (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
            );
          } else {
            // Task un-done → remove the most recent TASK_COMPLETED activity
            // that matches this followup's note so the timeline stays in sync.
            const noteToMatch = updatedFollowup.note || "";
            let removed = false;
            updatedActivities = [...updatedActivities]
              .reverse()
              .filter((a) => {
                if (
                  !removed &&
                  a.type === "TASK_COMPLETED" &&
                  (a.description?.includes(noteToMatch) || noteToMatch === "")
                ) {
                  removed = true;
                  return false; // drop this one entry
                }
                return true;
              })
              .reverse();
          }

          return {
            ...prev,
            followups: (prev.followups || []).map((f) => (f.id === followupId ? updatedFollowup : f)),
            activities: updatedActivities,
          };
        });
      }
    } catch (err) {
      console.error("Failed to update follow-up status:", err);
    }
  };



  // ─── Assign Lead (Admin / Team Lead) ──────────────────────────
  const handleAssignLead = async (agentId: string) => {
    if (!lead || !canManageAssignment) return;
    setAssigningLead(true);
    try {
      const targetId = agentId === "" ? null : agentId;
      const res = await apiClient<Lead>(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ assignedToId: targetId }),
      });
      if (res.success) {
        const selectedAgent = agents.find((a) => a.id === agentId);
        setLead((prev) =>
          prev
            ? {
                ...prev,
                assignedToId: targetId || undefined,
                assignedTo: selectedAgent ? { id: selectedAgent.id, email: selectedAgent.email, role: selectedAgent.role } : undefined,
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to assign lead:", err);
    } finally {
      setAssigningLead(false);
    }
  };

  // ─── Delete Lead (Admin / Team Lead) ──────────────────────────
  const handleDeleteLead = async () => {
    if (!lead || !canDeleteLead || deletingLead) return;
    if (!window.confirm(`Are you sure you want to delete lead "${lead.name || lead.phoneNumber}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingLead(true);
    try {
      const res = await apiClient(`/leads/${lead.id}`, { method: "DELETE" });
      if (res.success) {
        router.push("/leads");
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
      alert("Failed to delete lead. Please try again.");
      setDeletingLead(false);
    }
  };

  // ─── Enter Edit Mode ─────────────────────────────────────────
  const enterEditMode = () => {
    if (!lead) return;
    setEditName(lead.name || "");
    setEditDisplayName(lead.displayName || "");
    setEditWhatsappNumber(lead.whatsappNumber || "");
    setEditEmail(lead.email || "");
    setEditNotes(lead.notes || "");
    setEditMode(true);
  };

  // ─── Save Lead Details ───────────────────────────────────────
  const handleSaveDetails = async () => {
    if (!lead) return;
    setSavingDetails(true);
    try {
      await apiClient(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          displayName: editDisplayName,
          whatsappNumber: editWhatsappNumber,
          email: editEmail,
          notes: editNotes,
        }),
      });
      // Optimistic update
      setLead((prev) =>
        prev
          ? {
              ...prev,
              name: editName,
              displayName: editDisplayName,
              whatsappNumber: editWhatsappNumber,
              email: editEmail,
              notes: editNotes,
            }
          : null
      );
      setEditMode(false);
    } catch (err) {
      console.error("Failed to save lead details:", err);
    } finally {
      setSavingDetails(false);
    }
  };

  // ─── Create Activity (Timeline Entry) ──────────────────────
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || isSubmittingActivity) return;
    setIsSubmittingActivity(true);
    try {
      const res = await apiClient<Activity>(`/leads/${lead.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: activityForm.type,
          title: activityForm.title.trim(),
          description: activityForm.description.trim(),
          occurredAt: new Date(activityForm.occurredAt).toISOString(),
          createdById: activityForm.createdById || undefined,
        }),
      });

      if (res.success && res.data) {
        const newActivity = res.data;
        setLead((prev) => {
          if (!prev) return prev;
          const updated = [...(prev.activities || []), newActivity].sort(
            (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
          );
          return { ...prev, activities: updated };
        });
        setIsActivityModalOpen(false);
        setActivityForm({
          type: "NOTE",
          title: "",
          description: "",
          occurredAt: new Date().toISOString().slice(0, 16),
          createdById: "",
        });
      }
    } catch (err) {
      console.error("Failed to create activity:", err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const openActivityModal = (type: string) => {
    setActivityForm((prev) => ({
      ...prev,
      type,
      occurredAt: new Date().toISOString().slice(0, 16),
      createdById: user?.id || "",
    }));
    setIsActivityModalOpen(true);
  };

  // ─── Delete Activity ──────────────────────────────────────
  const handleDeleteActivity = async (activityId: string) => {
    if (!lead) return;
    try {
      const res = await apiClient(`/leads/${lead.id}/activities/${activityId}`, {
        method: "DELETE",
      });
      if (res.success) {
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: (prev.activities || []).filter((a) => a.id !== activityId),
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete activity:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#128c7e]" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="font-bold text-red-800 text-base">Unable to Load Lead</h3>
        <p className="text-sm text-red-600 mt-2">{error || "Lead does not exist."}</p>
        <button
          onClick={() => router.push("/leads")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </button>
      </div>
    );
  }

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Breadcrumb ─────────────────────────── */}
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
            </div>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.phoneNumber}</span>
              <span className="text-slate-300">•</span>
              <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions & Status Badge Dropdown */}
        <div className="flex items-center gap-3">
          {/* Delete Lead Button (Admin / Team Lead only) */}
          {canDeleteLead && (
            <button
              onClick={handleDeleteLead}
              disabled={deletingLead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Delete Lead"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span className="hidden sm:inline">{deletingLead ? "Deleting..." : "Delete Lead"}</span>
            </button>
          )}

          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp Web</span>
          </a>

          {/* Interactive Status Selector */}
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={statusUpdating}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${currentStatusObj.bg} ${currentStatusObj.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${currentStatusObj.color}`} />
              <span>{currentStatusObj.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Change Lead Status
                </p>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdateStatus(opt.value)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                      <span>{opt.label}</span>
                    </div>
                    {lead.status === opt.value && (
                      <Check className="h-3.5 w-3.5 text-[#128c7e]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main 2-Column Grid Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column (2 Cols): WhatsApp Conversation & Tasks ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* WhatsApp Conversation Box */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-[540px]">
            {/* Chat Box Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8fafc] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#128c7e] text-white shadow-xs">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    WhatsApp Live Thread
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-time Meta Webhook Connected
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {lead.messages?.length || 0} messages
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#f0f2f5] bg-opacity-60">
              {(!lead.messages || lead.messages.length === 0) ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No message history yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Inbound messages from Meta ads or direct WhatsApp chats will appear here automatically.
                  </p>
                </div>
              ) : (
                lead.messages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isOutbound
                            ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none"
                            : "bg-white text-slate-900 border border-slate-200/50 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <div
                          className={`flex items-center gap-1.5 text-[9px] mt-1 text-slate-400 ${
                            isOutbound ? "justify-end text-emerald-700/60" : "justify-start"
                          }`}
                        >
                          {isOutbound && msg.source === "WHATSAPP_MOBILE" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600/15 text-emerald-800 font-semibold text-[8px] uppercase tracking-wide">
                              <Smartphone className="h-2.5 w-2.5" /> Mobile App
                            </span>
                          )}
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Outbound Message Composer */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2.5 border-t border-slate-200 bg-white p-3.5"
            >
              <input
                type="text"
                placeholder="Type a WhatsApp message to reply..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendingMessage}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#128c7e]/20 transition-all"
              />
              <button
                type="submit"
                disabled={sendingMessage || !messageText.trim()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#128c7e] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#075e54] disabled:opacity-50 transition-all cursor-pointer"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline mr-1">Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Follow-up Reminders & Tasks */}
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
                className="text-xs font-bold text-[#128c7e] hover:text-[#075e54] hover:underline cursor-pointer"
              >
                {showFollowupForm ? "Cancel" : "+ Schedule Task"}
              </button>
            </div>

            {/* Add Follow-up Form */}
            {showFollowupForm && (
              <form onSubmit={handleAddFollowup} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Task Type
                    </label>
                    <select
                      value={followupType}
                      onChange={(e) => setFollowupType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
                    >
                      <option value="">Assign to myself ({user?.email})</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.email} ({ag.role})
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#128c7e] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingFollowup}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#128c7e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#075e54] disabled:opacity-50 cursor-pointer"
                  >
                    {addingFollowup ? "Saving..." : "Save Reminder"}
                  </button>
                </div>
              </form>
            )}

            {/* Follow-up List */}
            {(!lead.followups || lead.followups.length === 0) ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No follow-ups scheduled. Click &quot;+ Schedule Task&quot; above to set reminders.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lead.followups.map((item) => (
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
                        onClick={() => handleToggleFollowupComplete(item.id, item.completed)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                          item.completed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 bg-white hover:border-[#128c7e]"
                        }`}
                        title={item.completed ? "Mark as pending" : "Mark as completed"}
                      >
                        {item.completed && <Check className="h-3 w-3" />}
                      </button>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        item.completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.type.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${item.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
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
                                Assigned: {item.assignedTo.email}
                              </span>
                            </>
                          )}
                          {item.createdBy && item.createdBy.id !== item.assignedTo?.id && (
                            <>
                              <span>•</span>
                              <span>By: {item.createdBy.email}</span>
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

          {/* ─── Timeline & Activity Section ─────────────────── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  Timeline & Activity
                </h3>
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {(lead.activities?.length || 0)} entries
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
              {/* Lead Creation Node (always first) */}
              <div className="relative">
                <div className="absolute -left-[23px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="ml-1">
                  <p className="text-xs font-bold text-slate-700">Lead Created</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Dynamic Activity Nodes */}
              {lead.activities?.map((activity) => {
                const typeConfig = {
                  PHONE_CALL: {
                    bg: "bg-blue-500",
                    circleBg: "bg-blue-100 text-blue-600",
                    icon: <Phone className="h-3.5 w-3.5" />,
                    smallIcon: <Phone className="h-3 w-3" />,
                    label: "Phone Call",
                    border: "border-blue-100",
                    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
                  },
                  MESSAGE: {
                    bg: "bg-emerald-500",
                    circleBg: "bg-emerald-100 text-emerald-600",
                    icon: <MessageCircle className="h-3.5 w-3.5" />,
                    smallIcon: <MessageCircle className="h-3 w-3" />,
                    label: "WhatsApp Message",
                    border: "border-emerald-100",
                    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  },
                  WHATSAPP_MOBILE_REPLY: {
                    bg: "bg-emerald-600",
                    circleBg: "bg-emerald-100 text-emerald-700",
                    icon: <Smartphone className="h-3.5 w-3.5" />,
                    smallIcon: <Smartphone className="h-3 w-3" />,
                    label: "WhatsApp Mobile Reply",
                    border: "border-emerald-200 bg-emerald-50/20",
                    tagBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
                  },
                  MEETING: {
                    bg: "bg-purple-500",
                    circleBg: "bg-purple-100 text-purple-600",
                    icon: <Calendar className="h-3.5 w-3.5" />,
                    smallIcon: <Calendar className="h-3 w-3" />,
                    label: "Meeting",
                    border: "border-purple-100",
                    tagBg: "bg-purple-50 text-purple-700 border-purple-200",
                  },
                  NOTE: {
                    bg: "bg-amber-500",
                    circleBg: "bg-amber-100 text-amber-600",
                    icon: <FileText className="h-3.5 w-3.5" />,
                    smallIcon: <FileText className="h-3 w-3" />,
                    label: "Note",
                    border: "border-amber-100",
                    tagBg: "bg-amber-50 text-amber-700 border-amber-200",
                  },
                  SYSTEM_ASSIGNMENT: {
                    bg: "bg-indigo-600",
                    circleBg: "bg-indigo-50 text-indigo-700 border border-indigo-200",
                    icon: <UserCheck className="h-3.5 w-3.5" />,
                    smallIcon: <UserCheck className="h-3 w-3" />,
                    label: "System Assignment",
                    border: "border-indigo-100/90 bg-indigo-50/20",
                    tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
                  },
                  TASK_SCHEDULED: {
                    bg: "bg-teal-600",
                    circleBg: "bg-teal-50 text-teal-700 border border-teal-200",
                    icon: <Clock className="h-3.5 w-3.5" />,
                    smallIcon: <Clock className="h-3 w-3" />,
                    label: "Task Scheduled",
                    border: "border-teal-100/90 bg-teal-50/20",
                    tagBg: "bg-teal-50 text-teal-700 border-teal-200",
                  },
                  TASK_COMPLETED: {
                    bg: "bg-emerald-600",
                    circleBg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                    smallIcon: <CheckCircle2 className="h-3 w-3" />,
                    label: "Task Completed",
                    border: "border-emerald-100/90 bg-emerald-50/20",
                    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  },
                }[activity.type] || {
                  bg: "bg-slate-400",
                  circleBg: "bg-slate-100 text-slate-600",
                  icon: <FileText className="h-3.5 w-3.5" />,
                  smallIcon: <FileText className="h-3 w-3" />,
                  label: activity.type,
                  border: "border-slate-100",
                  tagBg: "bg-slate-50 text-slate-700 border-slate-200",
                };

                const authorName = getAuthorDisplayName(activity.createdBy);

                return (
                  <div key={activity.id} className="relative group/activity">
                    {/* Activity Icon on Vertical Track */}
                    <div
                      className={`absolute -left-[27px] mt-1.5 flex h-7 w-7 items-center justify-center rounded-full ${typeConfig.circleBg} ring-4 ring-white shadow-xs transition-transform group-hover/activity:scale-110`}
                    >
                      {typeConfig.icon}
                    </div>

                    <div className="ml-3 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title & Type Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                              {activity.title || typeConfig.label}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeConfig.tagBg}`}
                            >
                              {typeConfig.smallIcon}
                              {typeConfig.label}
                            </span>
                          </div>

                          {/* Activity Description */}
                          {activity.description && (
                            <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                              {activity.description}
                            </p>
                          )}

                          {/* Footer with Creator in WhatsApp Green Box & Timestamp */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                            {/* WhatsApp Green Box with 0.5 Opacity and Black Text */}
                            {activity.createdBy && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#25d366]/50 bg-[#25d366]/50 px-2.5 py-1 text-xs font-bold text-black shadow-xs">
                                  <UserIcon className="h-3.5 w-3.5 text-black stroke-[2.5]" />
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
                              {new Date(activity.occurredAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Delete Activity Button — hidden for system-generated entries */}
                        {!["TASK_SCHEDULED", "TASK_COMPLETED", "SYSTEM_ASSIGNMENT"].includes(activity.type) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete activity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!lead.activities || lead.activities.length === 0) && (
                <div className="ml-1 py-3">
                  <p className="text-[11px] text-slate-400">No activities logged yet. Use the buttons above to add one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Column (1 Col): Attribution & Lead Info ─────────── */}
        <div className="space-y-6">
          {/* Meta Campaign Attribution Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Meta Ad Attribution
              </h3>
            </div>

            {lead.attribution ? (
              <div className="space-y-3.5 text-xs">
                {lead.attribution.headline && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                      Ad Headline
                    </span>
                    <p className="font-semibold text-slate-800 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      {lead.attribution.headline}
                    </p>
                  </div>
                )}

                {lead.attribution.body && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                      Ad Copy / Body
                    </span>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                      {lead.attribution.body}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                      Ad ID
                    </span>
                    <p className="font-mono text-[11px] text-slate-700 truncate">
                      {lead.attribution.adId || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                      Source
                    </span>
                    <p className="capitalize text-slate-700">
                      {lead.attribution.sourceType || "Click-to-WhatsApp"}
                    </p>
                  </div>
                </div>

                {lead.attribution.sourceUrl && (
                  <a
                    href={lead.attribution.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#128c7e] hover:underline font-semibold mt-1"
                  >
                    <span>View Landing Page / Ad</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Organic WhatsApp Lead</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  This lead reached out directly without clicking a sponsored Meta Ad campaign.
                </p>
              </div>
            )}
          </div>

          {/* Lead Details & Metadata Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-500" /> Lead Overview
              </h3>
              {!editMode ? (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#128c7e] hover:text-[#075e54] hover:underline cursor-pointer transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    disabled={savingDetails}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#128c7e] hover:bg-[#075e54] px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {savingDetails ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              /* ─── Edit Mode ─── */
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Katherine Lim"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="e.g. Katherine"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Display name is what your clients will see</p>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={editWhatsappNumber}
                    onChange={(e) => setEditWhatsappNumber(e.target.value)}
                    placeholder="e.g. +94 1234 5678"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. katherine@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about your client here..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            ) : (
              /* ─── Read Mode ─── */
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Client Name
                  </span>
                  <p className="font-semibold text-slate-800">{lead.name || "—"}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Display Name
                  </span>
                  <p className="font-semibold text-slate-800">{lead.displayName || "—"}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Mobile Number
                  </span>
                  <p className="font-mono text-slate-800">{lead.phoneNumber}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    WhatsApp Number
                  </span>
                  <p className="font-mono text-slate-800">{lead.whatsappNumber || "—"}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Email Address
                  </span>
                  <p className="text-slate-800">{lead.email || "—"}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Assigned Agent
                  </span>
                  {canManageAssignment ? (
                    <div className="mt-1">
                      <select
                        value={lead.assignedToId || ""}
                        onChange={(e) => handleAssignLead(e.target.value)}
                        disabled={assigningLead}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#128c7e] focus:outline-none cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name ? `${ag.name} (${ag.role === "ADMIN" ? "Admin" : ag.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})` : `${ag.email} (${ag.role})`}
                          </option>
                        ))}
                      </select>
                      {assigningLead && (
                        <p className="text-[10px] text-[#128c7e] mt-0.5">Saving assignment...</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-800">
                      {lead.assignedTo?.name
                        ? `${lead.assignedTo.name} (${lead.assignedTo.role === "ADMIN" ? "Admin" : lead.assignedTo.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})`
                        : lead.assignedTo?.email || "Unassigned"}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Tags
                  </span>
                  {(!lead.tags || lead.tags.length === 0) ? (
                    <p className="text-slate-400">No tags assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {lead.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                    Notes
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {lead.notes || "No notes added."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Created</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Last Active</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Lead Documents & Attachments Card ────────────── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <AttachmentUploader
              leadId={lead.id}
              attachments={lead.attachments || []}
              title="Lead Documents & Attachments"
              onUploadSuccess={(newAttachment) => {
                setLead((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    attachments: [newAttachment, ...(prev.attachments || [])],
                  };
                });
              }}
              onDeleteAttachment={(deletedId) => {
                setLead((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    attachments: (prev.attachments || []).filter((a) => a.id !== deletedId),
                  };
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Activity Modal Overlay ──────────────────────── */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#128c7e]" />
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
            <form onSubmit={handleCreateActivity} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Activity Type
                </label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/10 focus:outline-none transition-all"
                >
                  <option value="PHONE_CALL">📞 Phone Call</option>
                  <option value="MESSAGE">💬 WhatsApp Message</option>
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
                    value={activityForm.createdById || user?.id || ""}
                    onChange={(e) => setActivityForm({ ...activityForm, createdById: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/10 focus:outline-none transition-all"
                  >
                    <option value={user?.id || ""}>
                      Me ({user?.name || user?.email.split("@")[0]})
                    </option>
                    {agents
                      .filter((a) => a.id !== user?.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.email.split("@")[0].charAt(0).toUpperCase() + a.email.split("@")[0].slice(1)} ({a.role === "ADMIN" ? "Admin" : a.role === "TEAM_LEAD" ? "Team Lead" : "Sales Agent"})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={activityForm.occurredAt}
                  onChange={(e) => setActivityForm({ ...activityForm, occurredAt: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/10 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery call with Katherine"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/10 focus:outline-none transition-all"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/10 focus:outline-none transition-all resize-none"
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
                  className="flex-1 rounded-xl bg-[#128c7e] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#075e54] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
    </div>
  );
}
