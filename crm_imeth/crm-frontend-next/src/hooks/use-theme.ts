"use client";

import { useState, useEffect } from "react";
import {
  ThemeId,
  ThemeConfig,
  THEMES,
  getActiveThemeId,
  getThemeById,
  applyTheme as applyThemeUtil,
} from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";

export function useTheme() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => getActiveThemeId(userId));
  const [mounted, setMounted] = useState(false);

  // Synchronize whenever the authenticated user changes (login / switch user / logout)
  useEffect(() => {
    setMounted(true);
    const active = getActiveThemeId(userId);
    setCurrentThemeId(active);
    applyThemeUtil(active, userId);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ themeId: ThemeId; userId?: string | null }>;
      // Only react if the event is for this user or general
      if (customEvent.detail?.themeId) {
        if (!customEvent.detail.userId || customEvent.detail.userId === userId) {
          setCurrentThemeId(customEvent.detail.themeId);
        }
      }
    };

    window.addEventListener("crm-theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("crm-theme-changed", handleThemeChange);
    };
  }, [userId]);

  const setTheme = (id: ThemeId) => {
    setCurrentThemeId(id);
    applyThemeUtil(id, userId);
  };

  const currentTheme: ThemeConfig = getThemeById(currentThemeId);

  return {
    currentThemeId,
    currentTheme,
    setTheme,
    themes: THEMES,
    mounted,
  };
}
