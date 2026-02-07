import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { ScoringHit } from '../../domain/scoring/types';

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
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={segment}
            onChangeText={setSegment}
          />
          <Text style={styles.label}>Multiplikator</Text>
          <View style={styles.row}>
            {(['S', 'D', 'T'] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.choice, multiplier === m && styles.choiceActive]}
                onPress={() => setMultiplier(m)}
              >
                <Text style={styles.choiceText}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text>Abbrechen</Text>
            </Pressable>
            <Pressable style={styles.confirm} onPress={submit}>
              <Text style={styles.confirmText}>Uebernehmen</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  choiceActive: {
    backgroundColor: '#111827',
  },
  choiceText: {
    color: '#111827',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancel: {
    padding: 10,
  },
  confirm: {
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 8,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
