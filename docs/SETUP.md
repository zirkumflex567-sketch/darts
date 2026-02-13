# Setup

## Requirements

- Node.js 20+
- npm 10+
- Expo CLI (via `npx expo` is fine)
- Android Studio (for Android native runs)
- Xcode (for iOS runs, macOS only)

Optional for ML workflows:
- Python 3.10+ and virtualenv
- CUDA-compatible GPU (training only)

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Variants:

```bash
npm run dev:web
npm run dev:tunnel
npm run dev:client
npm run android
npm run ios
```

## Test & lint

```bash
npm test
npm run lint
npm run format
```

## Native change sanity check

```bash
npm run native:check
```

## Environment and secrets

- Keep credentials out of Git.
- `credentials/` and `credentials.json` are ignored.
- Use local env files where needed (`.env*.local`).

## Known constraints

- Camera + real-time ML scoring is native-focused.
- Web mode is great for UI/state/domain iteration but not a full replacement for device testing.
