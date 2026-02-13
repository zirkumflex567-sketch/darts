import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGameStore } from '../store/gameStore';
import { createId } from '../../shared/utils';
import { appStyles, colors, radius, spacing } from '../theme';

export const PlayerSetupScreen = ({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'PlayerSetup'>) => {
  const [playerOne, setPlayerOne] = useState('Player 1');
  const [playerTwo, setPlayerTwo] = useState('Player 2');
  const setPlayers = useGameStore((s) => s.setPlayers);
  const startMatch = useGameStore((s) => s.startMatch);

  const start = async () => {
    setPlayers([
      { id: createId('player'), name: playerOne, isBot: false },
      { id: createId('player'), name: playerTwo, isBot: false },
    ]);
    await startMatch(route.params.mode);
    navigation.navigate('Game');
  };

  return (
    <View style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Spieler einrichten</Text>
      <Text style={styles.label}>Spieler 1</Text>
      <TextInput style={styles.input} value={playerOne} onChangeText={setPlayerOne} placeholderTextColor={colors.textMuted} />
      <Text style={styles.label}>Spieler 2</Text>
      <TextInput style={styles.input} value={playerTwo} onChangeText={setPlayerTwo} placeholderTextColor={colors.textMuted} />
      <PrimaryButton label="Match starten" onPress={start} style={styles.cta} />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 6,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  cta: {
    marginTop: spacing.md,
  },
});
