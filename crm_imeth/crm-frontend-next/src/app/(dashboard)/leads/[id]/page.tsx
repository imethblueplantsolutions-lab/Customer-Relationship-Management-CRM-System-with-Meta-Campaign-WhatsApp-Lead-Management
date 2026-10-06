"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useLeadSocket } from "@/hooks/use-lead-socket";
import { useAgentList } from "@/hooks/use-agent-list";
import type { Lead, Message, Followup, Activity } from "@/types";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Plus,
  X,
  Calendar,
  Clock,
  FileText,
  User as UserIcon,
  PhoneCall,
} from "lucide-react";

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
  const isAddingFollowupRef = useRef(false);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // ─── Mobile Ergonomics State ────────────────────────────────
  type MobileTab = "OVERVIEW" | "ACTIVITIES" | "FOLLOWUPS";
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("OVERVIEW");
  const [isQuickActionDrawerOpen, setIsQuickActionDrawerOpen] = useState(false);
  const [openFollowupTrigger, setOpenFollowupTrigger] = useState<number | undefined>(undefined);
  const [openActivityTrigger, setOpenActivityTrigger] = useState<{ type: string; timestamp: number } | null>(null);

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
        const errorMsg = typeof res.error === "string" ? res.error : (typeof res.error === "object" && res.error !== null && "message" in res.error ? String((res.error as { message: unknown }).message) : "Failed to delete lead. Please try again.");
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
    if (!lead || addingFollowup || isAddingFollowupRef.current) return;
    isAddingFollowupRef.current = true;
    setAddingFollowup(true);
    try {
      const res = await apiClient<Followup & { activity?: Activity }>(`/leads/${lead.id}/followups`, {
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
        const newActivity = (res as unknown as Record<string, unknown>).activity as Activity | undefined;

        setLead((prev) => {
          if (!prev) return prev;
          const existingFollowups = prev.followups || [];
          const updatedFollowups = existingFollowups.some((f) => f.id === newFollowup.id)
            ? existingFollowups.map((f) => (f.id === newFollowup.id ? newFollowup : f))
            : [...existingFollowups, newFollowup];

          let updatedActivities = prev.activities || [];
          if (newActivity && !updatedActivities.some((a) => a.id === newActivity.id)) {
            updatedActivities = [...updatedActivities, newActivity].sort(
              (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
            );
          }

          return {
            ...prev,
            followups: updatedFollowups,
            activities: updatedActivities,
          };
        });
      }
    } catch (err) {
      console.error("Failed to schedule follow-up:", err);
    } finally {
      isAddingFollowupRef.current = false;
      setAddingFollowup(false);
    }
  };

  // ─── Toggle Followup Complete Handler ─────────────────────────
  const handleToggleFollowupComplete = async (followupId: string, currentCompleted: boolean) => {
    if (!lead) return;
    try {
      const res = await apiClient<Followup & { activity?: Activity }>(`/leads/${lead.id}/followups/${followupId}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (res.success && res.data) {
        const updatedFollowup = res.data;
        const newActivity = (res as unknown as Record<string, unknown>).activity as Activity | undefined;
        const isNowCompleted = !currentCompleted;

        setLead((prev) => {
          if (!prev) return prev;
          let updatedActivities = prev.activities || [];

          if (isNowCompleted) {
            if (newActivity && !updatedActivities.some((a) => a.id === newActivity.id)) {
              updatedActivities = [...updatedActivities, newActivity].sort(
                (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
              );
            }
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
    companyName?: string;
    designation?: string;
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

  const pendingFollowupsCount = (lead?.followups || []).filter((f) => !f.completed).length;
  const activitiesCount = (lead?.activities || []).length;

  const rawPhone = lead?.whatsappNumber || lead?.phoneNumber || "";
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
  const waPhone = cleanPhone.replace(/^\+/, "");
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);
  const hasEmail = Boolean(lead?.email && lead.email.trim());

  return (
    <div className="space-y-6 pb-28 sm:pb-12">
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

      {/* ─── Mobile Sticky Segmented Tabs (< lg) ────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-[#f8fafc]/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="grid grid-cols-3 p-1 bg-slate-200/70 rounded-xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMobileTab("OVERVIEW")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === "OVERVIEW"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("ACTIVITIES")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === "ACTIVITIES"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Activities</span>
            {activitiesCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeMobileTab === "ACTIVITIES"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                {activitiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("FOLLOWUPS")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === "FOLLOWUPS"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Tasks</span>
            {pendingFollowupsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingFollowupsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Responsive Layout (Desktop 2-Col, Mobile Tabbed) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on Desktop: Chat, Follow-ups, Activities) */}
        <div
          className={`lg:col-span-2 space-y-6 ${
            activeMobileTab === "OVERVIEW" ? "hidden lg:block" : "block"
          }`}
        >
          {!HIDE_WHATSAPP_MESSAGING && (
            <LeadWhatsAppChat
              messages={lead.messages || []}
              phoneNumber={lead.phoneNumber}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            />
          )}

          <div className={activeMobileTab === "FOLLOWUPS" ? "block" : "hidden lg:block"}>
            <LeadFollowupsCard
              followups={lead.followups || []}
              canManageAssignment={canManageAssignment}
              agents={agents}
              userEmail={user?.email}
              onAddFollowup={handleAddFollowup}
              onToggleComplete={handleToggleFollowupComplete}
              onDeleteFollowup={handleDeleteFollowup}
              addingFollowup={addingFollowup}
              openFormTrigger={openFollowupTrigger}
            />
          </div>

          <div className={activeMobileTab === "ACTIVITIES" ? "block" : "hidden lg:block"}>
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
              openActivityTrigger={openActivityTrigger}
            />
          </div>
        </div>

        {/* Right Column (1 Col on Desktop: Lead Details, Attribution, Tags) */}
        <div className={activeMobileTab === "OVERVIEW" ? "block" : "hidden lg:block"}>
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

      {/* ─── Fixed Bottom Floating Action Bar (< lg screens only) ─── */}
      <div className="lg:hidden fixed bottom-4 inset-x-3 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around">
        {/* Call */}
        {hasPhone ? (
          <a
            href={`tel:${cleanPhone}`}
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-700 hover:text-blue-600 active:scale-95 transition-all"
            title="Call Lead"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-0.5 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700">Call</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-300 cursor-not-allowed opacity-40 select-none"
            title="No phone number"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Call</span>
          </button>
        )}

        {/* WhatsApp */}
        {hasPhone ? (
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-700 hover:text-emerald-600 active:scale-95 transition-all"
            title="Message on WhatsApp"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-0.5 shadow-xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700">WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-300 cursor-not-allowed opacity-40 select-none"
            title="No WhatsApp number"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-0.5">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">WhatsApp</span>
          </button>
        )}

        {/* Email */}
        {hasEmail ? (
          <a
            href={`mailto:${lead.email}`}
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-700 hover:text-indigo-600 active:scale-95 transition-all"
            title="Send Email"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-0.5 shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700">Email</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-300 cursor-not-allowed opacity-40 select-none"
            title="No email address"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Email</span>
          </button>
        )}

        {/* Quick Action (+) Button */}
        <button
          type="button"
          onClick={() => setIsQuickActionDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-700 active:scale-95 transition-all cursor-pointer"
          title="Quick Action"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-0.5 shadow-md shadow-blue-500/20">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-blue-700">Action</span>
        </button>
      </div>

      {/* ─── Slide-Up Mobile Action Drawer ───────────────────────── */}
      {isQuickActionDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsQuickActionDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer handle & title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">Quick Lead Actions</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickActionDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Option 1: Log Phone Call */}
              <button
                type="button"
                onClick={() => {
                  setActiveMobileTab("ACTIVITIES");
                  setOpenActivityTrigger({ type: "PHONE_CALL", timestamp: Date.now() });
                  setIsQuickActionDrawerOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-left hover:bg-blue-100/70 active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">Log Call</p>
                  <p className="text-[10px] text-blue-700/80">Record outcome</p>
                </div>
              </button>

              {/* Option 2: Add Note */}
              <button
                type="button"
                onClick={() => {
                  setActiveMobileTab("ACTIVITIES");
                  setOpenActivityTrigger({ type: "NOTE", timestamp: Date.now() });
                  setIsQuickActionDrawerOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-left hover:bg-amber-100/70 active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Add Note</p>
                  <p className="text-[10px] text-amber-700/80">Client note / memo</p>
                </div>
              </button>

              {/* Option 3: Schedule Task */}
              <button
                type="button"
                onClick={() => {
                  setActiveMobileTab("FOLLOWUPS");
                  setOpenFollowupTrigger(Date.now());
                  setIsQuickActionDrawerOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-left hover:bg-emerald-100/70 active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Schedule Task</p>
                  <p className="text-[10px] text-emerald-700/80">Follow-up reminder</p>
                </div>
              </button>

              {/* Option 4: Log Meeting */}
              <button
                type="button"
                onClick={() => {
                  setActiveMobileTab("ACTIVITIES");
                  setOpenActivityTrigger({ type: "MEETING", timestamp: Date.now() });
                  setIsQuickActionDrawerOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-left hover:bg-purple-100/70 active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-900">Log Meeting</p>
                  <p className="text-[10px] text-purple-700/80">Client demo / sync</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
