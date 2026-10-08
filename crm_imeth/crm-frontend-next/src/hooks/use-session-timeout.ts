"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";

// 60 minutes of inactivity before warning modal triggers
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
// 2 minutes (120 seconds) warning countdown before hard logout
const WARNING_COUNTDOWN_SECONDS = 120;
// Throttle activity heartbeat broadcast (at most once every 10 seconds)
const ACTIVITY_THROTTLE_MS = 10 * 1000;

const CHANNEL_NAME = "crm_session_sync";
const STORAGE_SYNC_KEY = "crm_session_sync_event";

interface SessionSyncMessage {
  type: "user_active" | "session_extended" | "session_logout";
  timestamp: number;
  newToken?: string;
  newUser?: User;
  targetUserId?: string;
}

export function useSessionTimeout() {
  const { user, isAuthenticated, setSession, logout } = useAuth();
  const [isIdleWarningActive, setIsIdleWarningActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(WARNING_COUNTDOWN_SECONDS);
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastBroadcastRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Hard logout redirect preserving returnUrl
  const triggerLogout = useCallback((reason: "expired" | "manual" = "expired") => {
    if (typeof window === "undefined") return;

    // Notify other tabs
    try {
      const msg: SessionSyncMessage = {
        type: "session_logout",
        timestamp: Date.now(),
        targetUserId: user?.id,
      };
      channelRef.current?.postMessage(msg);
      localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
    } catch {
      // Ignore broadcast errors during unload
    }

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const safeReturnUrl =
      currentPath && currentPath !== "/" && currentPath !== "/login"
        ? `&returnUrl=${encodeURIComponent(currentPath)}`
        : "";

    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("user");

    window.location.href = `/login?${reason === "expired" ? "expired=true" : "logout=true"}${safeReturnUrl}`;
  }, []);

  // Reset idle timer & close warning modal
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdleWarningActive(false);
    setCountdownSeconds(WARNING_COUNTDOWN_SECONDS);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set timeout to activate warning modal after IDLE_TIMEOUT_MS
    idleTimerRef.current = setTimeout(() => {
      setIsIdleWarningActive(true);
      setCountdownSeconds(WARNING_COUNTDOWN_SECONDS);
    }, IDLE_TIMEOUT_MS);
  }, []);

  // Broadcast user activity to all open tabs
  const broadcastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (now - lastBroadcastRef.current > ACTIVITY_THROTTLE_MS) {
      lastBroadcastRef.current = now;
      try {
        const msg: SessionSyncMessage = { type: "user_active", timestamp: now };
        channelRef.current?.postMessage(msg);
        localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
      } catch {
        // Silently continue if BroadcastChannel is unsupported
      }
    }
  }, []);

  // Extend Session: Call POST /api/auth/refresh to get a fresh 12-hour JWT
  const extendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/refresh", {
        method: "POST",
      });

      if (res.success && res.data?.token && res.data?.user) {
        setSession(res.data.token, res.data.user);
        resetIdleTimer();

        // Notify other tabs that session was refreshed
        try {
          const msg: SessionSyncMessage = {
            type: "session_extended",
            timestamp: Date.now(),
            newToken: res.data.token,
            newUser: res.data.user,
          };
          channelRef.current?.postMessage(msg);
          localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
        } catch {
          // Ignore broadcast errors
        }
      } else {
        triggerLogout("expired");
      }
    } catch {
      triggerLogout("expired");
    } finally {
      setIsExtending(false);
    }
  }, [setSession, resetIdleTimer, triggerLogout]);

  // Handle countdown progression when warning modal is active
  useEffect(() => {
    if (!isIdleWarningActive) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          triggerLogout("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isIdleWarningActive, triggerLogout]);

  // Setup Activity Listeners & Cross-Tab Synchronization
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    // Initialize BroadcastChannel
    if ("BroadcastChannel" in window) {
      try {
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
          const msg = event.data;
          if (!msg) return;

          if (msg.type === "user_active") {
            // Another tab had user activity: reset timer if warning isn't actively counting down
            if (!isIdleWarningActive) {
              lastActivityRef.current = msg.timestamp;
              resetIdleTimer();
            }
          } else if (msg.type === "session_extended") {
            // Another tab extended session: only adopt if matching current active user
            if (msg.newToken && msg.newUser) {
              if (!user?.id || user.id === msg.newUser.id) {
                setSession(msg.newToken, msg.newUser);
              }
            }
            resetIdleTimer();
          } else if (msg.type === "session_logout") {
            // Another tab logged out: only trigger logout if matching current active user
            if (!msg.targetUserId || !user?.id || msg.targetUserId === user.id) {
              logout();
            }
          }
        };
      } catch {
        channelRef.current = null;
      }
    }

    // Fallback: storage event for multi-tab sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_SYNC_KEY && e.newValue) {
        try {
          const msg: SessionSyncMessage = JSON.parse(e.newValue);
          if (msg.type === "user_active" && !isIdleWarningActive) {
            lastActivityRef.current = msg.timestamp;
            resetIdleTimer();
          } else if (msg.type === "session_extended") {
            if (msg.newToken && msg.newUser) {
              if (!user?.id || user.id === msg.newUser.id) {
                setSession(msg.newToken, msg.newUser);
              }
            }
            resetIdleTimer();
          } else if (msg.type === "session_logout") {
            if (!msg.targetUserId || !user?.id || msg.targetUserId === user.id) {
              logout();
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Initial timer setup
    resetIdleTimer();

    // Throttled activity event handler
    const onUserActivity = () => {
      // If warning modal is active, user must explicitly click "Stay Logged In"
      if (!isIdleWarningActive) {
        broadcastActivity();
        resetIdleTimer();
      }
    };

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserActivity);
      });
      window.removeEventListener("storage", handleStorageEvent);

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      channelRef.current?.close();
    };
  }, [isAuthenticated, isIdleWarningActive, resetIdleTimer, broadcastActivity, setSession, logout]);

  return {
    isIdleWarningActive,
    countdownSeconds,
    isExtending,
    extendSession,
    logoutNow: () => triggerLogout("manual"),
  };
}
