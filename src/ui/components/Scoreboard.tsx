import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../../shared/types';
import { colors, radius, spacing } from '../theme';

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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: radius.sm,
  },
  activeRow: {
    backgroundColor: '#0b3552',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
});
