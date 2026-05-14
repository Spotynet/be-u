/**
 * Centralized theme system for Nabbi mobile app
 * Supports light/dark modes with semantic color tokens.
 */

import { useColorScheme } from 'react-native';

export const LightTheme = {
  // Brand
  primary: '#1F3328',         // brandDark
  secondary: '#558367',       // brandMuted
  accent: '#F6C531',          // ctaYellow
  
  // Backgrounds
  bg: '#FAF8F3',              // Primary background
  background: '#FAF8F3',      // Alias for compatibility
  contentBackground: '#FAF8F3', // Alias for compatibility
  surface: '#FFFFFF',         // Card/surface background
  card: '#FFFFFF',            // Alias for compatibility
  surfaceElevated: '#F0EDE6',

  // Text
  foreground: '#1F3328',      // textPrimary
  textPrimary: '#1F3328',
  textSecondary: '#558367',
  textTertiary: '#8A9E90',
  textOnDark: '#FFFFFF',
  textOnYellow: '#12211A',
  primaryForeground: '#FFFFFF',

  // Brand specific
  brandDark: '#1F3328',
  brandMuted: '#558367',
  ctaYellow: '#F6C531',
  ctaText: '#12211A',

  // Navigation
  navBarBg: '#1F3328',
  navBarText: '#FFFFFF',
  navBarIcon: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#1F3328',
  tabBarInactive: '#558367',

  // Inputs
  inputBg: '#FFFFFF',
  input: '#FFFFFF',           // Alias
  inputBorder: 'rgba(85,131,103,0.35)',
  inputText: '#1F3328',
  placeholderText: '#8A9E90',

  // UI Elements
  border: 'rgba(85,131,103,0.35)',
  divider: 'rgba(85,131,103,0.2)',
  chipBg: 'rgba(85,131,103,0.12)',
  muted: 'rgba(85,131,103,0.12)', // Alias
  chipText: '#1F3328',
  mutedForeground: '#558367',    // Alias
  chipActiveBg: '#1F3328',
  chipActiveText: '#FFFFFF',
  badgeBg: '#558367',
  badgeText: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(31,51,40,0.08)',

  // Status
  error: '#C0392B',
  destructive: '#C0392B',     // Alias
  errorBg: 'rgba(192,57,43,0.08)',
  success: '#558367',
  successBg: 'rgba(85,131,103,0.1)',
  successForeground: '#FFFFFF',

  // Icons
  iconPrimary: '#1F3328',
  iconSecondary: '#558367',
  iconMuted: '#8A9E90',
  white: '#FFFFFF',
  black: '#12211A',
};

export const DarkTheme: typeof LightTheme = {
  // Brand
  primary: '#F6C531',         // In dark mode, yellow acts as primary brand highlight
  secondary: '#88B89A',
  accent: '#F6C531',

  // Backgrounds
  bg: '#0F1A14',
  background: '#0F1A14',
  contentBackground: '#0F1A14',
  surface: '#1A2E22',
  card: '#1A2E22',
  surfaceElevated: '#22382A',

  // Text
  foreground: '#FAF8F3',
  textPrimary: '#FAF8F3',
  textSecondary: '#88B89A',
  textTertiary: '#5A7A65',
  textOnDark: '#FAF8F3',
  textOnYellow: '#12211A',
  primaryForeground: '#12211A', // Dark text on light brand background

  // Brand specific
  brandDark: '#FAF8F3',
  brandMuted: '#88B89A',
  ctaYellow: '#F6C531',
  ctaText: '#12211A',

  // Navigation
  navBarBg: '#0A1210',
  navBarText: '#FAF8F3',
  navBarIcon: '#FAF8F3',
  tabBarBg: '#1A2E22',
  tabBarActive: '#F6C531',
  tabBarInactive: '#88B89A',

  // Inputs
  inputBg: '#1A2E22',
  input: '#1A2E22',
  inputBorder: 'rgba(136,184,154,0.3)',
  inputText: '#FAF8F3',
  placeholderText: '#5A7A65',

  // UI Elements
  border: 'rgba(136,184,154,0.25)',
  divider: 'rgba(136,184,154,0.15)',
  chipBg: 'rgba(136,184,154,0.15)',
  muted: 'rgba(136,184,154,0.15)',
  chipText: '#FAF8F3',
  mutedForeground: '#88B89A',
  chipActiveBg: '#F6C531',
  chipActiveText: '#12211A',
  badgeBg: '#88B89A',
  badgeText: '#0F1A14',
  cardBg: '#1A2E22',
  cardShadow: 'rgba(0,0,0,0.3)',

  // Status
  error: '#E57373',
  destructive: '#E57373',
  errorBg: 'rgba(229,115,115,0.1)',
  success: '#88B89A',
  successBg: 'rgba(136,184,154,0.1)',
  successForeground: '#0F1A14',

  // Icons
  iconPrimary: '#FAF8F3',
  iconSecondary: '#88B89A',
  iconMuted: '#5A7A65',
  white: '#FFFFFF',
  black: '#12211A',
};

export type AppTheme = typeof LightTheme;

/** Maps color scheme names to tokens — used across screens via `Colors[scheme]`. */
export const Colors = {
  light: LightTheme,
  dark: DarkTheme,
} as const;

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
