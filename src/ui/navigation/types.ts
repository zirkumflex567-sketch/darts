export type RootStackParamList = {
  Home: undefined;
  ModeSelect: undefined;
  PlayerSetup: { mode: 'X01' | 'CRICKET' };
  Game: undefined;
  Settings: undefined;
  Lobby: undefined;
  History: undefined;
  MatchDetail: { matchId: string };
};
