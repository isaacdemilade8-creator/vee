import { useColorScheme } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

/**
 * utils/theme.js
 *
 * Design tokens for the Vee app.
 * A bright social palette with editorial surfaces and polished contrast.
 */

export const Colors = {
  // Brand
  primary:       '#00A99D',
  primaryLight:  '#54D6C7',
  primarySoft:   '#DDF8F4',
  secondary:     '#FF6B4A',
  accent:        '#F8C945',
  gradient:      ['#00A99D', '#54D6C7', '#F8C945'],

  // Neutrals
  white:         '#FFFFFF',
  black:         '#071013',
  background:    '#F4F7F5',
  surface:       '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted:  '#EAF1EE',
  input:         '#EDF3F0',
  border:        '#D9E4DF',
  borderSoft:    '#E8EFEC',

  // Text
  textPrimary:   '#10201D',
  textSecondary: '#65746F',
  textTertiary:  '#A5B0AC',
  textOnDark:    '#FFFFFF',

  // Semantic
  error:         '#F04E5E',
  success:       '#19A974',
  warning:       '#F8C945',
  info:          '#3E7CB1',

  // Story ring gradient
  storyGradient: ['#00A99D', '#F8C945', '#FF6B4A'],
};

export const DarkColors = {
  ...Colors,
  background: '#071013',
  surface: '#101B1A',
  surfaceElevated: '#162422',
  surfaceMuted: '#20312E',
  input: '#172522',
  border: '#29403B',
  borderSoft: '#1E312D',
  textPrimary: '#F2FAF8',
  textSecondary: '#A8B9B4',
  textTertiary: '#667C76',
  primary: '#54D6C7',
  primaryLight: '#8AE8DD',
  primarySoft: '#113A36',
  secondary: '#FF8A6E',
  accent: '#F8C945',
  error: '#FF6675',
  success: '#80D8B4',
  warning: '#F8C945',
  info: '#8ABFEA',
  storyGradient: ['#54D6C7', '#F8C945', '#FF8A6E'],
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
