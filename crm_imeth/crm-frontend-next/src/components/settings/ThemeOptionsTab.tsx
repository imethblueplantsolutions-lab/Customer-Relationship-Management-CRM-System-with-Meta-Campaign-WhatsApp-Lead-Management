"use client";

import { useState } from "react";
import {
  Palette,
  Check,
  Sparkles,
  Sun,
  Moon,
  Copy,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { THEMES, ThemeConfig, ThemeId } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeOptionsTab() {
  const { currentThemeId, currentTheme, setTheme } = useTheme();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState<ThemeId | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => {
      setCopiedHex(null);
    }, 1800);
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    setJustApplied(themeId);
    setTimeout(() => {
      setJustApplied(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Theme & Workspace Styling
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred color scheme. Settings apply immediately and persist in your browser.
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Theme Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
          <span className="text-slate-500 font-medium">Active:</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-xs"
              style={{ backgroundColor: currentTheme.colors.primary }}
            />
            {currentTheme.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-600 uppercase tracking-wider">
            {currentTheme.category}
          </span>
        </div>
      </div>

      {justApplied && (
        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Theme updated to <strong>{THEMES.find(t => t.id === justApplied)?.name}</strong>! Workspace styles have been updated.</span>
        </div>
      )}

      {/* Themes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {THEMES.map((theme) => {
          const isActive = currentThemeId === theme.id;
          const isDark = theme.category === "dark";

          return (
            <div
              key={theme.id}
              className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isActive
                  ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-white"
                  : "border-slate-200/90 hover:border-slate-300 hover:shadow-md bg-white"
              }`}
            >
              {/* Card Header */}
              <div className="p-5 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {theme.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isDark
                            ? "bg-slate-900 text-slate-200 border-slate-700"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {isDark ? (
                          <Moon className="h-2.5 w-2.5" />
                        ) : (
                          <Sun className="h-2.5 w-2.5" />
                        )}
                        {theme.category === "dark" ? "Dark Theme" : "Light Theme"}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {theme.tagline}
                    </p>
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {theme.description}
                </p>
              </div>

              {/* Live Mini Preview Box */}
              <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>UI Sample Preview</span>
                  <span className="text-[10px] font-normal text-slate-400">Live preview</span>
                </div>

                {/* Simulated CRM Mini Card */}
                <div
                  className="rounded-xl p-3.5 border transition-all shadow-xs"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-xs"
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: isDark ? "#ffffff" : "#ffffff",
                        }}
                      >
                        💬
                      </div>
                      <div>
                        <div
                          className="text-[11px] font-bold leading-tight"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          Acme Global Lead
                        </div>
                        <div
                          className="text-[9px]"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          +1 (555) 382-9901
                        </div>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textPrimary,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      $8,500 Deal
                    </span>
                  </div>

                  {/* Mini Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: theme.colors.border }}>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs transition-opacity"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: "#ffffff",
                      }}
                    >
                      Send WhatsApp
                    </button>
                    <span
                      className="px-2 py-1 rounded-lg text-[10px] font-medium"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textSecondary,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      Follow-up Today
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Swatches List */}
              <div className="p-5 pt-4 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Palette Specifications
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {theme.swatches.map((swatch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCopyHex(swatch.hex)}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 text-left transition-all cursor-pointer group"
                      title={`Click to copy ${swatch.hex}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-4 w-4 rounded-md shrink-0 shadow-xs border border-black/10"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-[11px] font-medium text-slate-700 truncate">
                          {swatch.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          {swatch.hex}
                        </span>
                        {copiedHex === swatch.hex ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  disabled={isActive}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-xs hover:shadow-md"
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600" />
                      Currently Applied
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply {theme.name} Theme
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset to Default Section */}
      <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
        <span>Need to revert your interface?</span>
        <button
          type="button"
          onClick={() => handleSelectTheme("default-crm")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          Reset to Classic CRM Default
        </button>
      </div>
    </div>
  );
}
