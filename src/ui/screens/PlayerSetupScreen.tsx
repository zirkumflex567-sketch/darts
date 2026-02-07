import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGameStore } from '../store/gameStore';
import { createId } from '../../shared/utils';

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
    <View style={styles.container}>
      <Text style={styles.title}>Spieler einrichten</Text>
      <Text style={styles.label}>Spieler 1</Text>
      <TextInput style={styles.input} value={playerOne} onChangeText={setPlayerOne} />
      <Text style={styles.label}>Spieler 2</Text>
      <TextInput style={styles.input} value={playerTwo} onChangeText={setPlayerTwo} />
      <PrimaryButton label="Match starten" onPress={start} />
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
});
