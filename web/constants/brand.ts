/**
 * nabbi brand primitives — keep in sync with DESIGN_SYSTEM.md
 * and web/app/globals.css.
 *
 * Primary brand green: #558367
 * Light page bg: #FAF8F3 | Dark page bg: #0F1A14
 */

export type ColorMode = "light" | "dark";

export const brand = {
  /** Brand primary green (stable across themes) */
  primary: "#558367",
  ink: "#12211A",
  dark: "#1F3328",
  sage: "#558367",
  sageBright: "#88B89A",
  cream: "#FAF8F3",
  sand: "#E3D8C6",
  /** Standard light / dark canvases */
  bgLight: "#FAF8F3",
  bgDark: "#0F1A14",
  bgAltLight: "#E3D8C6",
  /** Dark alt band — clearly lighter than canvas so section rhythm stays visible */
  bgAltDark: "#2A4536",
  surfaceDark: "#1E3228",
  elevatedDark: "#243D2E",
  /** Dark “ink” band (hero / FAQ) — deeper than canvas */
  bandDark: "#08140F",
  bandDarkMid: "#143028",
  cta: "#F6C531",
  gold: "#D39932",
  teal: "#225D65",
  label: "#3d6050",
  muted: "#5a7d6a",
  body: "#475569",
  error: "#C0392B",
  white: "#FFFFFF",
} as const;

export const brandRgb = {
  sage: "85, 131, 103",
  sageBright: "136, 184, 154",
  cta: "246, 197, 49",
  dark: "31, 51, 40",
  gold: "211, 153, 50",
  teal: "34, 93, 101",
  cream: "250, 248, 243",
  bgDark: "15, 26, 20",
} as const;

/** Theme-aware surfaces for marketing + product chrome */
export function getSurfaces(mode: ColorMode) {
  if (mode === "dark") {
    // Same section roles as light (canvas / alt / dark band), stronger contrast so bands read clearly.
    return {
      mode: "dark" as const,
      bg: brand.bgDark, // canvas — categorias, pros, web
      bgAlt: brand.bgAltDark, // alt — como-funciona, final CTA
      elevated: brand.elevatedDark,
      card: brand.surfaceDark,
      text: brand.cream,
      textMuted: brand.sageBright,
      textBody: "#A8C4B0",
      label: brand.sageBright,
      primary: brand.primary,
      primarySoft: brand.sageBright,
      forest: brand.bandDark, // hero / deepest
      forestMid: brand.bandDarkMid, // FAQ band (must NOT equal bg)
      cta: brand.cta,
      ctaText: brand.ink,
      gold: brand.gold,
      border: "rgba(136,184,154,0.35)",
      headerBg: "rgba(15,26,20,0.94)",
      footerBg: brand.bandDark,
      faqOpenBg: brand.elevatedDark,
      primaryRgb: brandRgb.sageBright,
      ctaRgb: brandRgb.cta,
      darkRgb: brandRgb.bgDark,
      goldRgb: brandRgb.gold,
      tealRgb: brandRgb.teal,
    };
  }

  return {
    mode: "light" as const,
    bg: brand.bgLight,
    bgAlt: brand.bgAltLight,
    elevated: brand.bgAltLight,
    card: brand.white,
    text: brand.ink,
    textMuted: brand.label,
    textBody: brand.body,
    label: brand.label,
    primary: brand.primary,
    primarySoft: brand.primary,
    forest: brand.ink,
    forestMid: brand.dark,
    cta: brand.cta,
    ctaText: brand.ink,
    gold: brand.gold,
    border: "rgba(85,131,103,0.28)",
    headerBg: "rgba(250,248,243,0.94)",
    footerBg: brand.ink,
    faqOpenBg: "#eef5f1",
    primaryRgb: brandRgb.sage,
    ctaRgb: brandRgb.cta,
    darkRgb: brandRgb.dark,
    goldRgb: brandRgb.gold,
    tealRgb: brandRgb.teal,
  };
}

export type Surfaces = ReturnType<typeof getSurfaces>;

/** @deprecated Prefer `brand.*` / `getSurfaces` — aliases for gradual migration */
export const INK = brand.ink;
export const DARK = brand.dark;
export const MAIN = brand.sage;
export const LIGHT = brand.sand;
export const CREAM = brand.cream;
export const ACCENT = brand.cta;
export const GOLD = brand.gold;
export const TEAL = brand.teal;
export const LABEL = brand.label;
export const MAIN_RGB = brandRgb.sage;
export const ACCENT_RGB = brandRgb.cta;
export const DARK_RGB = brandRgb.dark;
export const GOLD_RGB = brandRgb.gold;
export const TEAL_RGB = brandRgb.teal;
