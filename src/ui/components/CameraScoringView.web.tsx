import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, Image, ScrollView } from 'react-native';
import { CameraView, CameraViewRef, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import { ScoringHit } from '../../domain/scoring/types';
import { clamp } from '../../shared/utils';
import { useCameraSettingsStore } from '../store/cameraSettingsStore';
import { applyHomography, computeHomography, Point } from '../utils/homography';
import { detectDartFromDiff } from '../utils/dartDetection';

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];
const DEFAULT_TEST_IMAGE = require('../../../assets/dartboard-default.jpg');
const SCALE_MIN = 0.2;
const SCALE_MAX = 1.8;

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
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [setupMode, setSetupMode] = useState(false);
  const [useSampleImage, setUseSampleImage] = useState(true);
  const [viewScale, setViewScale] = useState(1);
  const [calibrationStep, setCalibrationStep] = useState<number | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<Point[]>([]);
  const [liveZoom, setLiveZoom] = useState(0);
  const [baselineBase64, setBaselineBase64] = useState<string | null>(null);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [lastSimHit, setLastSimHit] = useState<ScoringHit | null>(null);
  const [debugOverlay, setDebugOverlay] = useState(true);
  const [debugNumbers, setDebugNumbers] = useState(true);
  const [debugZones, setDebugZones] = useState(true);
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
    () =>
      cameraLayout.width > 0 &&
      cameraLayout.height > 0 &&
      (useSampleImage || permission?.granted),
    [cameraLayout.width, cameraLayout.height, permission?.granted, useSampleImage]
  );

  const onCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
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
    const native = event?.nativeEvent ?? event;
    let locationX = native?.locationX;
    let locationY = native?.locationY;
    if (typeof locationX !== 'number' || typeof locationY !== 'number') {
      const clientX = native?.clientX ?? native?.pageX;
      const clientY = native?.clientY ?? native?.pageY;
      const target = event?.currentTarget ?? native?.target;
      if (typeof clientX === 'number' && typeof clientY === 'number' && target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        locationX = clientX - rect.left;
        locationY = clientY - rect.top;
      } else if (typeof native?.offsetX === 'number' && typeof native?.offsetY === 'number') {
        locationX = native.offsetX;
        locationY = native.offsetY;
      }
    }
    if (typeof locationX !== 'number' || typeof locationY !== 'number') return;
    if (calibrationStep !== null) {
      const nextPoint = {
        x: clamp(locationX / cameraLayout.width, 0.02, 0.98),
        y: clamp(locationY / cameraLayout.height, 0.02, 0.98),
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
      const centerX = clamp(locationX / cameraLayout.width, 0.05, 0.95);
      const centerY = clamp(locationY / cameraLayout.height, 0.05, 0.95);
      void update({ centerX, centerY });
      return;
    }
    const hit = computeHit(locationX, locationY, cameraLayout.width, cameraLayout.height, settings);
    if (hit) {
      setLastSimHit(hit);
      setSimStatus(`Sim: ${hit.multiplier}${hit.segment} (${hit.points})`);
      if (!useSampleImage) {
        onDetect(hit);
      }
      return;
    }
    setLastSimHit(null);
    setSimStatus('Sim: ausserhalb');
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

  const onWheel = useCallback(
    (event: any) => {
      if (!useSampleImage) return;
      const delta = event?.nativeEvent?.deltaY ?? event?.deltaY ?? 0;
      const direction = delta > 0 ? -0.05 : 0.05;
      const next = clamp(viewScale + direction, 0.5, 2.5);
      setViewScale(Number(next.toFixed(2)));
    },
    [useSampleImage, viewScale]
  );

  const captureBaseline = useCallback(async () => {
    if (useSampleImage) {
      setDetectStatus('Baseline im Testbild-Modus deaktiviert.');
      return;
    }
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
  }, [useSampleImage]);

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
        detection.x * cameraLayout.width,
        detection.y * cameraLayout.height,
        cameraLayout.width,
        cameraLayout.height,
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
  }, [baselineBase64, cameraLayout.height, cameraLayout.width, onDetect, settings]);

  const runAutoScanTick = useCallback(async () => {
    if (useSampleImage) return;
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
        detection.x * cameraLayout.width,
        detection.y * cameraLayout.height,
        cameraLayout.width,
        cameraLayout.height,
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
  }, [
    baselineBase64,
    cameraLayout.height,
    cameraLayout.width,
    captureBaseline,
    onDetect,
    settings,
    useSampleImage,
  ]);

  useEffect(() => {
    if (!autoScan || useSampleImage) return;
    const interval = setInterval(() => {
      void runAutoScanTick();
    }, 1800);
    return () => clearInterval(interval);
  }, [autoScan, runAutoScanTick, useSampleImage]);

  if (!useSampleImage && !permission?.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Kamera-Berechtigung erforderlich.</Text>
        <Pressable style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Berechtigung erteilen</Text>
        </Pressable>
      </View>
    );
  }

  const crossLeft = cameraLayout.width * settings.centerX - 8;
  const crossTop = cameraLayout.height * settings.centerY - 8;
  const boardRadius = (Math.min(cameraLayout.width, cameraLayout.height) / 2) * settings.scale;
  const boardLeft = cameraLayout.width * settings.centerX - boardRadius;
  const boardTop = cameraLayout.height * settings.centerY - boardRadius;
  const hasCalibration = settings.calibrationPoints && settings.calibrationPoints.length === 4;
  const calibrationLabels = ['20 (oben)', '6 (rechts)', '3 (unten)', '11 (links)'];
  const cameraHeight = useSampleImage ? 320 * viewScale : 320;
  const debugRings = [0.05, 0.1, 0.55, 0.65, 0.9, 1];
  const debugLines = useMemo(() => Array.from({ length: 20 }, (_, i) => settings.rotationDeg + i * 18), [
    settings.rotationDeg,
  ]);
  const debugLabels = useMemo(() => {
    const centerX = cameraLayout.width * settings.centerX;
    const centerY = cameraLayout.height * settings.centerY;
    const radius = boardRadius * 0.98;
    return BOARD_NUMBERS.map((num, i) => {
      const normalized = i * 18 + 9;
      const deg = 90 + settings.rotationDeg - normalized;
      const rad = (deg * Math.PI) / 180;
      return {
        num,
        left: centerX + Math.cos(rad) * radius - 8,
        top: centerY - Math.sin(rad) * radius - 8,
      };
    });
  }, [boardRadius, cameraLayout.height, cameraLayout.width, settings.centerX, settings.centerY, settings.rotationDeg]);
  const zonePaths = useMemo(() => {
    if (cameraLayout.width === 0 || cameraLayout.height === 0) return [];
    const cx = cameraLayout.width * settings.centerX;
    const cy = cameraLayout.height * settings.centerY;
    const zones: { key: string; d: string; fill: string }[] = [];
    const ringDefs = [
      { key: 'singleInner', r0: 0.1, r1: 0.55 },
      { key: 'triple', r0: 0.55, r1: 0.65 },
      { key: 'singleOuter', r0: 0.65, r1: 0.9 },
      { key: 'double', r0: 0.9, r1: 1.0 },
    ];

    const toPoint = (deg: number, r: number) => {
      const rad = (deg * Math.PI) / 180;
      return {
        x: cx + Math.cos(rad) * r,
        y: cy - Math.sin(rad) * r,
      };
    };

    const buildWedgePath = (startN: number, endN: number, rInner: number, rOuter: number) => {
      const startDeg = 90 + settings.rotationDeg - startN;
      const endDeg = 90 + settings.rotationDeg - endN;
      const steps = 6;
      const outer: { x: number; y: number }[] = [];
      const inner: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const deg = startDeg + (endDeg - startDeg) * t;
        outer.push(toPoint(deg, rOuter));
      }
      for (let i = steps; i >= 0; i -= 1) {
        const t = i / steps;
        const deg = startDeg + (endDeg - startDeg) * t;
        inner.push(toPoint(deg, rInner));
      }
      const points = [...outer, ...inner];
      const d = points
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
        .join(' ');
      return `${d} Z`;
    };

    for (let i = 0; i < 20; i += 1) {
      const startN = i * 18;
      const endN = (i + 1) * 18;
      ringDefs.forEach((ring, ringIndex) => {
        const d = buildWedgePath(startN, endN, boardRadius * ring.r0, boardRadius * ring.r1);
        const even = i % 2 === 0;
        const ringShade = ringIndex % 2 === 0 ? 0.22 : 0.14;
        const base = even ? 'rgba(16,185,129,' : 'rgba(239,68,68,';
        zones.push({ key: `${ring.key}-${i}`, d, fill: `${base}${ringShade})` });
      });
    }
    return zones;
  }, [boardRadius, cameraLayout.height, cameraLayout.width, settings.centerX, settings.centerY, settings.rotationDeg]);

  return (
    <View style={styles.container}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
        <View
          style={[styles.cameraWrapper, { height: cameraHeight }]}
          onWheel={onWheel}
          onLayout={onCameraLayout}
        >
          {useSampleImage ? (
            <Image source={DEFAULT_TEST_IMAGE} style={[styles.camera, { height: cameraHeight }]} resizeMode="contain" />
          ) : (
            <CameraView
              ref={cameraRef}
              style={[styles.camera, { height: cameraHeight }]}
              facing="back"
              zoom={clamp(liveZoom, 0, 1)}
              pictureSize={settings.pictureSize}
              onCameraReady={handleCameraReady}
            />
          )}
          <Pressable style={styles.touchLayer} onPress={onTouch}>
            {debugOverlay && (
              <View pointerEvents="none" style={styles.debugOverlay}>
                <Svg height={cameraLayout.height} width={cameraLayout.width} style={StyleSheet.absoluteFillObject}>
                  {debugZones &&
                    zonePaths.map((zone) => (
                      <Path key={zone.key} d={zone.d} fill={zone.fill} stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />
                    ))}
                  {debugZones && (
                    <>
                      <Circle
                        cx={cameraLayout.width * settings.centerX}
                        cy={cameraLayout.height * settings.centerY}
                        r={boardRadius * 0.05}
                        fill="rgba(239,68,68,0.35)"
                      />
                      <Circle
                        cx={cameraLayout.width * settings.centerX}
                        cy={cameraLayout.height * settings.centerY}
                        r={boardRadius * 0.1}
                        fill="rgba(16,185,129,0.2)"
                      />
                    </>
                  )}
                </Svg>
                {debugRings.map((ratio) => (
                  <View
                    key={`ring-${ratio}`}
                    style={[
                      styles.debugRing,
                      {
                        width: boardRadius * 2 * ratio,
                        height: boardRadius * 2 * ratio,
                        left: boardLeft + boardRadius * (1 - ratio),
                        top: boardTop + boardRadius * (1 - ratio),
                      },
                    ]}
                  />
                ))}
                {debugLines.map((deg, index) => (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.debugLine,
                      {
                        left: cameraLayout.width * settings.centerX - 1,
                        top: cameraLayout.height * settings.centerY - boardRadius,
                        height: boardRadius,
                        transform: [{ rotateZ: `${deg}deg` }],
                      },
                    ]}
                  />
                ))}
                {debugNumbers &&
                  debugLabels.map((label) => (
                    <Text key={`label-${label.num}`} style={[styles.debugLabel, { left: label.left, top: label.top }]}>
                      {label.num}
                    </Text>
                  ))}
              </View>
            )}
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
                      left: cameraLayout.width * settings.centerX - 1,
                      top: cameraLayout.height * settings.centerY - boardRadius,
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
                          left: pt.x * cameraLayout.width - 6,
                          top: pt.y * cameraLayout.height - 6,
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
                        left: pt.x * cameraLayout.width - 6,
                        top: pt.y * cameraLayout.height - 6,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {simStatus && <Text style={styles.simBadge}>{simStatus}</Text>}
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
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
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
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Testbild</Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={() => setUseSampleImage((prev) => !prev)}>
              <Text>{useSampleImage ? 'Kamera' : 'Testbild'}</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>{useSampleImage ? 'Testbild aktiv' : 'Kamera aktiv'}</Text>
          {simStatus && <Text style={styles.meta}>{simStatus}</Text>}
        </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Debug Overlay</Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={() => setDebugOverlay((prev) => !prev)}>
              <Text>{debugOverlay ? 'Aus' : 'An'}</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => setDebugNumbers((prev) => !prev)}>
              <Text>{debugNumbers ? 'Nummern aus' : 'Nummern an'}</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => setDebugZones((prev) => !prev)}>
              <Text>{debugZones ? 'Zonen aus' : 'Zonen an'}</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>
            Center: {settings.centerX.toFixed(3)}, {settings.centerY.toFixed(3)} | Scale: {settings.scale.toFixed(3)} |
            Rot: {settings.rotationDeg}°
          </Text>
          <Text style={styles.meta}>Auto-Kalibrierung (ML) nur in der App verfuegbar.</Text>
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
              onPress={() => update({ scale: clamp(settings.scale - 0.05, SCALE_MIN, SCALE_MAX) })}
            >
              <Text>-</Text>
            </Pressable>
            <Text>{settings.scale.toFixed(2)}</Text>
            <Pressable
              style={styles.controlButton}
              onPress={() => update({ scale: clamp(settings.scale + 0.05, SCALE_MIN, SCALE_MAX) })}
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
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                if (useSampleImage) {
                  setDetectStatus('Auto-Scan im Testbild-Modus deaktiviert.');
                  return;
                }
                setAutoScan((prev) => !prev);
              }}
            >
              <Text>{autoScan ? 'Auto Stop' : 'Auto Start'}</Text>
            </Pressable>
            <Text style={styles.meta}>{autoScan ? 'Auto aktiv' : 'Auto aus'}</Text>
          </View>
          {detectStatus && <Text style={styles.meta}>{detectStatus}</Text>}
        </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>ML Autoscoring</Text>
          <Text style={styles.meta}>
            Im Web nicht verfuegbar. Native App mit Dev-Client erforderlich.
          </Text>
        </View>
        <Pressable style={styles.reset} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </ScrollView>
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
  cameraWrapper: {
    width: '100%',
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
  debugOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  boardOutline: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.7)',
    borderWidth: 2,
    borderRadius: 999,
  },
  debugRing: {
    position: 'absolute',
    borderColor: 'rgba(59,130,246,0.7)',
    borderWidth: 1,
    borderRadius: 999,
  },
  debugLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(59,130,246,0.7)',
  },
  debugLabel: {
    position: 'absolute',
    color: '#111827',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 20,
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
  simBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(251,191,36,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  panel: {
    backgroundColor: '#f9fafb',
    maxHeight: 360,
  },
  panelContent: {
    padding: 12,
    paddingBottom: 16,
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
