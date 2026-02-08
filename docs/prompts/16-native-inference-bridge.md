# Prompt 16: Native Inference Bridge (Android/iOS)

## Auftrag
Binde ein on-device ML-Modell fuer Dart-Erkennung nativen ein und expose die Ergebnisse an React Native.

## Ziele
- Echtzeit-Inferenz auf dem Device.
- Ergebnisse als Treffer-Events in die App bringen.
- Custom Dev Client ist Voraussetzung.

## Anforderungen
- Android: TFLite Interpreter + CameraX (oder Frame Processor).
- iOS: CoreML + AVFoundation.
- RN Bridge / TurboModule fuer Frame-Outputs.
- Performance-Limit: <200ms pro Treffer.

## Umsetzungsschritte
1. Native Module Skeleton:
   - Android: Kotlin Modul + TFLite Dependency.
   - iOS: Swift Modul + CoreML.
2. Frame Processing:
   - On-frame inference, aber nur wenn Bewegung erkannt.
   - ROI auf das Board beschraenken.
3. Result Mapping:
   - Pixel-Koordinaten -> Board-Segment (Calibration).
   - Event an RN senden (`ScoringProvider`).
4. Dev Client:
   - Expo Dev Client Build (EAS) dokumentieren.

## Akzeptanzkriterien
- Demo-Modell laeuft auf Android.
- Treffer-Events erscheinen in der App.
- Kein Crash bei 60s Dauerbetrieb.

## Output
- Native Code Diffs
- Build-Anweisungen
