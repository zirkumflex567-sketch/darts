import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGameStore } from '../store/gameStore';
import { appStyles, colors, spacing } from '../theme';

export const ModeSelectScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'ModeSelect'>) => {
  const setMode = useGameStore((s) => s.setMode);

  return (
    <View style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Modus wählen</Text>
      <Text style={styles.copy}>Wähle den Spielmodus für dein nächstes Match.</Text>

      <PrimaryButton
        label="X01 (MVP)"
        onPress={() => {
          setMode('X01');
          navigation.navigate('PlayerSetup', { mode: 'X01' });
        }}
      />
      <PrimaryButton
        label="Cricket"
        variant="secondary"
        onPress={() => {
          setMode('CRICKET');
          navigation.navigate('PlayerSetup', { mode: 'CRICKET' });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  copy: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
