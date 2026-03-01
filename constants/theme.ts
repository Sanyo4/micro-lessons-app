export const Colors = {
  // Warm latte palette
  background: '#F5F0EB',
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceSolid: '#FFFFFF',
  frosted: 'rgba(255, 255, 255, 0.6)',
  frostedBorder: 'rgba(255, 255, 255, 0.3)',
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  danger: '#C0392B',
  dangerLight: '#FADBD8',
  warning: '#D4A017',
  warningLight: '#FDF2D0',
  success: '#1E8449',
  successLight: '#D5F5E3',
  aiBubble: '#EAE2D9',
  aiBubbleBorder: '#D7CCC8',
  text: '#3E2C23',
  textSecondary: '#7A6458',
  textMuted: '#A8998E',
  border: '#E0D5CC',
  shadow: '#3E2C23',
  xpGold: '#D4A017',
  levelPurple: '#8B5CF6',
  menuBg: 'rgba(255, 255, 255, 0.55)',
  menuBorder: 'rgba(255, 255, 255, 0.35)',
  voicePulse: 'rgba(13, 148, 136, 0.2)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  body: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const CategoryColors: Record<string, { bg: string; icon: string }> = {
  coffee: { bg: '#FEF3C7', icon: '#92400E' },
  food: { bg: '#DBEAFE', icon: '#1E40AF' },
  transport: { bg: '#E0E7FF', icon: '#3730A3' },
  entertainment: { bg: '#FCE7F3', icon: '#9D174D' },
};

export const CategoryIcons: Record<string, string> = {
  coffee: '☕',
  food: '🍕',
  transport: '🚌',
  entertainment: '🎬',
};
