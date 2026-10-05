export type ThemeId =
  | "graphite"
  | "ocean-blue"
  | "coral-charcoal"
  | "midnight-slate"
  | "sage-green"
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

export const THEMES: ThemeConfig[] = [
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
    id: "default-crm",
    name: "Classic CRM Teal",
    category: "dark",
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
  if (typeof window === "undefined") return "default-crm";
  try {
    const key = getThemeStorageKey(userId);
    const saved = localStorage.getItem(key) as ThemeId;
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore localStorage access issues
  }
  return "default-crm";
}

export function getThemeById(id: string): ThemeConfig {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

/**
 * Applies the CSS variables to document.documentElement and saves strictly to this user's storage key.
 */
export function applyTheme(themeId: ThemeId, userId?: string | null): void {
  if (typeof window === "undefined") return;

  const theme = getThemeById(themeId);
  const root = document.documentElement;

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

  root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-theme-mode", theme.category);

  // Apply semantic tokens
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
