"use client";

import React from "react";
import { Info, X, Sparkles, ArrowUpRight } from "lucide-react";

export type PlanLimitAlertVariant = "blue" | "teal" | "amber" | "dark";

export interface PlanLimitAlertProps {
  /**
   * Title text (Marker B in reference design)
   * Default: "Unavailable with your plan"
   */
  title?: string;

  /**
   * Body content / description (Marker C in reference design)
   * Default: "Upgrade to a pay-as-you-go account to use this feature."
   */
  message?: React.ReactNode;

  /**
   * Custom Icon node (Marker A in reference design)
   * Defaults to circular info icon badge
   */
  icon?: React.ReactNode;

  /**
   * Dismiss callback (Marker D in reference design)
   * If provided, displays the close button "×"
   */
  onClose?: () => void;

  /**
   * Optional upgrade action callback or click handler
   */
  onUpgrade?: () => void;

  /**
   * Upgrade button label text
   */
  upgradeLabel?: string;

  /**
   * Theme variant for color styling (Marker E in reference design)
   * Supports "blue" (exact screenshot match), "teal" (CRM brand), "amber" (warning), "dark"
   */
  variant?: PlanLimitAlertVariant;

  /**
   * Custom outer container CSS classes for further theme adjustment
   */
  className?: string;
}

const THEME_STYLES: Record<
  PlanLimitAlertVariant,
  {
    container: string;
    accentBar: string;
    iconWrap: string;
    icon: string;
    title: string;
    message: string;
    closeBtn: string;
    upgradeBtn: string;
  }
> = {
  // Option 1: Exact reference design from screenshot (Blue accent on soft blue tinted background)
  blue: {
    container: "bg-[#EFF6FF] border border-[#BFDBFE] text-slate-800",
    accentBar: "bg-[#2563EB]",
    iconWrap: "bg-[#2563EB] text-white shadow-sm",
    icon: "text-[#2563EB]",
    title: "text-[#1E293B] font-semibold",
    message: "text-[#475569]",
    closeBtn: "text-slate-400 hover:text-slate-700 hover:bg-blue-100/60",
    upgradeBtn: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs",
  },
  // Option 2: CRM Brand Theme (#1B262C, #0F4C75, #3282B8, #BBE1FA)
  teal: {
    container: "bg-[#F0F7FC] border border-[#BBE1FA] text-[#1B262C]",
    accentBar: "bg-[#0F4C75]",
    iconWrap: "bg-[#0F4C75] text-[#BBE1FA] shadow-sm",
    icon: "text-[#3282B8]",
    title: "text-[#0F4C75] font-bold",
    message: "text-[#1B262C]/80",
    closeBtn: "text-slate-400 hover:text-[#0F4C75] hover:bg-[#BBE1FA]/40",
    upgradeBtn: "bg-[#0F4C75] hover:bg-[#1B262C] text-white shadow-xs",
  },
  // Option 3: Warning / Notice Amber
  amber: {
    container: "bg-[#FFFBEB] border border-[#FDE68A] text-amber-950",
    accentBar: "bg-[#F59E0B]",
    iconWrap: "bg-[#F59E0B] text-white shadow-sm",
    icon: "text-[#D97706]",
    title: "text-[#78350F] font-semibold",
    message: "text-[#92400E]",
    closeBtn: "text-amber-400 hover:text-amber-800 hover:bg-amber-100/80",
    upgradeBtn: "bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs",
  },
  // Option 4: Sleek Dark Mode
  dark: {
    container: "bg-[#1B262C] border border-[#3282B8]/40 text-slate-200 shadow-lg",
    accentBar: "bg-[#3282B8]",
    iconWrap: "bg-[#3282B8] text-white shadow-sm",
    icon: "text-[#BBE1FA]",
    title: "text-white font-semibold",
    message: "text-slate-300",
    closeBtn: "text-slate-400 hover:text-white hover:bg-white/10",
    upgradeBtn: "bg-[#3282B8] hover:bg-[#0F4C75] text-white shadow-xs",
  },
};

export default function PlanLimitAlert({
  title = "Unavailable with your plan",
  message = "Upgrade to a pay-as-you-go account to use this feature.",
  icon,
  onClose,
  onUpgrade,
  upgradeLabel = "Upgrade Plan",
  variant = "blue",
  className = "",
}: PlanLimitAlertProps) {
  const theme = THEME_STYLES[variant] || THEME_STYLES.blue;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-lg overflow-hidden transition-all duration-200 shadow-xs ${theme.container} ${className}`}
    >
      {/* Marker E: Left Theme Accent Line */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accentBar}`}
        aria-hidden="true"
      />

      {/* Main Content Area */}
      <div className="flex-1 py-3.5 pl-4 pr-2 flex items-start gap-3 min-w-0">
        {/* Marker A: Icon */}
        <div className="shrink-0 mt-0.5">
          {icon ? (
            icon
          ) : (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${theme.iconWrap}`}
            >
              <Info className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Marker B: Title */}
          <h4 className={`text-xs md:text-sm tracking-tight leading-snug ${theme.title}`}>
            {title}
          </h4>

          {/* Marker C: Body Content */}
          <div className={`mt-0.5 text-xs leading-relaxed ${theme.message}`}>
            {message}
          </div>

          {/* Optional Action / Upgrade link */}
          {onUpgrade && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={onUpgrade}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${theme.upgradeBtn}`}
              >
                <Sparkles className="h-3 w-3" />
                {upgradeLabel}
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marker D: Close Button */}
      {onClose && (
        <div className="pt-2.5 pr-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className={`p-1 rounded-md transition-colors cursor-pointer ${theme.closeBtn}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
