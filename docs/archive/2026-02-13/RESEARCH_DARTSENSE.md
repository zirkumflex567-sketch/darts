# Research: Dart Sense / DartSense

Stand: 2026-02-08

## Ziel
Zentrale Zusammenfassung externer Referenzen zum Thema Autoscoring bzw. Dart-Scoring-Apps, inkl. Lessons Learned und Implikationen fuer unsere App.

## Quellen
Dart Sense (autoscoring, computer vision, YOLO):
```
https://github.com/bnww/dart-sense
```

DartSense (Voice Score Entry, nicht Kamera):
```
https://dartsense.com/
https://apps.apple.com/us/app/dartsense-darts-with-voice/id6470947519
```

## 1) Dart Sense (GitHub, bnww/dart-sense)

### Kurzbeschreibung
- Autoscoring per Kamera mit Deep Learning.
- Lokale Score-Berechnung in einer Python-App, die den Kamera-Stream vom Smartphone verarbeitet.
- Board-Kalibrierung ueber 4 Referenzpunkte, um Koordinaten in ein Standard-Board zu transformieren.
- GUI und Game-Logik fuer X01/Cricket; unterstuetzt mehrere Spieler.

### Pipeline (High-Level)
1. Video-Stream vom Smartphone (z.B. IP Webcam).
2. YOLOv8 Object Detection erkennt:
   - Dart-Positionen (Tip / Landepunkt)
   - 4 Board-Kalibrierungspunkte
3. Homographie/Transformation: Board-Referenzpunkte werden auf Standard-Board gemappt.
4. Score-Logik mappt Dart-Koordinaten auf Segmente.
5. GUI / Game-Logik fuer Scoring und Turn-Handling.

### Kalibrierung
- Vier Punkte sind explizit festgelegt (Ecken bestimmter Double-Segmente: 20, 6, 3, 11).
- Diese 4 Punkte definieren die Board-Transformation und erlauben robuste Erkennung trotz Winkel/Distanz.

### Daten & Training
- Datensatz: ~16k Images aus McNally et al. 2021 + ~8k eigene/YouTube/Setup-Daten.
- Preprocessing: Resize auf 800x800, Sharpening bei Low-Res.
- Split: Train 75%, Val 10%, Test 15%.
- Labeling: LabelImg, YOLO-Format, Bounding Boxes auf 2.5% Groesse normalisiert.
- Modell: YOLOv8n (nano) fuer Echtzeit, Hyperparameter-Tuning.

### Ergebnisse und Limits
- Gute Kennzahlen im Test (Precision/Recall aus dem Paper-Abschnitt in README).
- Hauptrisiko: Obfuscation des Dart-Tips; selbst Menschen koennen Treffer nicht immer 100% sicher sehen.
- Ein alternativer heuristischer Ansatz (Hough/Color) wurde probiert, war aber zu fehleranfaellig.

### Lizenz / Nutzung
- Lizenz: nicht-kommerziell, nicht-distributable.
- Code/Modelle duerfen nicht direkt in ein kommerzielles Produkt uebernommen werden.

## 2) DartSense (Voice Input, keine Kamera)

### Kurzbeschreibung
- DartSense ist eine Score-Tracking App mit Voice Input (kein Autoscoring per Kamera).
- Fokus: Sprachsteuerung fuer Score-Eingabe, Training und Statistik.
- Relevanz fuer uns: UI/Flow Inspiration fuer Score-Input und Trainingsmodi, aber keine CV-Referenz.

## 3) Konkrete Implikationen fuer unsere App

### Technisch
- YOLOv8n (oder aehnliche Nano-Modelle) sind realistisch fuer Echtzeit.
- Board-Transformation mit 4 Kalibrierungspunkten ist robust und portierbar.
- Datenvielfalt ist zentral (Winkel, Licht, Board-Typen, Dart-Typen).
- Heuristische Ansatze ohne ML sind fehleranfaellig.

### Produkt
- Multi-Player Support (bis 6) ist ein etabliertes Feature in Dart Sense.
- Autoscoring muss robuste manuelle Korrektur erlauben.
- Ein Setup-Flow mit Kalibrierung ist Pflicht.

### Risiko
- Lizenzierung verhindert direkte Uebernahme von Dart Sense Code/Modellen.
- Eigener Datensatz und eigenes Modell sind notwendig.

## 4) Offene Aufgaben (abgeleitet)
- Aufbau eigener Datenerfassung in der App (Frame Dump).
- Annotation-Pipeline definieren (COCO/YOLO) + Labeling Workflow.
- Prototyp: TFLite/CoreML Inference + Board-Homographie + Score-Mapping.
- Evaluationssuite fuer Treffgenauigkeit in unserem Setup (Poco X6).
