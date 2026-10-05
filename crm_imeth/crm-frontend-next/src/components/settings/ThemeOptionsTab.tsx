"use client";

import { THEMES } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeOptionsTab() {
  const { currentThemeId, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-base font-semibold text-brand-text tracking-tight">
          Admin Color Scheme
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Select a color palette for your CRM workspace. Click any option to activate.
        </p>
      </div>

      {/* Grid of themes matching WordPress / SaaS minimal radio color bar style */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {THEMES.map((theme) => {
          const isSelected = currentThemeId === theme.id;

          return (
            <div
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`flex flex-col justify-center p-3 rounded-xl transition-all cursor-pointer select-none border ${
                isSelected
                  ? "bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary/30 shadow-xs"
                  : "bg-brand-surface/60 border-brand-muted/30 hover:bg-brand-surface hover:border-brand-muted/60"
              }`}
            >
              {/* Radio Button + Theme Name */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="crm-admin-color-scheme"
                  value={theme.id}
                  checked={isSelected}
                  onChange={() => setTheme(theme.id)}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-muted/50 cursor-pointer accent-current"
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isSelected ? "text-brand-text font-bold" : "text-brand-muted"
                  }`}
                >
                  {theme.name}
                </span>
              </label>

              {/* Horizontal Multi-Color Bar Strip */}
              <div className="flex h-5 w-full max-w-[210px] overflow-hidden rounded-xs mt-2 border border-black/10 shadow-2xs">
                {theme.swatches.map((swatch, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-full"
                    style={{ backgroundColor: swatch.hex }}
                    title={`${swatch.label}: ${swatch.hex}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
