import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useEntitlementStore } from '../store/entitlementStore';
import { appStyles, colors, radius, spacing } from '../theme';

const items = [
  { key: 'premium_training', label: 'Premium Training' },
  { key: 'online_video', label: 'Online Video' },
  { key: 'advanced_stats', label: 'Advanced Stats' },
] as const;

export const SettingsScreen = () => {
  const entitlements = useEntitlementStore((s) => s.entitlements);
  const load = useEntitlementStore((s) => s.load);
  const toggle = useEntitlementStore((s) => s.toggle);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Settings</Text>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Switch value={!!entitlements[item.key]} onValueChange={() => toggle(item.key)} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
  },
});
