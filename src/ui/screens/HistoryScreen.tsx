import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { useEntitlementStore } from '../store/entitlementStore';
import { appStyles, colors, radius, spacing } from '../theme';

export const HistoryScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'History'>) => {
  const history = useGameStore((s) => s.history);
  const loadHistory = useGameStore((s) => s.loadHistory);
  const entitlements = useEntitlementStore((s) => s.entitlements);
  const loadEntitlements = useEntitlementStore((s) => s.load);

  useEffect(() => {
    loadHistory();
    loadEntitlements();
  }, [loadHistory, loadEntitlements]);

  return (
    <View style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Historie</Text>
      {!entitlements.advanced_stats && (
        <Text style={styles.notice}>Advanced Stats sind gesperrt (Mock-Entitlement).</Text>
      )}
      <FlatList
        data={history}
        ListEmptyComponent={<Text style={styles.empty}>Noch keine Matches gespeichert.</Text>}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })}>
            <Text style={styles.cardTitle}>{item.mode}</Text>
            <Text style={styles.cardMeta}>{item.startedAt}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  notice: {
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
