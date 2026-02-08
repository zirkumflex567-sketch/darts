# Prompt 15: ML Dataset & Training Pipeline

## Auftrag
Baue eine klare Pipeline fuer Datenerfassung, Annotation und Modelltraining fuer Dart-Erkennung.

## Ziele
- Reproduzierbare Datensammlung vom echten Setup.
- Trainingsdaten fuer Dart-Tip-Detection.
- Export nach TFLite (Android) und CoreML (iOS).

## Anforderungen
- Datenerfassung direkt aus der App (Frame Dump).
- Annotation-Format: COCO oder YOLO.
- Augmentierungen fuer Licht, Winkel, Occlusion.
- Saubere Trennung in Train/Val/Test.

## Umsetzungsschritte
1. Datenerfassung in App:
   - Debug-Mode, der Frames speichert (PNG/JPEG) + Metadata.
   - Ordnerstruktur pro Session.
2. Annotation:
   - Export in COCO/YOLO.
   - Annotations-Tool vorschlagen (Label Studio/Roboflow).
3. Training:
   - Basismodell YOLOv8n oder MobileNet-SSD.
   - Trainings-Config dokumentieren.
4. Export:
   - TFLite (quantisiert), CoreML (fp16).
   - Versionierung der Modelle.

## Akzeptanzkriterien
- Datenpipeline laesst sich auf VPS ausfuehren.
- Ein kleines Demo-Modell laesst sich trainieren und exportieren.

## Output
- Doku und Scripts
- Beispiel-Config
