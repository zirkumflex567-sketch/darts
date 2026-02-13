import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { createMatchRepository, createStatsRepository } from '../../data/repositories';
import { MatchRecord, StatsRecord } from '../../shared/types';
import { appStyles, colors, radius, spacing } from '../theme';

const matchRepo = createMatchRepository();
const statsRepo = createStatsRepository();

export const MatchDetailScreen = ({ route }: NativeStackScreenProps<RootStackParamList, 'MatchDetail'>) => {
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [stats, setStats] = useState<StatsRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await matchRepo.load(route.params.matchId);
      if (data) {
        setMatch(data);
        const statsData = await statsRepo.load(data.id);
        setStats(statsData);
      }
    };
    load();
  }, [route.params.matchId]);

  if (!match) {
    return (
      <View style={appStyles.screen}>
        <Text style={styles.meta}>Match nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Match Details</Text>
      <View style={styles.card}>
        <Text style={styles.meta}>Modus: {match.mode}</Text>
        <Text style={styles.meta}>Start: {match.startedAt}</Text>
        <Text style={styles.meta}>Status: {match.status}</Text>
      </View>
      <Text style={styles.section}>Spieler</Text>
      <View style={styles.card}>
        {match.players.map((p) => (
          <Text key={p.id} style={styles.meta}>• {p.name}</Text>
        ))}
      </View>
      <Text style={styles.section}>Stats</Text>
      {stats.length === 0 && <Text style={styles.meta}>Keine Stats gespeichert.</Text>}
      {stats.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.meta}>Player: {match.players.find((p) => p.id === s.playerId)?.name ?? s.playerId}</Text>
          <Text style={styles.meta}>3-Dart Avg: {s.threeDartAverage.toFixed(2)}</Text>
          <Text style={styles.meta}>Checkout Rate: {(s.checkoutRate * 100).toFixed(0)}%</Text>
          <Text style={styles.meta}>Hit Rate: {(s.hitRate * 100).toFixed(0)}%</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    marginBottom: 8,
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 8,
    backgroundColor: colors.surface,
  },
  meta: {
    color: colors.textMuted,
    marginBottom: 4,
  },
});
