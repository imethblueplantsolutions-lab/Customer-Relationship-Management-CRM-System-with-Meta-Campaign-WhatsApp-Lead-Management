"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { apiClient } from "@/lib/api-client";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { Notification } from "@/types";

interface NotificationBellProps {
  className?: string;
  dropdownAlign?: "left" | "right";
}

export default function NotificationBell({
  className = "",
  dropdownAlign = "right",
}: NotificationBellProps) {
  const router = useRouter();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and unread count from API
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient<Notification[]>("/notifications"),
        apiClient<{ count: number }>("/notifications/unread-count"),
      ]);

      if (listRes.success && Array.isArray(listRes.data)) {
        setNotifications(listRes.data);
      }
      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.count);
      } else if (listRes.success && Array.isArray(listRes.data)) {
        const unread = listRes.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("[NotificationBell] Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time Socket.IO alerts
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setHasNewAlert(true);

      // Brief gentle shake/alert animation trigger
      setTimeout(() => setHasNewAlert(false), 3000);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle clicking a specific notification item
  const handleItemClick = async (notif: Notification) => {
    if (!notif.isRead) {
      // Optimistic update
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notif.id ? { ...item, isRead: true } : item
        )
      );

      try {
        await apiClient(`/notifications/${notif.id}/read`, {
          method: "PUT",
        });
      } catch (error) {
        console.error("[NotificationBell] Error marking notification as read:", error);
      }
    }

    setIsOpen(false);

    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );

    try {
      await apiClient("/notifications/read-all", {
        method: "PUT",
      });
    } catch (error) {
      console.error("[NotificationBell] Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-[#128c7e]" />;
      case "LEAD_ASSIGNED":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "FOLLOWUP_ASSIGNED":
      case "FOLLOWUP_DUE":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-emerald-500" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#128c7e]/30 ${
          hasNewAlert ? "animate-bounce" : ""
        }`}
      >
        <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden ${
            dropdownAlign === "left" ? "left-0" : "right-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#128c7e] hover:text-[#075e54] transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-6 w-6 animate-spin text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-700">You're all caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No new lead messages or task alerts at this time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const messageText = notif.message || notif.body || "";
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer hover:bg-slate-50 ${
                      !notif.isRead ? "bg-emerald-50/40" : "bg-white"
                    }`}
                  >
                    {/* Type Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                        !notif.isRead
                          ? "bg-white ring-1 ring-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !notif.isRead
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {messageText}
                      </p>

                      {notif.linkUrl && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#128c7e] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View lead</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Unread Indicator Dot */}
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#128c7e] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
