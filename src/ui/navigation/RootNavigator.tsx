import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { PlayerSetupScreen } from '../screens/PlayerSetupScreen';
import { GameScreen } from '../screens/GameScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MatchDetailScreen } from '../screens/MatchDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dartsmind' }} />
      <Stack.Screen name="ModeSelect" component={ModeSelectScreen} options={{ title: 'Modus' }} />
      <Stack.Screen name="PlayerSetup" component={PlayerSetupScreen} options={{ title: 'Spieler' }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Match' }} />
      <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Lobby' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Historie' }} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ title: 'Match Details' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
