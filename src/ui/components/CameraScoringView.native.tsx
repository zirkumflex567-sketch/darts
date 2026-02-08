import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, Modal, Image, ScrollView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { createResizePlugin } from 'vision-camera-resize-plugin';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { toByteArray } from 'base64-js';
import { decode as decodeJpeg } from 'jpeg-js';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { ScoringHit } from '../../domain/scoring/types';
import { clamp } from '../../shared/utils';
import { useCameraSettingsStore } from '../store/cameraSettingsStore';
import { applyHomography, computeHomography, Point } from '../utils/homography';
import {
  appendDatasetSample,
  ensureDatasetDir,
  getDatasetDir,
  loadDatasetIndex,
  DatasetSample,
  removeDatasetSample,
} from '../utils/datasetStorage';

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

const { resize } = createResizePlugin();
const DEFAULT_TEST_IMAGE = require('../../../assets/dartboard-default.jpg');
const DEFAULT_TEST_IMAGE_INFO = Image.resolveAssetSource(DEFAULT_TEST_IMAGE);
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
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
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
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [setupMode, setSetupMode] = useState(false);
  const [useSampleImage, setUseSampleImage] = useState(true);
  const [calibrationStep, setCalibrationStep] = useState<number | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<Point[]>([]);
  const [liveZoom, setLiveZoom] = useState(0);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [mlConfidence, setMlConfidence] = useState(0.45);
  const [datasetCount, setDatasetCount] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState<string | null>(null);
  const [pendingSample, setPendingSample] = useState<DatasetSample | null>(null);
  const [annotationPoint, setAnnotationPoint] = useState<Point | null>(null);
  const [annotationLayout, setAnnotationLayout] = useState({ width: 0, height: 0 });
  const [modelStatus, setModelStatus] = useState<string | null>(null);
  const [modelSourceUrl, setModelSourceUrl] = useState<string>('');
  const [sampleStatus, setSampleStatus] = useState<string | null>(null);
  const [sampleDetection, setSampleDetection] = useState<{ x: number; y: number; conf: number } | null>(null);
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [lastSimHit, setLastSimHit] = useState<ScoringHit | null>(null);
  const [debugOverlay, setDebugOverlay] = useState(true);
  const [debugNumbers, setDebugNumbers] = useState(true);
  const [debugZones, setDebugZones] = useState(true);
  const cameraRef = useRef<Camera>(null);
  const pinchStartZoom = useRef(0);

  const { settings, load, update, reset } = useCameraSettingsStore();

  const mlInputSize = 320;
  const MODEL_VERSION = '2026-02-08';
  const modelDir = `${FileSystem.documentDirectory ?? ''}models/`;
  const modelFilename = `dart_tip_${MODEL_VERSION}.tflite`;
  const modelUrl = `${modelDir}${modelFilename}`;
  const MODEL_REMOTE_URL = `https://h-town.duckdns.org/models/${modelFilename}`;
  const tflite = useTensorflowModel({ url: modelSourceUrl });
  const mlModel = tflite.state === 'loaded' ? tflite.model : undefined;
  const mlReady = tflite.state === 'loaded';
  const KP_MODEL_VERSION = '2026-02-08';
  const kpModelFilename = `board_kp_${KP_MODEL_VERSION}.tflite`;
  const kpModelUrl = `${modelDir}${kpModelFilename}`;
  const KP_MODEL_REMOTE_URL = `https://h-town.duckdns.org/models/${kpModelFilename}`;
  const [kpModelSourceUrl, setKpModelSourceUrl] = useState<string>('');
  const [kpModelStatus, setKpModelStatus] = useState<string | null>(null);
  const kpTflite = useTensorflowModel({ url: kpModelSourceUrl });
  const kpModel = kpTflite.state === 'loaded' ? kpTflite.model : undefined;

  const autoScanValue = useSharedValue(0);
  const baselineRequest = useSharedValue(0);
  const centerXValue = useSharedValue(settings.centerX);
  const centerYValue = useSharedValue(settings.centerY);
  const scaleValue = useSharedValue(settings.scale);
  const sampleImageWidth = DEFAULT_TEST_IMAGE_INFO?.width ?? 1;
  const sampleImageHeight = DEFAULT_TEST_IMAGE_INFO?.height ?? 1;

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    const ensureModel = async () => {
      try {
        if (!FileSystem.documentDirectory) {
          if (mounted) setModelStatus('Kein lokales Dateisystem verfügbar');
          return;
        }
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
        const info = await FileSystem.getInfoAsync(modelUrl);
        if (info.exists) {
          if (mounted) {
            setModelSourceUrl(modelUrl);
            setModelStatus('Modell bereit');
          }
          return;
        }
        if (mounted) setModelStatus('Modell wird geladen...');
        const download = await FileSystem.downloadAsync(MODEL_REMOTE_URL, modelUrl);
        if (download.status !== 200) {
          if (mounted) setModelStatus('Modell Download fehlgeschlagen');
          return;
        }
        if (mounted) {
          setModelSourceUrl(modelUrl);
          setModelStatus('Modell geladen');
        }
      } catch (err) {
        if (mounted) setModelStatus('Modell konnte nicht geladen werden');
      }
    };
    void ensureModel();
    return () => {
      mounted = false;
    };
  }, [modelDir, modelUrl, MODEL_REMOTE_URL]);

  const ensureKeypointModel = useCallback(async () => {
    if (!FileSystem.documentDirectory) {
      setKpModelStatus('Kein lokales Dateisystem verfügbar');
      return false;
    }
    try {
      await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
      const info = await FileSystem.getInfoAsync(kpModelUrl);
      if (info.exists) {
        setKpModelSourceUrl(kpModelUrl);
        setKpModelStatus('Keypoint Modell bereit');
        return true;
      }
      setKpModelStatus('Keypoint Modell wird geladen...');
      const download = await FileSystem.downloadAsync(KP_MODEL_REMOTE_URL, kpModelUrl);
      if (download.status !== 200) {
        setKpModelStatus('Keypoint Download fehlgeschlagen');
        return false;
      }
      setKpModelSourceUrl(kpModelUrl);
      setKpModelStatus('Keypoint Modell geladen');
      return true;
    } catch {
      setKpModelStatus('Keypoint Modell konnte nicht geladen werden');
      return false;
    }
  }, [KP_MODEL_REMOTE_URL, kpModelUrl, modelDir]);

  useEffect(() => {
    let mounted = true;
    void loadDatasetIndex().then((items) => {
      if (!mounted) return;
      setDatasetCount(items.length);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) return;
  }, [hasPermission]);

  useEffect(() => {
    if (calibrationStep === null) {
      setCalibrationDraft([]);
    }
  }, [calibrationStep]);

  useEffect(() => {
    setLiveZoom(settings.zoom);
  }, [settings.zoom]);

  useEffect(() => {
    autoScanValue.value = autoScan ? 1 : 0;
  }, [autoScan, autoScanValue]);

  useEffect(() => {
    centerXValue.value = settings.centerX;
    centerYValue.value = settings.centerY;
    scaleValue.value = settings.scale;
  }, [centerXValue, centerYValue, scaleValue, settings.centerX, settings.centerY, settings.scale]);

  const ready = useMemo(
    () =>
      cameraLayout.width > 0 &&
      cameraLayout.height > 0 &&
      (useSampleImage || (hasPermission && device !== null)),
    [cameraLayout.height, cameraLayout.width, device, hasPermission, useSampleImage]
  );

  const format = useMemo(() => {
    const formats = device?.formats ?? [];
    if (formats.length === 0) return undefined;
    return formats.reduce((best, current) => {
      if (!best) return current;
      const bestPixels = (best.videoWidth ?? 0) * (best.videoHeight ?? 0);
      const currentPixels = (current.videoWidth ?? 0) * (current.videoHeight ?? 0);
      return currentPixels > bestPixels ? current : best;
    }, formats[0]);
  }, [device]);

  const onCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  const onTouch = (event: any) => {
    if (!ready) return;
    const { locationX, locationY } = event.nativeEvent;
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

  const analyzeSampleImage = useCallback(async () => {
    if (!mlModel) {
      setSampleStatus('ML Modell nicht bereit');
      return;
    }
    try {
      setSampleStatus('Analysiere Testbild...');
      setSampleDetection(null);
      const asset = Asset.fromModule(DEFAULT_TEST_IMAGE);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = toByteArray(base64);
      const decoded = decodeJpeg(bytes, { useTArray: true });
      const srcW = decoded.width || sampleImageWidth;
      const srcH = decoded.height || sampleImageHeight;
      const src = decoded.data;
      const input = new Float32Array(mlInputSize * mlInputSize * 3);
      for (let y = 0; y < mlInputSize; y += 1) {
        const srcY = Math.min(srcH - 1, Math.floor((y / mlInputSize) * srcH));
        for (let x = 0; x < mlInputSize; x += 1) {
          const srcX = Math.min(srcW - 1, Math.floor((x / mlInputSize) * srcW));
          const srcIdx = (srcY * srcW + srcX) * 4;
          const dstIdx = (y * mlInputSize + x) * 3;
          input[dstIdx] = src[srcIdx] / 255;
          input[dstIdx + 1] = src[srcIdx + 1] / 255;
          input[dstIdx + 2] = src[srcIdx + 2] / 255;
        }
      }
      const outputs = await mlModel.run([input]);
      if (!outputs || outputs.length === 0) {
        setSampleStatus('Keine ML Ausgabe');
        return;
      }
      const output = outputs[0] as any;
      const decode = (arr: any, inputSize: number, threshold: number) => {
        let bestConf = 0;
        let bestX = 0;
        let bestY = 0;
        const len = arr.length ?? 0;
        if (len % 6 === 0) {
          for (let i = 0; i < len; i += 6) {
            const conf = arr[i + 4];
            if (conf > bestConf) {
              bestConf = conf;
              bestX = arr[i];
              bestY = arr[i + 1];
            }
          }
        } else if (len % 84 === 0) {
          const stride = len / 84;
          for (let i = 0; i < stride; i += 1) {
            const x = arr[i];
            const y = arr[i + stride];
            let cls = 0;
            for (let c = 4; c < 84; c += 1) {
              const score = arr[i + c * stride];
              if (score > cls) cls = score;
            }
            if (cls > bestConf) {
              bestConf = cls;
              bestX = x;
              bestY = y;
            }
          }
        }
        if (bestConf < threshold) return null;
        let nx = bestX;
        let ny = bestY;
        if (nx > 1 || ny > 1) {
          nx = nx / inputSize;
          ny = ny / inputSize;
        }
        if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
        return { nx, ny, conf: bestConf };
      };
      const detection = decode(output, mlInputSize, mlConfidence);
      if (!detection) {
        setSampleStatus('Keine Erkennung im Testbild');
        return;
      }
      setSampleDetection({ x: detection.nx, y: detection.ny, conf: detection.conf });
      setSampleStatus(`Erkennung: ${(detection.conf * 100).toFixed(1)}%`);
    } catch (err) {
      setSampleStatus('Testbild-Analyse fehlgeschlagen');
    }
  }, [mlConfidence, mlModel, mlInputSize, sampleImageHeight, sampleImageWidth]);

  const autoCalibrateFromSample = useCallback(async () => {
    if (!kpModel) {
      const ok = await ensureKeypointModel();
      if (!ok) return;
      setSampleStatus('Keypoint Modell lädt, bitte erneut starten');
      return;
    }
    if (cameraLayout.width === 0 || cameraLayout.height === 0) {
      setSampleStatus('Layout nicht bereit');
      return;
    }
    try {
      setSampleStatus('Auto-Kalibrierung läuft...');
      const asset = Asset.fromModule(DEFAULT_TEST_IMAGE);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = toByteArray(base64);
      const decoded = decodeJpeg(bytes, { useTArray: true });
      const srcW = decoded.width || sampleImageWidth;
      const srcH = decoded.height || sampleImageHeight;
      const src = decoded.data;
      const input = new Float32Array(mlInputSize * mlInputSize * 3);
      for (let y = 0; y < mlInputSize; y += 1) {
        const srcY = Math.min(srcH - 1, Math.floor((y / mlInputSize) * srcH));
        for (let x = 0; x < mlInputSize; x += 1) {
          const srcX = Math.min(srcW - 1, Math.floor((x / mlInputSize) * srcW));
          const srcIdx = (srcY * srcW + srcX) * 4;
          const dstIdx = (y * mlInputSize + x) * 3;
          input[dstIdx] = src[srcIdx] / 255;
          input[dstIdx + 1] = src[srcIdx + 1] / 255;
          input[dstIdx + 2] = src[srcIdx + 2] / 255;
        }
      }
      const outputs = await kpModel.run([input]);
      if (!outputs || outputs.length === 0) {
        setSampleStatus('Keine Keypoint Ausgabe');
        return;
      }
      const output = outputs[0] as any;
      const len = output.length ?? 0;
      if (len < 8) {
        setSampleStatus('Keypoint Ausgabe zu klein');
        return;
      }
      const points: Point[] = [];
      for (let i = 0; i < 8; i += 2) {
        let x = Number(output[i]);
        let y = Number(output[i + 1]);
        if (x > 1 || y > 1) {
          x = x / mlInputSize;
          y = y / mlInputSize;
        }
        if (x < 0 || y < 0 || x > 1 || y > 1) {
          setSampleStatus('Keypoint ausserhalb');
          return;
        }
        points.push({ x, y });
      }
      if (points.length !== 4) {
        setSampleStatus('Keypoint Anzahl falsch');
        return;
      }
      const cx = points.reduce((sum, p) => sum + p.x, 0) / 4;
      const cy = points.reduce((sum, p) => sum + p.y, 0) / 4;
      const dists = points.map((p) => {
        const dx = (p.x - cx) * cameraLayout.width;
        const dy = (p.y - cy) * cameraLayout.height;
        return Math.sqrt(dx * dx + dy * dy);
      });
      const avgDist = dists.reduce((sum, d) => sum + d, 0) / dists.length;
      const scale = avgDist / (Math.min(cameraLayout.width, cameraLayout.height) / 2);
      const dxTop = (points[0].x - cx) * cameraLayout.width;
      const dyTop = (cy - points[0].y) * cameraLayout.height;
      const degTop = (Math.atan2(dyTop, dxTop) * 180) / Math.PI;
      const rotationDeg = Number((degTop - 90).toFixed(1));
      await update({
        calibrationPoints: points,
        centerX: cx,
        centerY: cy,
        scale: clamp(scale, SCALE_MIN, SCALE_MAX),
        rotationDeg,
      });
      setSampleStatus('Auto-Kalibrierung gesetzt');
      setCalibrationStep(null);
      setCalibrationDraft([]);
    } catch {
      setSampleStatus('Auto-Kalibrierung fehlgeschlagen');
    }
  }, [
    cameraLayout.height,
    cameraLayout.width,
    ensureKeypointModel,
    kpModel,
    mlInputSize,
    sampleImageHeight,
    sampleImageWidth,
    update,
  ]);

  const captureDatasetSample = useCallback(async () => {
    if (!cameraRef.current) return;
    setDatasetStatus('Capture laeuft...');
    try {
      await ensureDatasetDir();
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableAutoStabilization: true,
        qualityPrioritization: 'quality',
      });
      const sourcePath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const id = `${Date.now()}`;
      const fileName = `sample_${id}.jpg`;
      const destination = `${getDatasetDir()}${fileName}`;
      await FileSystem.copyAsync({ from: sourcePath, to: destination });

      const sample: DatasetSample = {
        id,
        fileName,
        uri: destination,
        width: photo.width ?? 0,
        height: photo.height ?? 0,
        capturedAt: new Date().toISOString(),
        settingsSnapshot: {
          centerX: settings.centerX,
          centerY: settings.centerY,
          scale: settings.scale,
          rotationDeg: settings.rotationDeg,
          calibrationPoints: settings.calibrationPoints,
        },
      };
      setPendingSample(sample);
      setAnnotationPoint(null);
      setDatasetStatus('Tap zum markieren der Dartspitze');
    } catch {
      setDatasetStatus('Capture fehlgeschlagen');
    }
  }, [settings]);

  const onAnnotationLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setAnnotationLayout({ width, height });
  };

  const onAnnotationTap = (event: any) => {
    if (!pendingSample) return;
    const { locationX, locationY } = event.nativeEvent;
    const { width: containerW, height: containerH } = annotationLayout;
    const imageW = pendingSample.width || containerW;
    const imageH = pendingSample.height || containerH;
    if (containerW === 0 || containerH === 0) return;
    const scale = Math.min(containerW / imageW, containerH / imageH);
    const displayW = imageW * scale;
    const displayH = imageH * scale;
    const offsetX = (containerW - displayW) / 2;
    const offsetY = (containerH - displayH) / 2;
    const nx = (locationX - offsetX) / displayW;
    const ny = (locationY - offsetY) / displayH;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    setAnnotationPoint({ x: nx, y: ny });
  };

  const saveAnnotation = useCallback(async () => {
    if (!pendingSample) return;
    if (!annotationPoint) {
      setDatasetStatus('Bitte Dartspitze markieren');
      return;
    }
    const sample: DatasetSample = {
      ...pendingSample,
      annotation: { x: annotationPoint.x, y: annotationPoint.y },
    };
    const count = await appendDatasetSample(sample);
    setDatasetCount(count);
    setPendingSample(null);
    setAnnotationPoint(null);
    setDatasetStatus(`Gespeichert (${count})`);
  }, [annotationPoint, pendingSample]);

  const discardAnnotation = useCallback(async () => {
    if (!pendingSample) return;
    try {
      await FileSystem.deleteAsync(pendingSample.uri, { idempotent: true });
      const count = await removeDatasetSample(pendingSample.id);
      setDatasetCount(count);
    } catch {
      // ignore
    } finally {
      setPendingSample(null);
      setAnnotationPoint(null);
      setDatasetStatus('Verworfen');
    }
  }, [pendingSample]);

  const reportBaseline = useCallback((ok: boolean) => {
    setDetectStatus(ok ? 'Baseline gespeichert' : 'Baseline fehlgeschlagen');
  }, []);

  const reportDetection = useCallback(
    (nx: number, ny: number) => {
      const hit = computeHit(
        nx * cameraLayout.width,
        ny * cameraLayout.height,
        cameraLayout.width,
        cameraLayout.height,
        settings
      );
      if (!hit) {
        setDetectStatus('Treffer ausserhalb');
        return;
      }
      setDetectStatus(`Auto: ${hit.multiplier}${hit.segment} (${hit.points})`);
      onDetect(hit);
    },
    [cameraLayout.height, cameraLayout.width, onDetect, settings]
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      // persistent state inside worklet runtime
      // eslint-disable-next-line no-undef
      const state = global.__dartsmindRealtimeState || {
        baselineBuffer: null,
        lastBaselineRequest: 0,
        lastHitTs: 0,
      };
      // eslint-disable-next-line no-undef
      global.__dartsmindRealtimeState = state;

      if (autoScanValue.value !== 1) return;

      const now = Date.now();
      if (state.lastHitTs && now - state.lastHitTs < 1400) {
        return;
      }

      if (mlEnabled && mlModel) {
        const resized = resize(frame, {
          width: mlInputSize,
          height: mlInputSize,
          pixelFormat: 'rgb',
          dataType: 'float32',
        });
        if (!resized) return;

        for (let i = 0; i < resized.length; i++) {
          resized[i] = resized[i] / 255;
        }

        const outputs = mlModel.runSync([resized]);
        if (!outputs || outputs.length === 0) return;
        const output = outputs[0];

        const decode = (arr, inputSize, threshold) => {
          'worklet';
          let bestConf = 0;
          let bestX = 0;
          let bestY = 0;
          const len = arr.length;
          if (len % 6 === 0) {
            for (let i = 0; i < len; i += 6) {
              const conf = arr[i + 4];
              if (conf > bestConf) {
                bestConf = conf;
                bestX = arr[i];
                bestY = arr[i + 1];
              }
            }
          } else if (len % 84 === 0) {
            const stride = len / 84;
            for (let i = 0; i < stride; i++) {
              const x = arr[i];
              const y = arr[i + stride];
              let cls = 0;
              for (let c = 4; c < 84; c++) {
                const score = arr[i + c * stride];
                if (score > cls) cls = score;
              }
              if (cls > bestConf) {
                bestConf = cls;
                bestX = x;
                bestY = y;
              }
            }
          }
          if (bestConf < threshold) return null;
          let nx = bestX;
          let ny = bestY;
          if (nx > 1 || ny > 1) {
            nx = nx / inputSize;
            ny = ny / inputSize;
          }
          if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
          return { nx, ny, conf: bestConf };
        };

        const detection = decode(output, mlInputSize, mlConfidence);
        if (!detection) return;
        runOnJS(reportDetection)(detection.nx, detection.ny);
        state.lastHitTs = now;
        return;
      }

      const width = 96;
      const height = 96;
      const resized = resize(frame, {
        width,
        height,
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });

      if (!resized) return;

      if (baselineRequest.value !== state.lastBaselineRequest) {
        state.baselineBuffer = resized;
        state.lastBaselineRequest = baselineRequest.value;
        runOnJS(reportBaseline)(true);
        return;
      }

      if (!state.baselineBuffer) {
        state.baselineBuffer = resized;
        runOnJS(reportBaseline)(true);
        return;
      }

      const base = state.baselineBuffer;
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      const threshold = 26;
      const minCount = 20;
      const maxCount = 1400;
      const step = 2;
      const centerX = centerXValue.value * width;
      const centerY = centerYValue.value * height;
      const radius = (Math.min(width, height) / 2) * scaleValue.value;
      const radiusSq = radius * radius;

      for (let y = 0; y < height; y += step) {
        const dy = centerY - y;
        for (let x = 0; x < width; x += step) {
          const dx = x - centerX;
          if (dx * dx + dy * dy > radiusSq * 1.05) continue;
          const idx = (y * width + x) * 3;
          const diff =
            Math.abs(resized[idx] - base[idx]) +
            Math.abs(resized[idx + 1] - base[idx + 1]) +
            Math.abs(resized[idx + 2] - base[idx + 2]);
          if (diff < threshold * 3) continue;
          sumX += x;
          sumY += y;
          count += 1;
        }
      }

      if (count < minCount || count > maxCount) return;

      const nx = sumX / count / width;
      const ny = sumY / count / height;
      runOnJS(reportDetection)(nx, ny);
      state.baselineBuffer = resized;
      state.lastHitTs = now;
    },
    [
      autoScanValue,
      baselineRequest,
      centerXValue,
      centerYValue,
      reportBaseline,
      reportDetection,
      scaleValue,
      mlEnabled,
      mlModel,
      mlInputSize,
      mlConfidence,
    ]
  );

  if (!useSampleImage && !hasPermission) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Kamera-Berechtigung erforderlich.</Text>
        <Pressable style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Berechtigung erteilen</Text>
        </Pressable>
      </View>
    );
  }

  if (!useSampleImage && !device) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Keine Kamera gefunden.</Text>
      </View>
    );
  }

  const zoomMin = device?.minZoom ?? 1;
  const zoomMax = device?.maxZoom ?? 1;
  const zoomValue = zoomMin + (zoomMax - zoomMin) * clamp(liveZoom, 0, 1);

  const crossLeft = cameraLayout.width * settings.centerX - 8;
  const crossTop = cameraLayout.height * settings.centerY - 8;
  const boardRadius = (Math.min(cameraLayout.width, cameraLayout.height) / 2) * settings.scale;
  const boardLeft = cameraLayout.width * settings.centerX - boardRadius;
  const boardTop = cameraLayout.height * settings.centerY - boardRadius;
  const hasCalibration = settings.calibrationPoints && settings.calibrationPoints.length === 4;
  const calibrationLabels = ['20 (oben)', '6 (rechts)', '3 (unten)', '11 (links)'];
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

  const markerPosition = useMemo(() => {
    if (!pendingSample || !annotationPoint) return null;
    const containerW = annotationLayout.width;
    const containerH = annotationLayout.height;
    const imageW = pendingSample.width || containerW;
    const imageH = pendingSample.height || containerH;
    if (containerW === 0 || containerH === 0) return null;
    const scale = Math.min(containerW / imageW, containerH / imageH);
    const displayW = imageW * scale;
    const displayH = imageH * scale;
    const offsetX = (containerW - displayW) / 2;
    const offsetY = (containerH - displayH) / 2;
    return {
      left: offsetX + annotationPoint.x * displayW - 6,
      top: offsetY + annotationPoint.y * displayH - 6,
    };
  }, [annotationLayout.height, annotationLayout.width, annotationPoint, pendingSample]);

  const sampleMarkerPosition = useMemo(() => {
    if (!useSampleImage || !sampleDetection) return null;
    const containerW = cameraLayout.width;
    const containerH = cameraLayout.height;
    if (containerW === 0 || containerH === 0) return null;
    const imageW = sampleImageWidth;
    const imageH = sampleImageHeight;
    const scale = Math.min(containerW / imageW, containerH / imageH);
    const displayW = imageW * scale;
    const displayH = imageH * scale;
    const offsetX = (containerW - displayW) / 2;
    const offsetY = (containerH - displayH) / 2;
    return {
      left: offsetX + sampleDetection.x * displayW - 6,
      top: offsetY + sampleDetection.y * displayH - 6,
    };
  }, [
    cameraLayout.height,
    cameraLayout.width,
    sampleDetection,
    sampleImageHeight,
    sampleImageWidth,
    useSampleImage,
  ]);

  return (
    <View style={styles.container}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
        <View style={styles.cameraWrapper} onLayout={onCameraLayout}>
          {useSampleImage ? (
            <Image source={DEFAULT_TEST_IMAGE} style={styles.camera} resizeMode="contain" />
          ) : (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive
              zoom={zoomValue}
              format={format}
              frameProcessor={frameProcessor}
              frameProcessorFps={mlEnabled ? 4 : 6}
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
            {sampleMarkerPosition && (
              <View
                pointerEvents="none"
                style={[
                  styles.detectionMarker,
                  {
                    left: sampleMarkerPosition.left,
                    top: sampleMarkerPosition.top,
                  },
                ]}
              />
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
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <View style={styles.row}>
          <Text style={styles.panelTitle}>Kamera Setup</Text>
          <Pressable style={styles.toggle} onPress={() => setSetupMode((prev) => !prev)}>
            <Text style={styles.toggleText}>{setupMode ? 'Fertig' : 'Anpassen'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>
          Aufloesung: {format?.videoWidth ?? '-'}x{format?.videoHeight ?? '-'}
        </Text>
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
          <Text style={styles.label}>Realtime Autoscoring</Text>
          <Text style={styles.meta}>Auto-Scan verarbeitet Frames live im Hintergrund.</Text>
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                if (useSampleImage) {
                  setDetectStatus('Auto-Scan im Testbild-Modus deaktiviert.');
                  return;
                }
                baselineRequest.value += 1;
                setDetectStatus('Baseline anfordern...');
              }}
            >
              <Text>Baseline</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                if (useSampleImage) {
                  setDetectStatus('Auto-Scan im Testbild-Modus deaktiviert.');
                  return;
                }
                const next = !autoScan;
                setAutoScan(next);
                setDetectStatus(next ? 'Auto aktiv' : 'Auto aus');
              }}
            >
              <Text>{autoScan ? 'Auto Stop' : 'Auto Start'}</Text>
            </Pressable>
          </View>
          {detectStatus && <Text style={styles.meta}>{detectStatus}</Text>}
        </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>ML Autoscoring (YOLO)</Text>
          <Text style={styles.meta}>
            Modell: {mlReady ? 'bereit' : tflite.state === 'error' ? 'fehlt' : tflite.state}
          </Text>
          {modelStatus && <Text style={styles.meta}>Model-Status: {modelStatus}</Text>}
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => {
                if (useSampleImage) {
                  setDetectStatus('ML Live-Scan im Testbild-Modus deaktiviert.');
                  return;
                }
                if (!mlReady) {
                  setDetectStatus('ML Modell fehlt (siehe Pfad unten).');
                  return;
                }
                const next = !mlEnabled;
                setMlEnabled(next);
                if (next && !autoScan) setAutoScan(true);
                setDetectStatus(next ? 'ML aktiv' : 'ML aus');
              }}
            >
              <Text>{mlEnabled ? 'ML Stop' : 'ML Start'}</Text>
            </Pressable>
          </View>
          <View style={styles.adjustRow}>
            <Text style={styles.label}>ML Confidence</Text>
            <View style={styles.controls}>
              <Pressable
                style={styles.controlButton}
                onPress={() => setMlConfidence((prev) => Math.max(0.1, Number((prev - 0.05).toFixed(2))))}
              >
                <Text>-</Text>
              </Pressable>
              <Text>{mlConfidence.toFixed(2)}</Text>
              <Pressable
                style={styles.controlButton}
                onPress={() => setMlConfidence((prev) => Math.min(0.9, Number((prev + 0.05).toFixed(2))))}
              >
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.meta}>Model Pfad: {modelUrl}</Text>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Testbild Analyse</Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={analyzeSampleImage}>
              <Text>Analysieren</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={autoCalibrateFromSample}>
              <Text>Auto-Kalibrieren (ML)</Text>
            </Pressable>
          </View>
          {sampleStatus && <Text style={styles.meta}>{sampleStatus}</Text>}
          {kpModelStatus && <Text style={styles.meta}>{kpModelStatus}</Text>}
        </View>
      </View>
        <View style={styles.adjustRow}>
          <Text style={styles.label}>Dataset Capture</Text>
          <Text style={styles.meta}>Aktuell gespeichert: {datasetCount}</Text>
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={captureDatasetSample}>
              <Text>Capture</Text>
            </Pressable>
            <Text style={styles.meta}>{datasetStatus ?? ''}</Text>
          </View>
        </View>
        <Pressable style={styles.reset} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={!!pendingSample} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.panelTitle}>Annotation</Text>
            <Text style={styles.meta}>Tippe die Dartspitze im Bild an.</Text>
            <Pressable style={styles.annotationCanvas} onPress={onAnnotationTap} onLayout={onAnnotationLayout}>
              {pendingSample && (
                <Image source={{ uri: pendingSample.uri }} style={styles.annotationImage} resizeMode="contain" />
              )}
              {markerPosition && (
                <View
                  style={[
                    styles.annotationMarker,
                    {
                      left: markerPosition.left,
                      top: markerPosition.top,
                    },
                  ]}
                />
              )}
            </Pressable>
            <View style={styles.controls}>
              <Pressable style={styles.controlButton} onPress={discardAnnotation}>
                <Text>Verwerfen</Text>
              </Pressable>
              <Pressable style={styles.controlButton} onPress={saveAnnotation}>
                <Text>Speichern</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  detectionMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.2)',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  annotationCanvas: {
    marginTop: 12,
    width: '100%',
    height: 320,
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
  },
  annotationImage: {
    width: '100%',
    height: '100%',
  },
  annotationMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
