"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useLeadSocket } from "@/hooks/use-lead-socket";
import { useAgentList } from "@/hooks/use-agent-list";
import type { Lead, Message, Followup, Activity } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";

// Subcomponents
import LeadHeader from "@/components/leads/LeadHeader";
import LeadWhatsAppChat from "@/components/leads/LeadWhatsAppChat";
import LeadFollowupsCard from "@/components/leads/LeadFollowupsCard";
import LeadActivityTimeline from "@/components/leads/LeadActivityTimeline";
import LeadInfoCard from "@/components/leads/LeadInfoCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { LeadDetailSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

// Phase 1 toggle: Set to false when WhatsApp messaging feature is enabled
const HIDE_WHATSAPP_MESSAGING = true;

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const canManageAssignment = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";
  const canDeleteLead = user?.role === "ADMIN" || user?.role === "TEAM_LEAD";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Agent list for assignment (cached with 5-minute stale time)
  const { agents, setAgents } = useAgentList(canManageAssignment);
  const [assigningLead, setAssigningLead] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [addingFollowup, setAddingFollowup] = useState(false);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

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

  // ─── Real-Time Socket.IO Synchronization (Extracted to custom hook) ──
  useLeadSocket({ leadId: params.id, setLead, setAgents });

  // ─── Status Update Handler ────────────────────────────────────
  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead || lead.status === newStatus) return;

    setStatusUpdating(true);
    setLead((prev) => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null));

    try {
      await apiClient(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchLead();
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Delete Lead Handler ──────────────────────────────────────
  const handleDeleteLead = async () => {
    if (!lead || !canDeleteLead || deletingLead) return;
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (!lead || !canDeleteLead || deletingLead) return;
    setDeletingLead(true);
    try {
      const res = await apiClient(`/leads/${lead.id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Lead deleted successfully");
        router.push("/leads");
      } else {
        const errorMsg = typeof res.error === "string" ? res.error : (res.error as any)?.message || "Failed to delete lead. Please try again.";
        toast.error(errorMsg);
        setDeletingLead(false);
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
      toast.error("Failed to delete lead. Please try again.");
      setDeletingLead(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // ─── WhatsApp Send Message Handler ───────────────────────────
  const handleSendMessage = async (text: string) => {
    if (!lead || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await apiClient<Message>(`/leads/${lead.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
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
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Add Followup Task Handler ───────────────────────────────
  const handleAddFollowup = async (form: {
    type: string;
    note: string;
    dueAt: string;
    assignedToId?: string;
  }) => {
    if (!lead || addingFollowup) return;
    setAddingFollowup(true);
    try {
      const res = await apiClient<Followup>(`/leads/${lead.id}/followups`, {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          note: form.note,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          assignedToId: form.assignedToId,
        }),
      });

      if (res.success && res.data) {
        const newFollowup = res.data;
        const assigneeUser = newFollowup.assignedTo;
        const assigneeName = assigneeUser?.name || assigneeUser?.email?.split("@")[0] || "";
        const dueText = form.dueAt ? ` (Due: ${new Date(form.dueAt).toLocaleString()})` : "";
        const assignText = assigneeName ? ` [Assigned: ${assigneeName}]` : "";

        const optimisticActivity: Activity = {
          id: `optimistic_task_${Date.now()}`,
          leadId: lead.id,
          createdById: user?.id,
          createdBy: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : undefined,
          type: "TASK_SCHEDULED",
          title: `Follow-up Scheduled: ${form.type}`,
          description: `Scheduled ${form.type} task: "${form.note || "No notes"}"${dueText}${assignText}`,
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
      }
    } catch (err) {
      console.error("Failed to schedule follow-up:", err);
    } finally {
      setAddingFollowup(false);
    }
  };

  // ─── Toggle Followup Complete Handler ─────────────────────────
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
            const completedActivity: Activity = {
              id: `optimistic_done_${Date.now()}`,
              leadId: lead.id,
              createdById: user?.id,
              createdBy: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : undefined,
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
            const noteToMatch = updatedFollowup.note || "";
            let removed = false;
            updatedActivities = [...updatedActivities]
              .reverse()
              .filter((a) => {
                if (!removed && a.type === "TASK_COMPLETED" && (a.description?.includes(noteToMatch) || noteToMatch === "")) {
                  removed = true;
                  return false;
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

  // ─── Delete Followup Handler (Admins & Team Leads) ─────────────
  const handleDeleteFollowup = async (followupId: string) => {
    if (!lead) return;
    const targetFollowup = (lead.followups || []).find((f) => f.id === followupId);
    const followupNote = targetFollowup?.note || "";

    if (
      !window.confirm(
        "Are you sure you want to delete this follow-up? This will also remove it from timelines and notifications."
      )
    ) {
      return;
    }

    try {
      const res = await apiClient<{ success: boolean; message?: string }>(
        `/leads/${lead.id}/followups/${followupId}`,
        { method: "DELETE" }
      );

      if (res.success) {
        setLead((prev) => {
          if (!prev) return prev;
          const nextFollowups = (prev.followups || []).filter((f) => f.id !== followupId);
          const nextActivities = (prev.activities || []).filter((a) => {
            if (a.type === "TASK_SCHEDULED" || a.type === "TASK_COMPLETED") {
              if (followupNote && a.description?.includes(followupNote)) {
                return false;
              }
              if (targetFollowup?.type && a.title?.includes(targetFollowup.type)) {
                return false;
              }
            }
            return true;
          });

          return {
            ...prev,
            followups: nextFollowups,
            activities: nextActivities,
          };
        });
        toast.success("Follow-up and timeline records deleted");
      } else {
        toast.error(res.error || "Failed to delete follow-up");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete follow-up");
    }
  };

  // ─── Activity Handlers ────────────────────────────────────────
  const handleCreateActivity = async (form: {
    type: string;
    title: string;
    description: string;
    occurredAt: string;
    createdById?: string;
  }) => {
    if (!lead) return;
    setIsSubmittingActivity(true);
    try {
      const res = await apiClient<Activity>(`/leads/${lead.id}/activities`, {
        method: "POST",
        body: JSON.stringify(form),
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
      }
    } catch (err) {
      console.error("Failed to create activity:", err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleUpdateActivity = async (
    activityId: string,
    data: { type?: string; title?: string; description?: string; occurredAt?: string }
  ) => {
    if (!lead) return;
    try {
      const res = await apiClient<Activity>(`/leads/${lead.id}/activities/${activityId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        const updated = res.data;
        setLead((prev) => {
          if (!prev) return prev;
          const updatedActivities = (prev.activities || [])
            .map((a) => (a.id === activityId ? updated : a))
            .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
          return { ...prev, activities: updatedActivities };
        });
      }
    } catch (err) {
      console.error("Failed to update activity:", err);
    }
  };

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

  // ─── Lead Assignment & Details Handlers ───────────────────────
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

  const handleSaveDetails = async (details: {
    name: string;
    displayName: string;
    whatsappNumber: string;
    email: string;
    notes: string;
  }) => {
    if (!lead) return;
    await apiClient(`/leads/${lead.id}`, {
      method: "PUT",
      body: JSON.stringify(details),
    });
    setLead((prev) => (prev ? { ...prev, ...details } : null));
  };

  if (loading) {
    return <LeadDetailSkeleton />;
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

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Stage Stepper ────────────────────────── */}
      <LeadHeader
        lead={lead}
        canDeleteLead={canDeleteLead}
        deletingLead={deletingLead}
        statusUpdating={statusUpdating}
        onUpdateStatus={handleUpdateStatus}
        onDeleteLead={handleDeleteLead}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${lead.name || lead.phoneNumber}"? This action cannot be undone.`}
        confirmLabel="Delete Lead"
        variant="danger"
        isLoading={deletingLead}
        onConfirm={confirmDeleteLead}
        onClose={() => setIsDeleteDialogOpen(false)}
      />

      {/* ─── Main 2-Column Responsive Layout ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Chat, Follow-ups, Activities */}
        <div className="lg:col-span-2 space-y-6">
          {!HIDE_WHATSAPP_MESSAGING && (
            <LeadWhatsAppChat
              messages={lead.messages || []}
              phoneNumber={lead.phoneNumber}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            />
          )}

          <LeadFollowupsCard
            followups={lead.followups || []}
            canManageAssignment={canManageAssignment}
            agents={agents}
            userEmail={user?.email}
            onAddFollowup={handleAddFollowup}
            onToggleComplete={handleToggleFollowupComplete}
            onDeleteFollowup={handleDeleteFollowup}
            addingFollowup={addingFollowup}
          />

          <LeadActivityTimeline
            activities={lead.activities || []}
            leadCreatedAt={lead.createdAt}
            canManageAssignment={canManageAssignment}
            agents={agents}
            currentUserId={user?.id}
            currentUserName={user?.name}
            currentUserEmail={user?.email}
            onCreateActivity={handleCreateActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            isSubmittingActivity={isSubmittingActivity}
          />
        </div>

        {/* Right Column (1 Col): Attribution, Lead Details */}
        <div>
          <LeadInfoCard
            lead={lead}
            canManageAssignment={canManageAssignment}
            agents={agents}
            assigningLead={assigningLead}
            onAssignLead={handleAssignLead}
            onSaveDetails={handleSaveDetails}
          />
        </div>
      </div>
    </div>
  );
}
