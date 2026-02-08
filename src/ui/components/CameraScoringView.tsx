import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { CameraView, CameraViewRef, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { ScoringHit } from '../../domain/scoring/types';
import { clamp } from '../../shared/utils';
import { useCameraSettingsStore } from '../store/cameraSettingsStore';
import { applyHomography, computeHomography, Point } from '../utils/homography';
import { detectDartFromDiff } from '../utils/dartDetection';

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
  settings: {
    centerX: number;
    centerY: number;
    rotationDeg: number;
    scale: number;
    calibrationPoints?: Point[];
  }
): ScoringHit | null => {
  let dx = 0;
  let dy = 0;
  let r = 0;

  if (settings.calibrationPoints && settings.calibrationPoints.length === 4) {
    const src = settings.calibrationPoints.map((pt) => ({
      x: pt.x * width,
      y: pt.y * height,
    }));
    const dst: Point[] = [
      { x: 0, y: 1 }, // 20 (oben)
      { x: 1, y: 0 }, // 6 (rechts)
      { x: 0, y: -1 }, // 3 (unten)
      { x: -1, y: 0 }, // 11 (links)
    ];
    const homography = computeHomography(src, dst);
    const projected = homography ? applyHomography(homography, { x, y }) : null;
    if (!projected) return null;
    dx = projected.x;
    dy = projected.y;
    r = Math.sqrt(dx * dx + dy * dy);
  } else {
    const centerX = width * settings.centerX;
    const centerY = height * settings.centerY;
    dx = x - centerX;
    dy = centerY - y;
    const radius = Math.min(width, height) / 2;
    const effectiveRadius = radius * settings.scale;
    const dist = Math.sqrt(dx * dx + dy * dy);
    r = dist / effectiveRadius;
  }

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
  const [calibrationStep, setCalibrationStep] = useState<number | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<Point[]>([]);
  const [liveZoom, setLiveZoom] = useState(0);
  const [baselineBase64, setBaselineBase64] = useState<string | null>(null);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const scanInFlight = useRef(false);
  const lastHitAt = useRef<number | null>(null);
  const cameraRef = useRef<CameraViewRef | null>(null);
  const pinchStartZoom = useRef(0);

  const { settings, load, update, reset } = useCameraSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (calibrationStep === null) {
      setCalibrationDraft([]);
    }
  }, [calibrationStep]);

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
    if (calibrationStep !== null) {
      const nextPoint = {
        x: clamp(locationX / layout.width, 0.02, 0.98),
        y: clamp(locationY / layout.height, 0.02, 0.98),
      };
      const nextDraft = [...calibrationDraft, nextPoint];
      if (calibrationStep >= 3) {
        void update({ calibrationPoints: nextDraft });
        setCalibrationStep(null);
        setCalibrationDraft([]);
      } else {
        setCalibrationDraft(nextDraft);
        setCalibrationStep(calibrationStep + 1);
      }
      return;
    }
    if (setupMode) {
      const centerX = clamp(locationX / layout.width, 0.05, 0.95);
      const centerY = clamp(locationY / layout.height, 0.05, 0.95);
      void update({ centerX, centerY });
      return;
    }
    const hit = computeHit(locationX, locationY, layout.width, layout.height, settings);
    if (hit) onDetect(hit);
  };

  useEffect(() => {
    setLiveZoom(settings.zoom);
  }, [settings.zoom]);

  const onPinchEvent = useCallback(
    (event: any) => {
      const scale = event.nativeEvent.scale ?? 1;
      const nextZoom = clamp(pinchStartZoom.current + (scale - 1) * 0.3, 0, 1);
      setLiveZoom(nextZoom);
    },
    [setLiveZoom]
  );

  const onPinchStateChange = useCallback(
    (event: any) => {
      const state = event.nativeEvent.state;
      if (state === State.BEGAN) {
        pinchStartZoom.current = liveZoom;
      }
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        void update({ zoom: clamp(liveZoom, 0, 1) });
      }
    },
    [liveZoom, update]
  );

  const captureBaseline = useCallback(async () => {
    if (!cameraRef.current) return;
    setDetectStatus('Baseline erfassen...');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) {
        setDetectStatus('Baseline fehlgeschlagen');
        return;
      }
      setBaselineBase64(photo.base64);
      setDetectStatus('Baseline gespeichert');
    } catch {
      setDetectStatus('Baseline fehlgeschlagen');
    }
  }, []);

  const runDetection = useCallback(async () => {
    if (!cameraRef.current) return;
    if (!baselineBase64) {
      setDetectStatus('Bitte Baseline setzen');
      return;
    }
    setDetectStatus('Scan laeuft...');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) {
        setDetectStatus('Scan fehlgeschlagen');
        return;
      }
      const detection = detectDartFromDiff(baselineBase64, photo.base64, {
        centerX: settings.centerX,
        centerY: settings.centerY,
        scale: settings.scale,
        calibrationPoints: settings.calibrationPoints,
      });
      if (!detection) {
        setDetectStatus('Kein Treffer erkannt');
        return;
      }
      const hit = computeHit(
        detection.x * layout.width,
        detection.y * layout.height,
        layout.width,
        layout.height,
        settings
      );
      if (!hit) {
        setDetectStatus('Treffer ausserhalb');
        return;
      }
      setDetectStatus(`Treffer ${hit.multiplier}${hit.segment} (${hit.points})`);
      onDetect(hit);
      setBaselineBase64(photo.base64);
      lastHitAt.current = Date.now();
    } catch {
      setDetectStatus('Scan fehlgeschlagen');
    }
  }, [baselineBase64, layout.height, layout.width, onDetect, settings]);

  const runAutoScanTick = useCallback(async () => {
    if (!cameraRef.current) return;
    if (scanInFlight.current) return;
    const now = Date.now();
    if (lastHitAt.current && now - lastHitAt.current < 1500) return;

    scanInFlight.current = true;
    try {
      if (!baselineBase64) {
        await captureBaseline();
        return;
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) return;

      const detection = detectDartFromDiff(baselineBase64, photo.base64, {
        centerX: settings.centerX,
        centerY: settings.centerY,
        scale: settings.scale,
        calibrationPoints: settings.calibrationPoints,
      });

      if (!detection) {
        return;
      }

      const hit = computeHit(
        detection.x * layout.width,
        detection.y * layout.height,
        layout.width,
        layout.height,
        settings
      );
      if (!hit) {
        return;
      }
      setDetectStatus(`Auto: ${hit.multiplier}${hit.segment} (${hit.points})`);
      onDetect(hit);
      setBaselineBase64(photo.base64);
      lastHitAt.current = Date.now();
    } finally {
      scanInFlight.current = false;
    }
  }, [baselineBase64, captureBaseline, layout.height, layout.width, onDetect, settings]);

  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(() => {
      void runAutoScanTick();
    }, 1800);
    return () => clearInterval(interval);
  }, [autoScan, runAutoScanTick]);

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
  const boardRadius = (Math.min(layout.width, layout.height) / 2) * settings.scale;
  const boardLeft = layout.width * settings.centerX - boardRadius;
  const boardTop = layout.height * settings.centerY - boardRadius;
  const hasCalibration = settings.calibrationPoints && settings.calibrationPoints.length === 4;
  const calibrationLabels = ['20 (oben)', '6 (rechts)', '3 (unten)', '11 (links)'];

  return (
    <View style={styles.container} onLayout={onLayout}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
        <View>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            zoom={clamp(liveZoom, 0, 1)}
            pictureSize={settings.pictureSize}
            onCameraReady={handleCameraReady}
          />
          <Pressable style={styles.touchLayer} onPress={onTouch}>
            {setupMode && (
              <View pointerEvents="none" style={styles.overlay}>
                <View
                  style={[
                    styles.boardOutline,
                    { left: boardLeft, top: boardTop, width: boardRadius * 2, height: boardRadius * 2 },
                  ]}
                />
                <View
                  style={[
                    styles.boardLine,
                    {
                      left: layout.width * settings.centerX - 1,
                      top: layout.height * settings.centerY - boardRadius,
                      height: boardRadius,
                      transform: [{ rotateZ: `${settings.rotationDeg}deg` }],
                    },
                  ]}
                />
                {hasCalibration && calibrationStep === null &&
                  settings.calibrationPoints?.map((pt, index) => (
                    <View
                      key={`calib-${index}`}
                      style={[
                        styles.calibrationPoint,
                        {
                          left: pt.x * layout.width - 6,
                          top: pt.y * layout.height - 6,
                        },
                      ]}
                    />
                  ))}
                {calibrationDraft.map((pt, index) => (
                  <View
                    key={`draft-${index}`}
                    style={[
                      styles.calibrationPointDraft,
                      {
                        left: pt.x * layout.width - 6,
                        top: pt.y * layout.height - 6,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={[styles.crosshair, { left: crossLeft, top: crossTop }]} />
            <Text style={styles.hint}>
              {calibrationStep !== null
                ? `Kalibrierung: Tippe ${calibrationLabels[calibrationStep]}`
                : setupMode
                  ? 'Setup: Tippe, um Board-Mitte zu setzen'
                  : 'Tippe auf das Board, um einen Treffer zu simulieren'}
            </Text>
          </Pressable>
        </View>
      </PinchGestureHandler>
      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.panelTitle}>Kamera Setup</Text>
          <Pressable style={styles.toggle} onPress={() => setSetupMode((prev) => !prev)}>
            <Text style={styles.toggleText}>{setupMode ? 'Fertig' : 'Anpassen'}</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Text style={styles.meta}>Aufloesung: {settings.pictureSize ?? 'auto'}</Text>
          <Pressable style={styles.refresh} onPress={handleCameraReady}>
            <Text style={styles.refreshText}>Neu</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Zoom</Text>
        <Slider
          value={liveZoom}
          onValueChange={(value) => setLiveZoom(Number(value.toFixed(2)))}
          onSlidingComplete={(value) => update({ zoom: Number(value.toFixed(2)) })}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          minimumTrackTintColor="#111827"
          maximumTrackTintColor="#d1d5db"
        />
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Zoom Fein</Text>
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                const next = clamp(liveZoom - 0.02, 0, 1);
                setLiveZoom(next);
                void update({ zoom: next });
              }}
            >
              <Text>-</Text>
            </Pressable>
            <Text>{liveZoom.toFixed(2)}</Text>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                const next = clamp(liveZoom + 0.02, 0, 1);
                setLiveZoom(next);
                void update({ zoom: next });
              }}
            >
              <Text>+</Text>
            </Pressable>
          </View>
        </View>
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
        <View style={styles.adjustRow}>
          <Text style={styles.label}>4-Punkt Kalibrierung</Text>
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                setCalibrationDraft([]);
                setCalibrationStep(0);
              }}
            >
              <Text>{hasCalibration ? 'Neu' : 'Start'}</Text>
            </Pressable>
            {calibrationStep !== null && (
              <Pressable style={styles.controlButton} onPress={() => setCalibrationStep(null)}>
                <Text>Abbruch</Text>
              </Pressable>
            )}
            {hasCalibration && calibrationStep === null && (
              <Pressable style={styles.controlButton} onPress={() => update({ calibrationPoints: undefined })}>
                <Text>Loeschen</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Autoscoring PoC</Text>
          <Text style={styles.meta}>
            Hand aus dem Bild, dann Baseline setzen und nach dem Wurf scannen.
          </Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={captureBaseline}>
              <Text>Baseline</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={runDetection}>
              <Text>Scan</Text>
            </Pressable>
            <Text style={styles.meta}>{baselineBase64 ? 'Baseline OK' : 'Keine Baseline'}</Text>
          </View>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={() => setAutoScan((prev) => !prev)}>
              <Text>{autoScan ? 'Auto Stop' : 'Auto Start'}</Text>
            </Pressable>
            <Text style={styles.meta}>{autoScan ? 'Auto aktiv' : 'Auto aus'}</Text>
          </View>
          {detectStatus && <Text style={styles.meta}>{detectStatus}</Text>}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  boardOutline: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.7)',
    borderWidth: 2,
    borderRadius: 999,
  },
  boardLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  calibrationPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16,185,129,0.9)',
  },
  calibrationPointDraft: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59,130,246,0.9)',
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
  refresh: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  refreshText: {
    fontSize: 12,
    color: '#111827',
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
