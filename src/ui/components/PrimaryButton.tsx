import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const PrimaryButton = ({ label, onPress, style, variant = 'primary' }: Props) => (
  <Pressable style={[styles.button, styles[variant], style]} onPress={onPress}>
    <Text style={[styles.label, variant !== 'primary' && styles.labelAlt]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    marginVertical: 6,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primaryStrong,
    borderColor: '#0284c7',
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  label: {
    color: '#f8fafc',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  labelAlt: {
    color: colors.text,
  },
});
