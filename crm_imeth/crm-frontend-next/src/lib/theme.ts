export type ThemeId =
  | "graphite"
  | "ocean-blue"
  | "coral-charcoal"
  | "midnight-slate"
  | "sage-green"
  | "cyber-neon"
  | "arctic-frost"
  | "emerald-mint"
  | "crimson-sunset"
  | "obsidian-gold"
  | "default-crm";

export interface ColorSwatch {
  label: string;
  hex: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: "dark" | "light";
  tagline: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    accent: string;
    sidebar: string;
  };
  swatches: ColorSwatch[];
}

export const MAIN_CRM_THEME: ThemeConfig = {
  id: "default-crm",
  name: "Vibrant Blue",
  category: "light",
  tagline: "Vibrant Blue & Cyan (Main CRM)",
  description: "Official CRM palette featuring Vibrant Blue, Bright Cyan, Pale Blue-Gray surfaces, and Deep Navy typography on an icy white canvas.",
  colors: {
    background: "#F3F8FE",
    surface: "#DEEEFD",
    border: "#C8E0F8",
    textPrimary: "#0A2540",
    textSecondary: "#476685",
    primary: "#1B7BED",
    accent: "#18DBF5",
    sidebar: "#0A2540",
  },
  swatches: [
    { label: "C1 (Brand) Vibrant Blue", hex: "#1B7BED" },
    { label: "C2 (Accent) Bright Cyan", hex: "#18DBF5" },
    { label: "C3 (Base) Icy White", hex: "#F3F8FE" },
    { label: "C4 (Surface) Pale Blue-Gray", hex: "#DEEEFD" },
    { label: "C5 (Neutral) Deep Navy", hex: "#0A2540" },
  ],
};

/**
 * Active Theme Registry:
 * Currently locked to the official Main CRM theme.
 * Other themes are hidden and preserved in ARCHIVED_THEMES below.
 */
export const THEMES: ThemeConfig[] = [MAIN_CRM_THEME];

/**
 * Preserved / Archived themes (hidden right now)
 */
