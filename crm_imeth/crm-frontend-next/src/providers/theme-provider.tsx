"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  ThemeId,
  ThemeConfig,
  THEMES,
  getActiveThemeId,
  getThemeById,
  applyTheme as applyThemeUtil,
} from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";

interface ThemeContextType {
  currentThemeId: ThemeId;
  currentTheme: ThemeConfig;
  setTheme: (id: ThemeId) => void;
  themes: ThemeConfig[];
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => getActiveThemeId(userId));
  const [mounted, setMounted] = useState(false);

  // Synchronize on mount, whenever the user switches, or route changes
  useEffect(() => {
    setMounted(true);

    if (isLoginPage) {
      // /login is strictly kept to its original default CRM styling and never affected by user themes
      applyThemeUtil("default-crm", null, false);
      return;
    }

    const active = getActiveThemeId(userId);
    setCurrentThemeId(active);
    applyThemeUtil(active, userId, true);

    const handleThemeChange = (e: Event) => {
      if (isLoginPage) return;
      const customEvent = e as CustomEvent<{ themeId: ThemeId; userId?: string | null }>;
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
  }, [userId, isLoginPage]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setCurrentThemeId(id);
      applyThemeUtil(id, userId, true);
    },
    [userId]
  );

  const currentTheme: ThemeConfig = useMemo(() => {
    return getThemeById(currentThemeId);
  }, [currentThemeId]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      currentThemeId,
      currentTheme,
      setTheme,
      themes: THEMES,
      mounted,
    }),
    [currentThemeId, currentTheme, setTheme, mounted]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a <ThemeProvider>");
  }
  return context;
}
