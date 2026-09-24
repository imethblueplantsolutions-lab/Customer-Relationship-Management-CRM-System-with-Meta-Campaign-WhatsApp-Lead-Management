"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import type { Lead, Activity, Message } from "@/types";

interface UseLeadSocketProps {
  leadId: string | undefined;
  setLead: React.Dispatch<React.SetStateAction<Lead | null>>;
  setAgents: React.Dispatch<React.SetStateAction<{ id: string; name?: string; email: string; role: string }[]>>;
}

export function useLeadSocket({ leadId, setLead, setAgents }: UseLeadSocketProps) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !leadId) return;

    const handleActivityCreated = (data: { leadId: string; activity: Activity }) => {
      if (data.leadId === leadId && data.activity) {
        setLead((prev) => {
          if (!prev) return prev;
          if (prev.activities?.some((a) => a.id === data.activity.id)) return prev;
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

    const handleActivityDeleted = (data: { leadId: string; activityId: string }) => {
      if (data.leadId === leadId) {
        setLead((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: (prev.activities || []).filter((a) => a.id !== data.activityId),
          };
        });
      }
    };

    const handleLeadUpdated = (data: { leadId: string; lead: Partial<Lead> }) => {
      if (data.leadId === leadId && data.lead) {
        setLead((prev) => (prev ? { ...prev, ...data.lead } : null));
      }
    };

    const handleUserUpdated = (updatedUser: { id: string; name?: string; email: string; role: string; avatar?: string }) => {
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
                avatar: updatedUser.avatar,
              },
            };
          }
          return act;
        });

        const updatedAssignedTo =
          prev.assignedTo?.id === updatedUser.id
            ? { ...prev.assignedTo, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, avatar: updatedUser.avatar }
            : prev.assignedTo;

        return { ...prev, activities: updatedActivities, assignedTo: updatedAssignedTo };
      });
    };

    const handleNewMessage = (data: { leadId: string; message: Message }) => {
      if (data.leadId === leadId && data.message) {
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

    const handleMessageStatusUpdate = (data: { messageId: string; status: string; leadId: string }) => {
      if (data.leadId === leadId) {
        setLead((prev) => {
          if (!prev || !prev.messages) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.messageId === data.messageId || m.id === data.messageId
                ? { ...m, status: data.status }
                : m
            ),
          };
        });
      }
    };

    const handleFollowupDeleted = (data: { leadId: string; followupId: string }) => {
      if (data.leadId === leadId) {
        setLead((prev) => {
          if (!prev) return prev;
          const targetFollowup = (prev.followups || []).find((f) => f.id === data.followupId);
          const followupNote = targetFollowup?.note || "";

          const nextFollowups = (prev.followups || []).filter((f) => f.id !== data.followupId);
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

          return { ...prev, followups: nextFollowups, activities: nextActivities };
        });
      }
    };

    socket.on("lead_activity_created", handleActivityCreated);
    socket.on("lead_activity_deleted", handleActivityDeleted);
    socket.on("lead_updated", handleLeadUpdated);
    socket.on("user_updated", handleUserUpdated);
    socket.on("new_message", handleNewMessage);
    socket.on("message_status_update", handleMessageStatusUpdate);
    socket.on("followup_deleted", handleFollowupDeleted);

    return () => {
      socket.off("lead_activity_created", handleActivityCreated);
      socket.off("lead_activity_deleted", handleActivityDeleted);
      socket.off("lead_updated", handleLeadUpdated);
      socket.off("user_updated", handleUserUpdated);
      socket.off("new_message", handleNewMessage);
      socket.off("message_status_update", handleMessageStatusUpdate);
      socket.off("followup_deleted", handleFollowupDeleted);
    };
  }, [socket, leadId, setLead, setAgents]);
}
