# Startup Guide (VPS)

Stand: 2026-02-08

## 1) Web (Browser)
Statischer Web-Build ist bereits ueber Nginx verfuegbar:
- https://h-town.duckdns.org/app/

Aktualisieren des Web-Builds:
```bash
cd /root/darts
npx expo export --platform web --output-dir /opt/autoscoring/darts_app/build/web
```

## 2) Expo Go (nur ohne native Features)
```bash
cd /root/darts
npm run dev:tunnel
```

## 3) Custom Dev Client (VisionCamera/Realtime)
### Build
```bash
eas login
eas build -p android --profile development
```
Hinweis: Neue native Module (VisionCamera/Expo FileSystem) erfordern einen frischen Dev Client Build.

### Run
```bash
cd /root/darts
npm run dev:client -- --tunnel --port 8082
```

## 4) Firewall / Ports
- 80/443 offen (Web)
- Expo Tunnel nutzt ngrok, keine oeffentlichen Ports noetig

## 5) Troubleshooting
- Expo Go Fehler: App-Cache leeren
- Tunnel offline: `npm run dev:tunnel` neu starten
- White Screen im Web: Build erneut exportieren
