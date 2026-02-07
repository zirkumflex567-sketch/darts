export interface LobbyMatch {
  id: string;
  title: string;
  mode: 'X01' | 'CRICKET';
  players: number;
  isPrivate: boolean;
}

export const lobbyMatches: LobbyMatch[] = [
  { id: 'm1', title: 'Daily X01', mode: 'X01', players: 2, isPrivate: false },
  { id: 'm2', title: 'Cricket Night', mode: 'CRICKET', players: 3, isPrivate: false },
  { id: 'm3', title: 'Private Duel', mode: 'X01', players: 2, isPrivate: true },
];
