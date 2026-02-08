# Prompt 14: Autoscoring Heuristik-PoC

## Auftrag
Erstelle einen minimalen, lokal laufenden Autoscoring-PoC ohne ML. Ziel: Trefferpunkte aus zwei Frames (vor/nach Wurf) heuristisch ableiten.

## Ziele
- Nach jedem Wurf ein Treffer-Event generieren.
- Funktioniert in kontrollierter Umgebung (gute Beleuchtung, stabile Kamera).
- Keine Cloud-Abhaengigkeit.

## Anforderungen
- Frame-Differenzierung (Background Subtraction) zur Bewegungserkennung.
- Bestimme ungefaehren Dart-Tip-Koordinatenpunkt.
- Mappe Koordinaten auf Score-Segment (bestehende Mapping-Logik).
- Fallback auf manuelle Korrektur.

## Umsetzungsschritte
1. Frame Capture:
   - Periodische Einzelbilder der Kamera (z.B. alle 300-500 ms) aufnehmen.
   - Vorher/Nachher Bild speichern.
2. Bewegungserkennung:
   - Pixel-Differenz berechnen (Schwellwert).
   - Groesste Kontur/Cluster als Dart-Region annehmen.
3. Dart-Tip Schaetzung:
   - Kantendetektion oder Hell/Dunkel-Kontrast.
   - Obersten Punkt (in Richtung Wurfachse) als Tip.
4. Koordinaten-Transform:
   - Nutze Kalibrierung (Center/Scale/Rotation) zur Segmentzuordnung.
5. Trigger-Logik:
   - Nur ausloesen wenn Bewegung stoppt.
   - Debounce zwischen Treffer-Events.

## Akzeptanzkriterien
- In Testaufnahmen werden Treffer mit <3s Verzögerung erkannt.
- Falsche Treffer koennen manuell korrigiert werden.
- Kein Crash bei schlechten Lichtverhaeltnissen (Fallback).

## Output
- PoC-Implementierung (Code-Diff)
- Hinweise zu Limitierungen
