"use client";

import { THEMES } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

export default function ThemeOptionsTab() {
  const { currentThemeId, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base font-semibold text-brand-text tracking-tight">
            Admin Color Scheme
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/25">
            <Sparkles className="w-3 h-3 text-brand-primary" />
            Main CRM Theme Active
          </span>
        </div>
        <p className="text-xs text-brand-muted mt-1 leading-relaxed">
          The official Vibrant Blue & Bright Cyan palette is set as your default CRM design system.
        </p>
      </div>

      {/* Main Active Theme Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.map((theme) => {
          const isSelected = true;

          return (
            <div
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className="flex flex-col justify-between p-4 rounded-xl transition-all select-none border bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary/30 shadow-xs cursor-pointer"
            >
              <div>
                {/* Header: Radio, Name & Active Badge */}
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="crm-admin-color-scheme"
                      value={theme.id}
                      checked={isSelected}
                      onChange={() => setTheme(theme.id)}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-muted/50 cursor-pointer accent-current"
                    />
                    <span className="text-sm font-bold text-brand-text">
                      {theme.name}
                    </span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                    Default Active
                  </span>
                </div>

                <p className="text-xs text-brand-muted mt-1.5">
                  {theme.description}
                </p>

                {/* Horizontal Multi-Color Bar Strip */}
                <div className="flex h-6 w-full overflow-hidden rounded-md mt-3.5 border border-black/10 shadow-2xs">
                  {theme.swatches.map((swatch, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-full transition-transform hover:scale-105"
                      style={{ backgroundColor: swatch.hex }}
                      title={`${swatch.label}: ${swatch.hex}`}
                    />
                  ))}
                </div>
              </div>

              {/* Swatches Legend List */}
              <div className="mt-4 pt-3 border-t border-brand-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {theme.swatches.map((swatch, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-xs border border-black/20 shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="font-mono text-[10px] text-brand-muted">
                      {swatch.hex}
                    </span>
                    <span className="truncate text-brand-text font-medium text-[10px]">
                      {swatch.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about locked main palette */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-blue-900">Theme Isolation Active:</span>{" "}
          Other theme alternatives have been hidden. The entire CRM application workspace is locked to this official Vibrant Blue & Cyan specification.
        </div>
      </div>
    </div>
  );
}
