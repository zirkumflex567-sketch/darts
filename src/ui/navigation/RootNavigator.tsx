import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
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
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const appNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

export const RootNavigator = () => (
  <NavigationContainer theme={appNavigationTheme}>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
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
