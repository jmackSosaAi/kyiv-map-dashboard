# PWA Icons

Replace `icon-192.png` and `icon-512.png` with real PNG icons before deploying.

## How to generate

**Option A — realfavicongenerator.net**
1. Go to https://realfavicongenerator.net
2. Upload a 1024×1024 source PNG (dark blue background `#0b1220`, yellow "K" letter)
3. Download the package and copy `android-chrome-192x192.png` → `icon-192.png` and `android-chrome-512x512.png` → `icon-512.png` into this folder.

**Option B — pwa-asset-generator (CLI)**
```bash
npx pwa-asset-generator icon-source.png ./public/icons --manifest public/manifest.json --index index.html --background "#0b1220"
```
Requires a 1024×1024 `icon-source.png` in the project root.

## Current state
`icon.svg` is a real SVG icon (dark blue bg, yellow "K") and is listed in `manifest.json` as `"sizes": "any"`. Some PWA installers accept SVG; others (iOS Safari, older Android) require PNG. The PNG slots in `manifest.json` will 404 until you add real PNGs — the app still installs on iOS via the `<link rel="apple-touch-icon">` fallback but Safari will show a default icon.
