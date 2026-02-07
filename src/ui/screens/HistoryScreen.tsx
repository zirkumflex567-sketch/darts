import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { useEntitlementStore } from '../store/entitlementStore';

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
    <View style={styles.container}>
      <Text style={styles.title}>Historie</Text>
      {!entitlements.advanced_stats && (
        <Text style={styles.notice}>Advanced Stats sind gesperrt (Mock-Entitlement).</Text>
      )}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.mode}</Text>
            <Text style={styles.cardMeta}>{item.startedAt}</Text>
          </Pressable>
        )}
      />
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
  notice: {
    color: '#b45309',
    marginBottom: 12,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
});
