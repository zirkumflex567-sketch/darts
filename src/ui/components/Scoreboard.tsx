import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../../shared/types';

interface Props {
  players: Player[];
  activePlayerId?: string;
  scores?: Record<string, number>;
}

export const Scoreboard = ({ players, activePlayerId, scores }: Props) => (
  <View style={styles.container}>
    {players.map((player) => {
      const isActive = player.id === activePlayerId;
      return (
        <View key={player.id} style={[styles.row, isActive && styles.activeRow]}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.score}>{scores ? scores[player.id] ?? '-' : '-'}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activeRow: {
    backgroundColor: '#e0f2fe',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
});
