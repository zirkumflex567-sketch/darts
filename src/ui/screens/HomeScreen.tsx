import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';

export const HomeScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) => (
  <View style={styles.container}>
    <Text style={styles.title}>Dartsmind MVP</Text>
    <Text style={styles.subtitle}>Autoscoring, Offline-First, Web + Mobile</Text>
    <PrimaryButton label="Neues Match" onPress={() => navigation.navigate('ModeSelect')} />
    <PrimaryButton label="Lobby" onPress={() => navigation.navigate('Lobby')} />
    <PrimaryButton label="Historie" onPress={() => navigation.navigate('History')} />
    <PrimaryButton label="Settings" onPress={() => navigation.navigate('Settings')} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
});
