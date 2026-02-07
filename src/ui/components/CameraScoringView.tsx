import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScoringHit } from '../../domain/scoring/types';

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

interface Props {
  onDetect: (hit: ScoringHit) => void;
}

const computeHit = (x: number, y: number, width: number, height: number): ScoringHit | null => {
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = centerY - y;
  const radius = Math.min(width, height) / 2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = dist / radius;

  if (r > 1.0) return null;

  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  const normalized = (90 - deg + 360) % 360;
  const index = Math.floor(normalized / 18) % 20;
  const segment = BOARD_NUMBERS[index];

  if (r <= 0.05) {
    return { segment: 25, multiplier: 'D', points: 50, source: 'AUTO' };
  }
  if (r <= 0.1) {
    return { segment: 25, multiplier: 'S', points: 25, source: 'AUTO' };
  }
  if (r <= 0.55) {
    return { segment, multiplier: 'S', points: segment, source: 'AUTO' };
  }
  if (r <= 0.65) {
    return { segment, multiplier: 'T', points: segment * 3, source: 'AUTO' };
  }
  if (r <= 0.9) {
    return { segment, multiplier: 'S', points: segment, source: 'AUTO' };
  }
  return { segment, multiplier: 'D', points: segment * 2, source: 'AUTO' };
};

export const CameraScoringView = ({ onDetect }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const ready = useMemo(
    () => permission?.granted && layout.width > 0 && layout.height > 0,
    [permission?.granted, layout.width, layout.height]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  const onTouch = (event: any) => {
    if (!ready) return;
    const { locationX, locationY } = event.nativeEvent;
    const hit = computeHit(locationX, locationY, layout.width, layout.height);
    if (hit) onDetect(hit);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Kamera-Berechtigung erforderlich.</Text>
        <Pressable style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Berechtigung erteilen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <CameraView style={styles.camera} facing="back" />
      <Pressable style={styles.touchLayer} onPress={onTouch}>
        <View style={styles.crosshair} />
        <Text style={styles.hint}>Tippe auf das Board, um einen Treffer zu simulieren</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 16,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshair: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  hint: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permission: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionText: {
    color: '#92400e',
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});
