# Prompt 13: Kamera-Setup & Kalibrierung (H-Town)

## Auftrag
Baue einen robusten Kamera-Setup- und Kalibrierungsmodus aus, damit das Board fuer das reale Setup (Poco X6, Montage wie in `docs/IMG_20260208_014519.jpg`) korrekt abgebildet wird.

## Ziele
- Board im Live-Preview optimal ausfuellen.
- Kalibrierung auch bei schraeger Montage / leichtem Winkel.
- Einstellungen lokal speichern und jederzeit verstellbar.

## Anforderungen
- Bestmoegliche Kameraaufloesung verwenden.
- Zoom muss ueber UI steuerbar sein.
- Kalibrierung muss ohne externe Tools moeglich sein.
- H-Town Setup: Kamera am Ort des Handys im Foto.

## Umsetzungsschritte
1. Kamera-Setup-Screen erweitern:
   - Setup-Toggle klar sichtbar.
   - Zoom-Slider (0..1), plus +/- Buttons.
   - Info zur aktuellen Aufloesung anzeigen.
2. Bestauflosung automatisch waehlen:
   - `getAvailablePictureSizesAsync()` nutzen.
   - Groesste Pixelanzahl waehlen und speichern.
3. Kalibrierung:
   - Mittelpunkt per Tap setzen (Bull-Mitte).
   - Optional: 4-Punkt-Kalibrierung fuer perspektivische Korrektur.
   - Skalierung so, dass Board-Rand exakt passt.
   - Rotation so ausrichten, dass 20 oben stimmt.
4. Overlay fuer Setup:
   - Board-Rand als Kreis anzeigen.
   - Optional eine 12-Uhr-Linie fuer 20er Ausrichtung.
5. Settings persistieren:
   - In `CameraSettingsStore` speichern.
   - Reset-Button fuer Defaults.

## Akzeptanzkriterien
- Kamera zeigt das Board gross und scharf (max. Aufloesung).
- Zoom vergroessert die Vorschau sichtbar.
- Nutzer kann Board-Mitte, Skalierung und Rotation speichern.
- Neustart behaelt alle Einstellungen.

## Output
- Code-Diff
- Kurzbeschreibung der UI-Aenderungen
