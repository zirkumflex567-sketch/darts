import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Scoreboard } from '../components/Scoreboard';
import { PrimaryButton } from '../components/PrimaryButton';
import { HitCorrectionModal } from '../components/HitCorrectionModal';

export const GameScreen = () => {
  const match = useGameStore((s) => s.match);
  const mode = useGameStore((s) => s.mode);
  const x01State = useGameStore((s) => s.x01State);
  const cricketState = useGameStore((s) => s.cricketState);
  const hitModalOpen = useGameStore((s) => s.hitModalOpen);
  const currentHit = useGameStore((s) => s.currentHit);
  const applyManualHit = useGameStore((s) => s.applyManualHit);
  const undoLastVisit = useGameStore((s) => s.undoLastVisit);
  const toggleDummyScoring = useGameStore((s) => s.toggleDummyScoring);
  const dummyScoringActive = useGameStore((s) => s.dummyScoringActive);
  const openManualHit = useGameStore((s) => s.openManualHit);
  const closeHitModal = useGameStore((s) => s.closeHitModal);

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kein aktives Match</Text>
      </View>
    );
  }

  const activePlayerId = mode === 'X01' ? x01State?.currentPlayerId : cricketState?.currentPlayerId;
  const scores = mode === 'X01' ? x01State?.remaining : cricketState?.points;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match: {mode}</Text>
      <Scoreboard players={match.players} activePlayerId={activePlayerId} scores={scores} />
      <View style={styles.actions}>
        <PrimaryButton
          label={dummyScoringActive ? 'Autoscoring stoppen' : 'Autoscoring starten'}
          onPress={toggleDummyScoring}
        />
        <PrimaryButton label="Manueller Wurf" onPress={openManualHit} />
        <PrimaryButton label="Undo" onPress={undoLastVisit} />
      </View>
      <HitCorrectionModal
        visible={hitModalOpen}
        hit={currentHit}
        onCancel={closeHitModal}
        onConfirm={applyManualHit}
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  actions: {
    marginTop: 16,
  },
});
