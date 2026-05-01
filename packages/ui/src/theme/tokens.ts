/**
 * Design tokens for @azrtydxb/ui
 *
 * Seeded from packages/client/src/styles/globals.css and shadcn default palette.
 * Colors use zinc/slate as neutral base, violet as primary (matching the app palette).
 */

export const tokens = {
  colors: {
    // Neutral / surface (zinc-based, matching app's gray scale)
    surface: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#374151",
      800: "#1f2937",
      850: "#1a1f2e",
      900: "#111827",
      950: "#0d1117",
    },
    // Primary — violet (matches app btn-primary)
    primary: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
      950: "#2e1065",
    },
    // Semantic
    destructive: {
      DEFAULT: "#ef4444",
      foreground: "#fef2f2",
    },
    success: {
      DEFAULT: "#22c55e",
      foreground: "#f0fdf4",
    },
    warning: {
      DEFAULT: "#f59e0b",
      foreground: "#fffbeb",
    },
    info: {
      DEFAULT: "#3b82f6",
      foreground: "#eff6ff",
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  typography: {
    fontSans: "'Inter', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    sizeXs: "0.75rem",
    sizeSm: "0.875rem",
    sizeMd: "1rem",
    sizeLg: "1.125rem",
    sizeXl: "1.25rem",
    size2xl: "1.5rem",
  },
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    full: "9999px",
  },
} as const;

export type Tokens = typeof tokens;
