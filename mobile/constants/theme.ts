/**
 * Theme colors and typography for the Be-U mobile app
 * Following the Mobile Standards for consistent theming
 */

import {Platform} from "react-native";

// Brand colors - Purple/Magenta theme
const primaryColor = "#8b5cf6"; // Purple/Magenta
const primaryForeground = "#ffffff";

export const Colors = {
  light: {
    // Core colors - Clean whites and light grays
    background: "#ffffff",
    foreground: "#1f2937",
    card: "#ffffff",
    cardForeground: "#1f2937",

    // Brand colors - Purple/Magenta
    primary: primaryColor,
    primaryForeground: primaryForeground,

    // Secondary colors - Light purple tints
    secondary: "#f3f4f6",
    secondaryForeground: "#1f2937",

    // Muted colors - Very light grays
    muted: "#f9fafb",
    mutedForeground: "#6b7280",

    // Accent colors - Light purple accent
    accent: "#f3f4f6",
    accentForeground: "#1f2937",

    // Destructive colors
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    // Success colors
    success: "#10b981",
    successForeground: "#ffffff",

    // Border and input - Light borders
    border: "#e5e7eb",
    input: "#f3f4f6",

    // Ring (focus) - Purple focus ring
    ring: primaryColor,

    // Tab navigation
    tint: primaryColor,
    tabIconDefault: "#6b7280",
    tabIconSelected: primaryColor,
  },
  dark: {
    // Core colors - Dark theme (prepared for future use)
    background: "#0f172a",
    foreground: "#f8fafc",
    card: "#1e293b",
    cardForeground: "#f8fafc",

    // Brand colors - Same purple for consistency
    primary: primaryColor,
    primaryForeground: primaryForeground,

    // Secondary colors
    secondary: "#1e293b",
    secondaryForeground: "#f8fafc",

    // Muted colors
    muted: "#1e293b",
    mutedForeground: "#94a3b8",

    // Accent colors
    accent: "#1e293b",
    accentForeground: "#f8fafc",

    // Destructive colors
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    // Success colors
    success: "#10b981",
    successForeground: "#ffffff",

    // Border and input
    border: "#334155",
    input: "#334155",

    // Ring (focus)
    ring: primaryColor,

    // Tab navigation
    tint: primaryColor,
    tabIconDefault: "#94a3b8",
    tabIconSelected: primaryColor,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
