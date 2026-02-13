import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { appStyles, colors, radius, spacing } from '../theme';

export const HomeScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) => (
  <View style={appStyles.screen}>
    <View style={styles.hero}>
      <Text style={appStyles.title}>Dartsmind</Text>
      <Text style={styles.subtitle}>Autoscoring • Offline-First • Web + Mobile</Text>
    </View>

    <View style={styles.actions}>
      <PrimaryButton label="Neues Match" onPress={() => navigation.navigate('ModeSelect')} />
      <PrimaryButton label="Lobby" variant="secondary" onPress={() => navigation.navigate('Lobby')} />
      <PrimaryButton label="Historie" variant="secondary" onPress={() => navigation.navigate('History')} />
      <PrimaryButton label="Settings" variant="ghost" onPress={() => navigation.navigate('Settings')} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  actions: {
    marginTop: 22,
  },
});
