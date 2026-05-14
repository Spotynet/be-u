import { useColorScheme } from 'react-native';

export const LightTheme = {
  // Backgrounds
  bg: '#FAF8F3',
  surface: '#FFFFFF',
  surfaceElevated: '#F0EDE6',

  // Brand
  brandDark: '#1F3328',
  brandMuted: '#558367',

  // CTA
  ctaYellow: '#F6C531',
  ctaText: '#12211A',

  // Text
  textPrimary: '#1F3328',
  textSecondary: '#558367',
  textTertiary: '#8A9E90',
  textOnDark: '#FFFFFF',
  textOnYellow: '#12211A',

  // Navigation
  navBarBg: '#1F3328',
  navBarText: '#FFFFFF',
  navBarIcon: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#1F3328',
  tabBarInactive: '#558367',

  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(85,131,103,0.35)',
  inputText: '#1F3328',
  placeholderText: '#8A9E90',

  // UI Elements
  border: 'rgba(85,131,103,0.35)',
  divider: 'rgba(85,131,103,0.2)',
  chipBg: 'rgba(85,131,103,0.12)',
  chipText: '#1F3328',
  chipActiveBg: '#1F3328',
  chipActiveText: '#FFFFFF',
  badgeBg: '#558367',
  badgeText: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(31,51,40,0.08)',

  // Status
  error: '#C0392B',
  errorBg: 'rgba(192,57,43,0.08)',
  success: '#558367',
  successBg: 'rgba(85,131,103,0.1)',

  // Icons
  iconPrimary: '#1F3328',
  iconSecondary: '#558367',
  iconMuted: '#8A9E90',
};

export const DarkTheme: typeof LightTheme = {
  bg: '#0F1A14',
  surface: '#1A2E22',
  surfaceElevated: '#22382A',

  brandDark: '#FAF8F3',
  brandMuted: '#88B89A',

  ctaYellow: '#F6C531',
  ctaText: '#12211A',

  textPrimary: '#FAF8F3',
  textSecondary: '#88B89A',
  textTertiary: '#5A7A65',
  textOnDark: '#FAF8F3',
  textOnYellow: '#12211A',

  navBarBg: '#0A1210',
  navBarText: '#FAF8F3',
  navBarIcon: '#FAF8F3',
  tabBarBg: '#1A2E22',
  tabBarActive: '#F6C531',
  tabBarInactive: '#88B89A',

  inputBg: '#1A2E22',
  inputBorder: 'rgba(136,184,154,0.3)',
  inputText: '#FAF8F3',
  placeholderText: '#5A7A65',

  border: 'rgba(136,184,154,0.25)',
  divider: 'rgba(136,184,154,0.15)',
  chipBg: 'rgba(136,184,154,0.15)',
  chipText: '#FAF8F3',
  chipActiveBg: '#F6C531',
  chipActiveText: '#12211A',
  badgeBg: '#88B89A',
  badgeText: '#0F1A14',
  cardBg: '#1A2E22',
  cardShadow: 'rgba(0,0,0,0.3)',

  error: '#E57373',
  errorBg: 'rgba(229,115,115,0.1)',
  success: '#88B89A',
  successBg: 'rgba(136,184,154,0.1)',

  iconPrimary: '#FAF8F3',
  iconSecondary: '#88B89A',
  iconMuted: '#5A7A65',
};

export type AppTheme = typeof LightTheme;

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
