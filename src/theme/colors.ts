export const colors = {
  // Brand Colors
  primary: '#6A0DAD', // Purple
  secondary: '#D4AF37', // Gold
  white: '#FFFFFF',
  black: '#0A0A0A',
  
  // Neutral Colors
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic Colors
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export const lightTheme = {
  background: colors.gray50,
  surface: colors.white,
  text: colors.gray900,
  textSecondary: colors.gray600,
  border: colors.gray200,
  primary: colors.primary,
  secondary: colors.secondary,
  error: colors.error,
  icon: colors.gray700,
  isDark: false,
};

export const darkTheme = {
  background: colors.black,
  surface: '#1A1A1A',
  text: colors.white,
  textSecondary: colors.gray400,
  border: colors.gray800,
  primary: '#8A2BE2', // Slightly brighter purple for dark mode contrast
  secondary: colors.secondary,
  error: '#F87171',
  icon: colors.gray300,
  isDark: true,
};

export type Theme = typeof lightTheme;
