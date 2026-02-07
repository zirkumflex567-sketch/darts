# Dartsmind – Informationen für App-Nachbau

## 📌 Allgemeine Beschreibung
**Dartsmind** ist eine mobile App, die dein Smartphone oder Tablet in ein **automatisches Dart-Scoring System** verwandelt — komplett **ohne zusätzliche Hardware**.  
Sie nutzt dabei die **Rückkamera des Geräts**, um Dartwürfe live zu erkennen und automatisch Punkte zu zählen. 0

---

## 🎯 Hauptmerkmale

### 🔹 Autoscoring mit Kamera
- Nutzt **nur die integrierte Rückkamera** zur Erkennung von Dartwürfen.  
- Funktioniert aus verschiedenen Kamerapositionen und Winkeln.  
- **Keine zusätzliche Hardware** oder externe Sensoren nötig.  
- Keine aufwendige Kalibrierung oder manuelle Objektivkorrektur. 1

### 🔹 KI-Modell (On-Device)
- Speziell entwickelte **KI für Dartsituationen**.  
- Verarbeitet alles **lokal auf dem Gerät** → schnelle Reaktionen, Offline-Funktion & Datenschutz.  
- Kompatibilität kann auf Android abhängig von CPU/GPU-Leistung sein. 2

### 🔹 Kompatibilität
- Unterstützt **iPhone & iPad** (Portrait & Landscape).  
- Unterstützt die meisten **Standard-Steel-Dartscheiben**.  
- Dual-Device Mode: zwei Geräte für höhere Genauigkeit möglich.  
- Android: Autoscoring hängt vom Chip-Benchmark ab; Chromebooks/Emulatoren werden nicht unterstützt. 3

---

## 🎮 Spielmodi

Dartsmind bietet eine breite Auswahl an Dart-Spieltypen:

### ✨ X01 Serie
- Klassische Punktespiele von **210 bis 1501** Punkten. 4

### 🏆 Cricket Varianten
- Standard Cricket  
- No Score Cricket  
- Tactic Cricket  
- Random Cricket  
- Cut-Throat Cricket 5

### 🏋️‍♂️ Übungsspiele
- Around the Clock  
- JDC Challenge  
- Catch 40  
- 9 Darts Double Out  
- 99 Darts at XX  
- Bob’s 27  
- Random Checkout  
- 170  
- Cricket Count Up  
- Count Up Party Games 6

### 🎉 Party- und Spaßmodi
- Hammer Cricket  
- Half It  
- Killer  
- Shanghai  
- Bermuda  
- Gotcha 7

---

## 🔧 Zusätzliche Funktionen

### 🧠 Statistiken & Analyse
- Detaillierte **Spielstatistiken** für Spielanalyse.  
- Spielhistorien für Legs & Matches. 8

### 🤖 DartBot
- KI-gegner mit **verschiedenen Schwierigkeitsstufen** für X01 und Cricket. 9

### 🌐 Online Play
- **Game Lobby** für globale Online-Matches. (mit Video, Coins für Videostreaming) 10

---

## 📈 Monetarisierung
- Die App ist **kostenlos** zum Download.  
- **In-App-Käufe / Abos** möglich (z. B. Pro Abo für zusätzliche Features).  
- Coins für Online-Video-Features (geteilte Nutzung je Match). 11

---

## 📱 Plattform-Details

### 📲 Android
- Über 100.000+ Downloads, sehr positive Bewertungen (~4.5★).  
- Kompatibel ab Android 9.0+ (starke Geräte für Autoscoring empfohlen).  
- Läuft vollständig lokal. 12

### 🍏 iOS / iPadOS
- Unterstützt iPhones & iPads mit **A12 Chip oder neuer**.  
- Läuft auch offline, viele Modi und Multiplayer-Funktionen. 13

---

## 📌 FAQ-Insights (AI & Setup)

### 🔹 Kompatibilität
- Autoscoring prüft Geräte-Leistung beim ersten Start.  
- Nicht kompatibel wenn Echtzeit-Inference nicht ausreichend möglich ist. 14

### 🔹 Performance
- AI Video-Analyse kann Akku stark belasten → Temperaturerhöhung normal. 15

### 🔹 Externe Kameras
- Nur UVC-kompatible externe Kameras werden auf einigen iPads unterstützt. 16

### 🔹 Online Match Coins
- Coins sind für **Video-Verbindung im Online-Match** nötig, nicht für Punktezählung selbst. 17

---

## 🧠 Vergleich & Community Einordnung
- Dartsmind wird häufig in Vergleichen mit anderen Auto-Scoring-Systemen wie **AutoDarts** angesehen (Community-Videos verfügbar). 18

---

## 📝 Zusammengefasste Feature-Matrix (für dein Rebuild)

| Feature | Unterstützt | Notes |
|---------|-------------|-------|
| Autoscoring via Kamera | ✅ | Lokales AI, kein Sensor nötig |
| Dual-Camera Mode | ✅ | Für höhere Präzision |
| X01 Games | ✅ | 210–1501 |
| Cricket Varianten | ✅ | Verschiedene Modi |
| Übungsspiele | ✅ | Viele Praxisformate |
| Online Multiplayer | ✅ | Lobby & Coins |
| Detailed Stats | ✅ | Analyse & History |
| DartBot (AI) | ✅ | Schwierigkeitsstufen |
| Offline-Funktion | ✅ | Lokale AI Verarbeitungen |
| External Camera Support | 📌 Einschränkung | Nur UVC auf iPad |

---

## 📑 Quellen

* Basis-Feature & Autoscoring beschreibt, Nutzung der Rückkamera, keine Hardware nötig. 19  
* AppStore/PlayStore wichtige Features & Spiel-Listen. 20  
* FAQ Details zur Autoscoring-Kompatibilität & Betrieb. 21  
* Community-Vergleich (YouTube) bietet Kontext über Zielgruppe & Wettbewerber. 22
