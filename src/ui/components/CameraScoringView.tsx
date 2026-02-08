import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { CameraView, CameraViewRef, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { ScoringHit } from '../../domain/scoring/types';
import { clamp } from '../../shared/utils';
import { useCameraSettingsStore } from '../store/cameraSettingsStore';

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

interface Props {
  onDetect: (hit: ScoringHit) => void;
}

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
  const radius = Math.min(width, height) / 2;
  const effectiveRadius = radius * settings.scale;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = dist / effectiveRadius;

  if (r > 1.0) return null;

  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  const normalized = (90 - deg + settings.rotationDeg + 360) % 360;
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
  const [setupMode, setSetupMode] = useState(false);
  const cameraRef = useRef<CameraViewRef | null>(null);

  const { settings, load, update, reset } = useCameraSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  const ready = useMemo(
    () => permission?.granted && layout.width > 0 && layout.height > 0,
    [permission?.granted, layout.width, layout.height]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  const selectBestPictureSize = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      if (settings.pictureSize) return;
      const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
      if (!sizes || sizes.length === 0) return;
      const parsed = sizes
        .map((size) => {
          const [w, h] = size.split('x').map((n) => Number(n));
          return { size, area: w * h };
        })
        .sort((a, b) => b.area - a.area);
      await update({ pictureSize: parsed[0].size });
    } catch {
      // ignore
    }
  }, [settings.pictureSize, update]);

  const handleCameraReady = useCallback(() => {
    void selectBestPictureSize();
  }, [selectBestPictureSize]);

  useEffect(() => {
    if (permission?.granted) {
      void selectBestPictureSize();
    }
  }, [permission?.granted, selectBestPictureSize]);

  const onTouch = (event: any) => {
    if (!ready) return;
    const { locationX, locationY } = event.nativeEvent;
    if (setupMode) {
      const centerX = clamp(locationX / layout.width, 0.05, 0.95);
      const centerY = clamp(locationY / layout.height, 0.05, 0.95);
      update({ centerX, centerY });
      return;
    }
    const hit = computeHit(locationX, locationY, layout.width, layout.height, settings);
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

  const crossLeft = layout.width * settings.centerX - 8;
  const crossTop = layout.height * settings.centerY - 8;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        zoom={clamp(settings.zoom, 0, 1)}
        pictureSize={settings.pictureSize}
        onCameraReady={handleCameraReady}
      />
      <Pressable style={styles.touchLayer} onPress={onTouch}>
        <View style={[styles.crosshair, { left: crossLeft, top: crossTop }]} />
        <Text style={styles.hint}>
          {setupMode
            ? 'Setup: Tippe, um Board-Mitte zu setzen'
            : 'Tippe auf das Board, um einen Treffer zu simulieren'}
        </Text>
      </Pressable>
      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.panelTitle}>Kamera Setup</Text>
          <Pressable style={styles.toggle} onPress={() => setSetupMode((prev) => !prev)}>
            <Text style={styles.toggleText}>{setupMode ? 'Fertig' : 'Anpassen'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>Aufloesung: {settings.pictureSize ?? 'auto'}</Text>
        <Text style={styles.label}>Zoom</Text>
        <Slider
          value={settings.zoom}
          onValueChange={(value) => update({ zoom: Number(value.toFixed(2)) })}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          minimumTrackTintColor="#111827"
          maximumTrackTintColor="#d1d5db"
        />
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Skalierung</Text>
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => update({ scale: clamp(settings.scale - 0.05, 0.6, 1.4) })}
            >
              <Text>-</Text>
            </Pressable>
            <Text>{settings.scale.toFixed(2)}</Text>
            <Pressable
              style={styles.controlButton}
              onPress={() => update({ scale: clamp(settings.scale + 0.05, 0.6, 1.4) })}
            >
              <Text>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Rotation</Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={() => update({ rotationDeg: settings.rotationDeg - 1 })}>
              <Text>-</Text>
            </Pressable>
            <Text>{settings.rotationDeg}°</Text>
            <Pressable style={styles.controlButton} onPress={() => update({ rotationDeg: settings.rotationDeg + 1 })}>
              <Text>+</Text>
            </Pressable>
          </View>
        </View>
        <Pressable style={styles.reset} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 16,
  },
  camera: {
    width: '100%',
    height: 320,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  crosshair: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  hint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  panel: {
    backgroundColor: '#f9fafb',
    padding: 12,
  },
  panelTitle: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  label: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  adjustRow: {
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  controlButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  reset: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  resetText: {
    color: '#ffffff',
    textAlign: 'center',
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
