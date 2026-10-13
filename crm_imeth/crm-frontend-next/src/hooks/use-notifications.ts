"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/hooks/use-socket";
import type { Notification } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useNotifications() {
  const router = useRouter();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient<Notification[]>("/notifications?limit=20");
      if (res.success && res.data) {
        setNotifications(res.data.slice(0, 20));
      }
    } catch {
      // Non-critical background fetch
    }

    try {
      const countRes = await apiClient<{ count: number }>("/notifications/unread-count");
      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.count);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);

      if (notif.type === "TASK_OVERDUE") {
        toast.error(notif.title, {
          description: notif.body || notif.message,
          action: notif.linkUrl
            ? { label: "View Task", onClick: () => router.push(notif.linkUrl!) }
            : undefined,
        });
      } else if (notif.type === "TASK_DUE_SOON") {
        toast.warning(notif.title, {
          description: notif.body || notif.message,
          action: notif.linkUrl
            ? { label: "View Task", onClick: () => router.push(notif.linkUrl!) }
            : undefined,
        });
      } else {
        toast.info(notif.title, {
          description: notif.body || notif.message,
          action: notif.linkUrl
            ? { label: "View", onClick: () => router.push(notif.linkUrl!) }
            : undefined,
        });
      }
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, router]);

  const markAllRead = async () => {
    await apiClient("/notifications/read-all", { method: "PUT" }).catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = async (notifId: string) => {
    await apiClient(`/notifications/${notifId}/read`, { method: "PUT" }).catch(() => {});
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllRead,
    markAsRead,
  };
}
