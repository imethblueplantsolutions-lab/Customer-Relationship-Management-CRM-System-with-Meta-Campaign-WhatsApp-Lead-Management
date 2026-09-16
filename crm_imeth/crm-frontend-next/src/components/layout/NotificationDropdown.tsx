"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/hooks/use-socket";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types";
import { toast } from "sonner";

interface NotificationDropdownProps {
  isCollapsed: boolean;
}

export default function NotificationDropdown({ isCollapsed }: NotificationDropdownProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      // H5: Fetch latest 20 notifications to prevent loading thousands into DOM
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
  }, [fetchNotifications]);

  // Real-time notification updates via Socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);

      // Trigger sonner toast directly
      toast(notif.title, {
        description: notif.body,
        action: notif.linkUrl
          ? {
              label: "View",
              onClick: () => router.push(notif.linkUrl!),
            }
          : undefined,
      });
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, router]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await apiClient(`/notifications/${notif.id}/read`, { method: "PUT" }).catch(() => {});
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.linkUrl) {
      setIsOpen(false);
      router.push(notif.linkUrl);
    }
  };

  const markAllRead = async () => {
    await apiClient("/notifications/read-all", { method: "PUT" }).catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ${
          isCollapsed ? "justify-center" : ""
        }`}
        title="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="text-sm font-medium">Notifications</span>}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 left-6 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 rounded-2xl border border-slate-700 bg-[#1B262C] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#BBE1FA] hover:text-white cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notif.isRead ? "border-l-2 border-blue-500" : ""
                  }`}
                >
                  <p
                    className={`text-xs font-semibold truncate ${
                      !notif.isRead ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {formatDateTime(notif.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
