import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGameStore } from '../store/gameStore';

export const ModeSelectScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'ModeSelect'>) => {
  const setMode = useGameStore((s) => s.setMode);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modus waehlen</Text>
      <PrimaryButton
        label="X01 (MVP)"
        onPress={() => {
          setMode('X01');
          navigation.navigate('PlayerSetup', { mode: 'X01' });
        }}
      />
      <PrimaryButton
        label="Cricket"
        onPress={() => {
          setMode('CRICKET');
          navigation.navigate('PlayerSetup', { mode: 'CRICKET' });
        }}
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
});