export const ARCHIVED_THEMES: ThemeConfig[] = [
  {
    id: "graphite",
    name: "Graphite",
    category: "dark",
    tagline: "Ultra-Dark / Minimalist",
    description: "Deep obsidian canvas with subtle card contrast and crisp monochrome clarity.",
    colors: {
      background: "#080808",
      surface: "#353536",
      border: "#706f70",
      textPrimary: "#ebedf1",
      textSecondary: "#acadb1",
      primary: "#ebedf1",
      accent: "#ffffff",
      sidebar: "#121213",
    },
    swatches: [
      { label: "Background (Deep)", hex: "#080808" },
      { label: "Surface / Card", hex: "#353536" },
      { label: "Border / Muted", hex: "#706f70" },
      { label: "Text (Secondary)", hex: "#acadb1" },
      { label: "Text (Primary) / Accent", hex: "#ebedf1" },
    ],
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    category: "light",
    tagline: "Classic SaaS",
    description: "High-contrast enterprise SaaS layout with electric blue brand accents and clean white base.",
    colors: {
      background: "#fdfdfd",
      surface: "#ffffff",
      border: "#7c9fee",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      primary: "#0149f9",
      accent: "#2665f9",
      sidebar: "#012b91",
    },
    swatches: [
      { label: "Primary (Brand)", hex: "#0149f9" },
      { label: "Accent / Hover", hex: "#2665f9" },
      { label: "Muted Blue / Border", hex: "#7c9fee" },
      { label: "Surface (Light)", hex: "#d4dbe9" },
      { label: "Background (Pure)", hex: "#fdfdfd" },
    ],
  },
  {
    id: "coral-charcoal",
    name: "Coral & Charcoal",
    category: "dark",
    tagline: "Vibrant & High Contrast",
    description: "Warm dark-charcoal surfaces energized by punchy coral action buttons and soft peach highlights.",
    colors: {
      background: "#2f3035",
      surface: "#3a3c42",
      border: "#b1b1b1",
      textPrimary: "#fdfcfc",
      textSecondary: "#acadb1",
      primary: "#f87941",
      accent: "#f9b095",
      sidebar: "#232428",
    },
    swatches: [
      { label: "Background (Dark)", hex: "#2f3035" },
      { label: "Primary (Brand/Action)", hex: "#f87941" },
      { label: "Accent (Soft)", hex: "#f9b095" },
      { label: "Border / Muted", hex: "#b1b1b1" },
      { label: "Surface (Light)", hex: "#e6e4e6" },
      { label: "Text (Primary)", hex: "#fdfcfc" },
    ],
  },
  {
    id: "midnight-slate",
    name: "Midnight Slate",
    category: "dark",
    tagline: "Deep Purple / Gray",
    description: "Sleek pitch-black foundation featuring soft violet undertones, slate borders, and subdued tones.",
    colors: {
      background: "#0b0b0b",
      surface: "#1e1e1f",
      border: "#393741",
      textPrimary: "#cdd0dc",
      textSecondary: "#665f5f",
      primary: "#958f9e",
      accent: "#b3adc2",
      sidebar: "#141318",
    },
    swatches: [
      { label: "Background (Deep)", hex: "#0b0b0b" },
      { label: "Surface / Card", hex: "#1e1e1f" },
      { label: "Border / Highlight", hex: "#393741" },
      { label: "Muted Text", hex: "#665f5f" },
      { label: "Accent / Secondary", hex: "#958f9e" },
      { label: "Text (Primary)", hex: "#cdd0dc" },
    ],
  },
  {
    id: "sage-green",
    name: "Sage Green",
    category: "light",
    tagline: "Earthy & Clean",
    description: "Natural organic palette with gentle sage green highlights, soft grey surfaces, and crisp white backdrop.",
    colors: {
      background: "#fefefe",
      surface: "#ffffff",
      border: "#bec0bf",
      textPrimary: "#1c2a27",
      textSecondary: "#52605d",
      primary: "#476e66",
      accent: "#708a83",
      sidebar: "#253b36",
    },
    swatches: [
      { label: "Primary (Brand)", hex: "#476e66" },
      { label: "Accent / Hover", hex: "#708a83" },
      { label: "Border / Muted", hex: "#bec0bf" },
      { label: "Surface (Soft)", hex: "#dfdfe2" },
      { label: "Background (Light)", hex: "#f4f4f4" },
      { label: "Background (Pure)", hex: "#fefefe" },
    ],
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    category: "dark",
    tagline: "Modern Dark Mode",
    description: "Futuristic dark theme with neon violet accents and electric magenta highlights.",
    colors: {
      background: "#09090b",
      surface: "#18181b",
      border: "#3f3f46",
      textPrimary: "#fafafa",
      textSecondary: "#a1a1aa",
      primary: "#8b5cf6",
      accent: "#d946ef",
      sidebar: "#101014",
    },
    swatches: [
      { label: "Background (Deep)", hex: "#09090b" },
      { label: "Surface / Card", hex: "#18181b" },
      { label: "Primary (Brand)", hex: "#8b5cf6" },
      { label: "Accent (Vibrant)", hex: "#d946ef" },
      { label: "Border / Muted", hex: "#3f3f46" },
    ],
  },
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    category: "light",
    tagline: "Ultra-Minimalist Light",
    description: "Pure alabaster clean canvas with dark slate text and refined frost-blue borders.",
    colors: {
      background: "#ffffff",
      surface: "#f8fafc",
      border: "#e2e8f0",
      textPrimary: "#020617",
      textSecondary: "#64748b",
      primary: "#0f172a",
      accent: "#334155",
      sidebar: "#0f172a",
    },
    swatches: [
      { label: "Background (Pure)", hex: "#ffffff" },
      { label: "Surface / Card", hex: "#f8fafc" },
      { label: "Primary (Brand)", hex: "#0f172a" },
      { label: "Accent / Hover", hex: "#334155" },
      { label: "Border / Muted", hex: "#e2e8f0" },
    ],
  },
  {
    id: "emerald-mint",
    name: "Emerald Mint",
    category: "light",
    tagline: "Finance / Growth",
    description: "Crisp mint-tinted workspace designed for fintech clarity and high-growth sales.",
    colors: {
      background: "#f0fdf4",
      surface: "#ffffff",
      border: "#bbf7d0",
      textPrimary: "#064e3b",
      textSecondary: "#047857",
      primary: "#10b981",
      accent: "#059669",
      sidebar: "#064e3b",
    },
    swatches: [
      { label: "Background (Light)", hex: "#f0fdf4" },
      { label: "Surface / Card", hex: "#ffffff" },
      { label: "Primary (Brand)", hex: "#10b981" },
      { label: "Accent / Hover", hex: "#059669" },
      { label: "Border / Muted", hex: "#bbf7d0" },
    ],
  },
  {
    id: "crimson-sunset",
    name: "Crimson Sunset",
    category: "light",
    tagline: "Bold & Energetic",
    description: "High-energy rose and ruby tones with soft warm surfaces for active lead conversions.",
    colors: {
      background: "#fef2f2",
      surface: "#ffffff",
      border: "#fecdd3",
      textPrimary: "#4c0519",
      textSecondary: "#9f1239",
      primary: "#e11d48",
      accent: "#be123c",
      sidebar: "#4c0519",
    },
    swatches: [
      { label: "Background (Warm)", hex: "#fef2f2" },
      { label: "Surface / Card", hex: "#ffffff" },
      { label: "Primary (Brand)", hex: "#e11d48" },
      { label: "Accent / Hover", hex: "#be123c" },
      { label: "Border / Muted", hex: "#fecdd3" },
    ],
  },
  {
    id: "obsidian-gold",
    name: "Obsidian Gold",
    category: "dark",
    tagline: "Executive / Luxury Dark",
    description: "Refined charcoal-black aesthetic embellished with warm metallic gold accents.",
    colors: {
      background: "#111111",
      surface: "#1f1f1f",
      border: "#333333",
      textPrimary: "#f5f5f5",
      textSecondary: "#a3a3a3",
      primary: "#d4af37",
      accent: "#f3e5ab",
      sidebar: "#181818",
    },
    swatches: [
      { label: "Background (Deep)", hex: "#111111" },
      { label: "Surface / Card", hex: "#1f1f1f" },
      { label: "Primary (Gold)", hex: "#d4af37" },
      { label: "Accent (Soft)", hex: "#f3e5ab" },
      { label: "Border / Muted", hex: "#333333" },
    ],
  },
  {
    id: "default-crm",
    name: "Classic CRM Teal",
    category: "light",
    tagline: "WhatsApp Dark Teal",
    description: "Original CRM aesthetic with signature deep teal sidebar and vibrant blue action highlights.",
    colors: {
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      textPrimary: "#1B262C",
      textSecondary: "#64748b",
      primary: "#0F4C75",
      accent: "#3282B8",
      sidebar: "#1B262C",
    },
    swatches: [
      { label: "Sidebar Teal", hex: "#1B262C" },
      { label: "Brand Navy", hex: "#0F4C75" },
      { label: "Accent Blue", hex: "#3282B8" },
      { label: "Light Blue", hex: "#BBE1FA" },
      { label: "Surface Light", hex: "#F8FAFC" },
    ],
  },
];

