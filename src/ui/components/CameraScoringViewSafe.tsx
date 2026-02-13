import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { ScoringHit } from '../../domain/scoring/types';
import { clamp } from '../../shared/utils';
import { useCameraSettingsStore } from '../store/cameraSettingsStore';

type Props = { onDetect: (hit: ScoringHit) => void };

const BOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const computeHit = (
  x: number,
  y: number,
  width: number,
  height: number,
  settings: { centerX: number; centerY: number; rotationDeg: number; scale: number }
): ScoringHit | null => {
  const centerX = width * settings.centerX;
  const centerY = height * settings.centerY;
  const dx = x - centerX;
  const dy = centerY - y;
  const radius = (Math.min(width, height) / 2) * settings.scale;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = dist / radius;
  if (r > 1) return null;

  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  const normalized = (90 - deg + settings.rotationDeg + 360) % 360;
  const index = Math.floor(normalized / 18) % 20;
  const segment = BOARD_NUMBERS[index];

  if (r <= 0.05) return { segment: 25, multiplier: 'D', points: 50, source: 'AUTO' };
  if (r <= 0.1) return { segment: 25, multiplier: 'S', points: 25, source: 'AUTO' };
  if (r <= 0.55) return { segment, multiplier: 'S', points: segment, source: 'AUTO' };
  if (r <= 0.65) return { segment, multiplier: 'T', points: segment * 3, source: 'AUTO' };
  if (r <= 0.9) return { segment, multiplier: 'S', points: segment, source: 'AUTO' };
  return { segment, multiplier: 'D', points: segment * 2, source: 'AUTO' };
};

export const CameraScoringView = ({ onDetect }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [setupMode, setSetupMode] = useState(false);
  const { settings, load, update, reset } = useCameraSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  const onTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    if (setupMode) {
      void update({
        centerX: clamp(locationX / cameraLayout.width, 0.05, 0.95),
        centerY: clamp(locationY / cameraLayout.height, 0.05, 0.95),
      });
      return;
    }
    const hit = computeHit(locationX, locationY, cameraLayout.width, cameraLayout.height, settings);
    if (hit) onDetect(hit);
  };

  const boardRadius = useMemo(
    () => (Math.min(cameraLayout.width, cameraLayout.height) / 2) * settings.scale,
    [cameraLayout.width, cameraLayout.height, settings.scale]
  );

  if (!permission?.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Kamera-Berechtigung erforderlich.</Text>
        <Pressable style={styles.button} onPress={() => requestPermission()}>
          <Text style={styles.buttonText}>Berechtigung erteilen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap} onLayout={onLayout}>
        <CameraView style={styles.camera} facing="back" zoom={clamp(settings.zoom, 0, 1)} />
        <Pressable style={styles.touchLayer} onPress={onTap}>
          <View
            style={[
              styles.boardOutline,
              {
                width: boardRadius * 2,
                height: boardRadius * 2,
                left: cameraLayout.width * settings.centerX - boardRadius,
                top: cameraLayout.height * settings.centerY - boardRadius,
              },
            ]}
          />
          <View
            style={[
              styles.crosshair,
              {
                left: cameraLayout.width * settings.centerX - 8,
                top: cameraLayout.height * settings.centerY - 8,
              },
            ]}
          />
        </Pressable>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.title}>Kamera (Safe Mode)</Text>
          <Pressable style={styles.buttonSmall} onPress={() => setSetupMode((v) => !v)}>
            <Text>{setupMode ? 'Fertig' : 'Anpassen'}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Zoom: {settings.zoom.toFixed(2)}</Text>
        <Slider
          value={settings.zoom}
          onValueChange={(v) => void update({ zoom: Number(v.toFixed(2)) })}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
        />

        <Text style={styles.label}>Scale: {settings.scale.toFixed(2)}</Text>
        <Slider
          value={settings.scale}
          onValueChange={(v) => void update({ scale: Number(v.toFixed(2)) })}
          minimumValue={0.2}
          maximumValue={1.8}
          step={0.01}
        />

        <Text style={styles.label}>Rotation: {settings.rotationDeg}°</Text>
        <View style={styles.row}>
          <Pressable style={styles.buttonSmall} onPress={() => void update({ rotationDeg: settings.rotationDeg - 1 })}>
            <Text>-</Text>
          </Pressable>
          <Pressable style={styles.buttonSmall} onPress={() => void update({ rotationDeg: settings.rotationDeg + 1 })}>
            <Text>+</Text>
          </Pressable>
          <Pressable style={styles.buttonSmall} onPress={() => void reset()}>
            <Text>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 12 },
  cameraWrap: { height: 320, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111827' },
  camera: { flex: 1 },
  touchLayer: { ...StyleSheet.absoluteFillObject },
  boardOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.9)',
    borderRadius: 999,
  },
  crosshair: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
  },
  panel: { marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  label: { marginTop: 8, color: '#374151' },
  permission: { padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  permissionText: { marginBottom: 8 },
  button: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSmall: { borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
});
