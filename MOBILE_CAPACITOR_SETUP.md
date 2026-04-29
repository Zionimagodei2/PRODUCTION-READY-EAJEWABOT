# Capacitor Production Setup

This project can run both as a web app and as native mobile wrappers (Android/iOS) without replacing web hosting.

## 1) Build web bundle first
```bash
npm ci
npm run build
```

## 2) Add native platforms (one-time)
```bash
npm run cap:add:android
npm run cap:add:ios
```

## 3) Sync web assets into native shells
```bash
npm run cap:sync
```

## 4) Open IDE projects
```bash
npm run cap:open:android
npm run cap:open:ios
```

## Notes
- Web hosting remains fully supported (`npm run start`) and unaffected.
- Capacitor wraps the same app for APK/IPA builds.
- iOS requires macOS + Xcode.
