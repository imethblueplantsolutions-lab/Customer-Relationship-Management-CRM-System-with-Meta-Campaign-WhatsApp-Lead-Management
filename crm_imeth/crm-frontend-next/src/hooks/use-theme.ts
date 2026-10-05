"use client";

import { useThemeContext } from "@/providers/theme-provider";
export { useThemeContext };

export function useTheme() {
  return useThemeContext();
}
