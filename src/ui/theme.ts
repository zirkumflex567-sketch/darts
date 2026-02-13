import { StyleSheet } from 'react-native';

export const colors = {
  background: '#0b1220',
  surface: '#111a2e',
  surfaceAlt: '#1a2640',
  card: '#f8fafc',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textOnLight: '#0f172a',
  border: '#273449',
  primary: '#38bdf8',
  primaryStrong: '#0ea5e9',
  success: '#34d399',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
};

export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
});
