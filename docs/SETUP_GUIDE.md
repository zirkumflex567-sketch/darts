# Kamera-Setup & Kalibrierung (H-Town)

Stand: 2026-02-08

## Ziel
Das Board im Live-Preview korrekt ausrichten, sodass Trefferpunkte stabil und reproduzierbar berechnet werden. Diese Anleitung ist fuer das reale Setup mit Poco X6 (Kamera-Position wie in `docs/IMG_20260208_014519.jpg`).

## Voraussetzungen
- App mit aktiviertem Kamera-Preview
- Stabile Kamera-Montage (keine Bewegung)
- Gleichmaessiges Licht ohne starke Reflexionen

## Quick-Start (empfohlen)
1. App oeffnen und in den Kamera-Modus wechseln.
2. `Anpassen` aktivieren.
3. **Zoom:** Board soll ~70% der Bildhoehe einnehmen.
   - Nutze Slider oder Pinch-Geste.
4. **Board-Mitte setzen:** Tippe einmal auf das Bull (Mittelpunkt).
5. **Skalierung anpassen:** Der Kreis-Overlay soll exakt am Boardrand liegen.
6. **Rotation anpassen:** Linie auf 12 Uhr (Segment 20) ausrichten.

## 4-Punkt Kalibrierung (praeziser)
Diese Option korrigiert Perspektiven und Winkel.

1. `Anpassen` aktivieren.
2. `4-Punkt Kalibrierung -> Start`
3. Tippe nacheinander auf den **aeusseren Double-Ring** der folgenden Segmente:
   1) 20 (oben)
   2) 6 (rechts)
   3) 3 (unten)
   4) 11 (links)
4. Nach dem 4. Tap wird die Transformation gespeichert.
5. Optional: Rotation minimal feinjustieren.

## Tipps
- Wenn das Board elliptisch erscheint (schraeger Winkel), immer die 4-Punkt-Kalibrierung verwenden.
- Bei Kamerabewegung erneut kalibrieren.
- `Reset` setzt alle Werte auf Standard.

## Autoscoring PoC (Baseline/Scan)
Dieser Modus ist experimentell und dient nur als Proof-of-Concept.
1. Stelle sicher, dass keine Hand im Bild ist.
2. `Baseline` druecken (leeres Board speichern).
3. Dart werfen, Hand rausnehmen.
4. `Scan` druecken (Differenzanalyse startet).
5. Ergebnis wird als Treffer angezeigt oder kann manuell korrigiert werden.
Hinweis: Bei starkem Lichtwechsel oder Bewegung kann die Erkennung fehlschlagen.

## Fehlerdiagnose
- Treffer liegt daneben -> Board-Mitte und Rotation pruefen.
- Treffer grob falsch -> 4-Punkt-Kalibrierung wiederholen.
- Kamera unscharf -> Licht verbessern, Zoom reduzieren.
