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

export function useTheme() {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>("default-crm");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const active = getActiveThemeId();
    setCurrentThemeId(active);
    applyThemeUtil(active);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ themeId: ThemeId }>;
      if (customEvent.detail?.themeId) {
        setCurrentThemeId(customEvent.detail.themeId);
      }
    };

    window.addEventListener("crm-theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("crm-theme-changed", handleThemeChange);
    };
  }, []);

  const setTheme = (id: ThemeId) => {
    setCurrentThemeId(id);
    applyThemeUtil(id);
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
