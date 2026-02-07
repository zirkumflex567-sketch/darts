import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useEntitlementStore } from '../store/entitlementStore';

export const SettingsScreen = () => {
  const entitlements = useEntitlementStore((s) => s.entitlements);
  const load = useEntitlementStore((s) => s.load);
  const toggle = useEntitlementStore((s) => s.toggle);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text>Premium Training</Text>
        <Switch
          value={!!entitlements.premium_training}
          onValueChange={() => toggle('premium_training')}
        />
      </View>
      <View style={styles.row}>
        <Text>Online Video</Text>
        <Switch value={!!entitlements.online_video} onValueChange={() => toggle('online_video')} />
      </View>
      <View style={styles.row}>
        <Text>Advanced Stats</Text>
        <Switch
          value={!!entitlements.advanced_stats}
          onValueChange={() => toggle('advanced_stats')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
