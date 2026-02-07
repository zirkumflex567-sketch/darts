import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { createMatchRepository, createStatsRepository } from '../../data/repositories';
import { MatchRecord, StatsRecord } from '../../shared/types';

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
      <View style={styles.container}>
        <Text>Match nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Match Details</Text>
      <Text>Modus: {match.mode}</Text>
      <Text>Start: {match.startedAt}</Text>
      <Text>Status: {match.status}</Text>
      <Text style={styles.section}>Spieler</Text>
      {match.players.map((p) => (
        <Text key={p.id}>- {p.name}</Text>
      ))}
      <Text style={styles.section}>Stats</Text>
      {stats.length === 0 && <Text>Keine Stats gespeichert.</Text>}
      {stats.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text>Player: {match.players.find((p) => p.id === s.playerId)?.name ?? s.playerId}</Text>
          <Text>3-Dart Avg: {s.threeDartAverage.toFixed(2)}</Text>
          <Text>Checkout Rate: {(s.checkoutRate * 100).toFixed(0)}%</Text>
          <Text>Hit Rate: {(s.hitRate * 100).toFixed(0)}%</Text>
        </View>
      ))}
    </ScrollView>
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
  section: {
    marginTop: 16,
    fontWeight: '700',
  },
  card: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 8,
  },
});
