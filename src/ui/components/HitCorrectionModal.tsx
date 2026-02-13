import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { ScoringHit } from '../../domain/scoring/types';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  hit?: ScoringHit | null;
  onConfirm: (hit: ScoringHit) => void;
  onCancel: () => void;
}

export const HitCorrectionModal = ({ visible, hit, onConfirm, onCancel }: Props) => {
  const [segment, setSegment] = useState('');
  const [multiplier, setMultiplier] = useState<'S' | 'D' | 'T'>('S');

  useEffect(() => {
    if (hit) {
      setSegment(String(hit.segment));
      setMultiplier(hit.multiplier);
    }
  }, [hit]);

  if (!hit) return null;

  const submit = () => {
    const seg = Number(segment);
    const mult = multiplier;
    const points = seg * (mult === 'S' ? 1 : mult === 'D' ? 2 : 3);
    onConfirm({
      segment: seg,
      multiplier: mult,
      points,
      source: 'MANUAL',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Treffer korrigieren</Text>
          <Text style={styles.label}>Segment (1-20 oder 25)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={segment} onChangeText={setSegment} />
          <Text style={styles.label}>Multiplikator</Text>
          <View style={styles.row}>
            {(['S', 'D', 'T'] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.choice, multiplier === m && styles.choiceActive]}
                onPress={() => setMultiplier(m)}
              >
                <Text style={[styles.choiceText, multiplier === m && styles.choiceTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={styles.confirm} onPress={submit}>
              <Text style={styles.confirmText}>Übernehmen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 6,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  choiceActive: {
    backgroundColor: colors.primaryStrong,
    borderColor: '#0284c7',
  },
  choiceText: {
    color: colors.text,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#f8fafc',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cancel: {
    padding: 10,
  },
  cancelText: {
    color: colors.textMuted,
  },
  confirm: {
    backgroundColor: colors.primaryStrong,
    padding: 10,
    borderRadius: radius.sm,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