/**
 * Helper to get the user-scoped storage key
 */
export function getThemeStorageKey(userId?: string | null): string {
  if (userId) {
    return `crm_theme_${userId}`;
  }
  // When userId is explicitly null (e.g. unauthenticated / guest / login page),
  // never fall back to any previously stored user in localStorage!
  if (userId === null) {
    return "crm_theme_default";
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          return `crm_theme_${parsed.id}`;
        }
      }
    } catch {
      // Ignore
    }
  }
  return "crm_theme_default";
}

/**
 * Returns the currently active theme strictly for the specified user.
 * If user has no saved theme, defaults to 'default-crm'.
 * Never returns another user's theme!
 */
export function getActiveThemeId(userId?: string | null): ThemeId {
  // Always use the official Main CRM theme right now
  return "default-crm";
}

export function getThemeById(id: string): ThemeConfig {
  return THEMES.find((t) => t.id === id) || ARCHIVED_THEMES.find((t) => t.id === id) || MAIN_CRM_THEME;
}

/**
 * Applies the CSS variables to document.documentElement and saves strictly to this user's storage key.
 */
export function applyTheme(
  themeId: ThemeId,
  userId?: string | null,
  saveToStorage: boolean = true
): void {
  if (typeof window === "undefined") return;

  const theme = getThemeById(themeId);
  const root = document.documentElement;

  if (saveToStorage) {
    try {
      const key = getThemeStorageKey(userId);
      if (key !== "crm_theme_default") {
        localStorage.setItem(key, themeId);
      }
      // Remove deprecated global key to prevent cross-account leakage
      localStorage.removeItem("crm_active_theme");
    } catch {
      // Ignore
    }
  }

  root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-theme-mode", theme.category);

  // Apply dynamic semantic brand tokens
  root.style.setProperty("--brand-primary", theme.colors.primary);
  root.style.setProperty("--brand-accent", theme.colors.accent);
  root.style.setProperty("--brand-muted", theme.colors.textSecondary);
  root.style.setProperty("--brand-surface", theme.colors.surface);
  root.style.setProperty("--brand-bg", theme.colors.background);
  root.style.setProperty("--brand-text", theme.colors.textPrimary);

  // Apply legacy semantic tokens for backward compatibility
  root.style.setProperty("--color-bg", theme.colors.background);
  root.style.setProperty("--color-bg-card", theme.colors.surface);
  root.style.setProperty("--color-bg-sidebar", theme.colors.sidebar);
  root.style.setProperty("--color-border", theme.colors.border);
  root.style.setProperty("--color-text", theme.colors.textPrimary);
  root.style.setProperty("--color-text-muted", theme.colors.textSecondary);
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-primary-hover", theme.colors.accent);

  // Dispatch custom event for real-time listener updates
  window.dispatchEvent(
    new CustomEvent("crm-theme-changed", { detail: { themeId, theme, userId } })
  );
}
