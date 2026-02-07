import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Switch } from 'react-native';
import { lobbyMatches } from '../../data/mocks/lobby';
import { useEntitlementStore } from '../store/entitlementStore';

export const LobbyScreen = () => {
  const [joinCode, setJoinCode] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const entitlements = useEntitlementStore((s) => s.entitlements);
  const loadEntitlements = useEntitlementStore((s) => s.load);

  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lobby (Mock)</Text>
      <Text style={styles.section}>Oeffentliche Matches</Text>
      <FlatList
        data={lobbyMatches.filter((m) => !m.isPrivate)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.mode} · {item.players} Spieler</Text>
          </View>
        )}
      />
      <Text style={styles.section}>Privates Match beitreten</Text>
      <TextInput
        style={styles.input}
        placeholder="Join-Code"
        value={joinCode}
        onChangeText={setJoinCode}
      />
      <View style={styles.row}>
        <Text>Video aktivieren</Text>
        <Switch
          value={videoEnabled}
          onValueChange={(val) => {
            if (!entitlements.online_video) return;
            setVideoEnabled(val);
          }}
        />
      </View>
      {!entitlements.online_video && (
        <Text style={styles.notice}>Video ist gesperrt (Mock-Entitlement).</Text>
      )}
      <Pressable style={styles.joinButton}>
        <Text style={styles.joinText}>Join (Mock)</Text>
      </Pressable>
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '700',
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  notice: {
    marginTop: 8,
    color: '#b45309',
  },
  joinButton: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  joinText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
