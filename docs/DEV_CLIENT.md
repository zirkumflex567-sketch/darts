# Custom Dev Client Setup

Ziel: Native Features wie Kamera/ML in der App testen (Expo Go reicht dafuer nicht).

## Voraussetzungen
- Expo Account
- EAS CLI (`npm install -g eas-cli`)
- Zugriff auf GitHub Repo

## Einmalige Einrichtung
```bash
npm install
npx expo login
```

## Android Dev Build (empfohlen fuer VPS)
```bash
eas build -p android --profile development
```

Nach Build:
- APK herunterladen und auf dem Android-Geraet installieren
- Dev Server starten:
```bash
npm run dev:client -- --tunnel
```
- QR Code mit dem Dev Client scannen

## iOS Dev Build
iOS braucht EAS Build + TestFlight.
```bash
eas build -p ios --profile development
```

## Start-Befehle
- Dev Client:
```bash
npm run dev:client -- --tunnel
```
- Standard Expo Go (ohne native Features):
```bash
npm run dev
```

## Troubleshooting
- Wenn der QR Code nicht laedt: Cache in App leeren und neu scannen
- Bei "Something went wrong": Manifest-URL testen
