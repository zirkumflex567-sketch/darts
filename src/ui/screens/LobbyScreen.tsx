import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Switch } from 'react-native';
import { lobbyMatches } from '../../data/mocks/lobby';
import { useEntitlementStore } from '../store/entitlementStore';
import { PrimaryButton } from '../components/PrimaryButton';
import { appStyles, colors, radius, spacing } from '../theme';

export const LobbyScreen = () => {
  const [joinCode, setJoinCode] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const entitlements = useEntitlementStore((s) => s.entitlements);
  const loadEntitlements = useEntitlementStore((s) => s.load);

  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements]);

  return (
    <View style={appStyles.screen}>
      <Text style={appStyles.sectionTitle}>Lobby (Mock)</Text>
      <Text style={styles.section}>Öffentliche Matches</Text>
      <FlatList
        data={lobbyMatches.filter((m) => !m.isPrivate)}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Keine offenen Lobbies gefunden.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.mode} · {item.players} Spieler</Text>
          </View>
        )}
      />

      <Text style={styles.section}>Privates Match beitreten</Text>
      <TextInput
        style={styles.input}
        placeholder="Join-Code"
        placeholderTextColor={colors.textMuted}
        value={joinCode}
        onChangeText={setJoinCode}
      />
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Video aktivieren</Text>
        <Switch
          value={videoEnabled}
          onValueChange={(val) => {
            if (!entitlements.online_video) return;
            setVideoEnabled(val);
          }}
        />
      </View>
      {!entitlements.online_video && <Text style={styles.notice}>Video ist gesperrt (Mock-Entitlement).</Text>}
      <PrimaryButton label="Join (Mock)" onPress={() => undefined} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.sm,
    marginBottom: 8,
    fontWeight: '700',
    color: colors.text,
  },
  empty: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rowLabel: {
    color: colors.text,
  },
  notice: {
    marginTop: 8,
    color: colors.warning,
  },
});
