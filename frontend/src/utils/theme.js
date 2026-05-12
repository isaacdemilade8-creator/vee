import { useColorScheme } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

/**
 * utils/theme.js
 *
 * Design tokens for the Vee app.
 * Instagram-inspired but with a cleaner, more modern feel.
 */

export const Colors = {
  // Brand
  primary:       '#E1306C', // Instagram pink-red
  primaryLight:  '#F77737', // Gradient orange
  secondary:     '#405DE6', // Instagram purple-blue
  gradient:      ['#833AB4', '#FD1D1D', '#FCAF45'], // Classic IG gradient

  // Neutrals
  white:         '#FFFFFF',
  black:         '#000000',
  background:    '#FAFAFA',
  surface:       '#FFFFFF',
  border:        '#DBDBDB',

  // Text
  textPrimary:   '#262626',
  textSecondary: '#8E8E8E',
  textTertiary:  '#C7C7C7',
  textOnDark:    '#FFFFFF',

  // Semantic
  error:         '#ED4956',
  success:       '#70C050',
  warning:       '#F7C900',
  info:          '#405DE6',

  // Story ring gradient
  storyGradient: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'],
};

export const DarkColors = {
  ...Colors,
  background: '#08090B',
  surface: '#111317',
  surfaceElevated: '#181B21',
  surfaceMuted: '#20242B',
  input: '#191C22',
  border: '#2B3038',
  borderSoft: '#20242B',
  textPrimary: '#F2F4F7',
  textSecondary: '#A8B0BA',
  textTertiary: '#69727F',
  primary: '#FF4D86',
  primaryLight: '#FF9B65',
  primarySoft: '#351824',
  secondary: '#8EA0FF',
  error: '#FF6675',
  success: '#82D883',
  warning: '#FFD166',
  info: '#8EA0FF',
  storyGradient: ['#FF9B65', '#FF4D86', '#8EA0FF'],
};

export function getThemeColors(theme = 'light', systemScheme = 'light') {
  const resolvedTheme = theme === 'system' ? systemScheme : theme;
  return resolvedTheme === 'dark' ? DarkColors : Colors;
}

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const { preferences } = usePreferences();
  const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemScheme === 'dark');

  return {
    colors: getThemeColors(preferences.theme, systemScheme || 'light'),
    isDark,
  };
}

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,

  // Font weights
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};
