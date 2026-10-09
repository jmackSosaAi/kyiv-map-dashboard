# Kyiv Map Dashboard

A personal Kyiv map dashboard for visualizing apartments, offices, restaurants, bars, theaters, events, and more — built for trip planning.

![screenshot](docs/screenshot.png)

---

## Features

- Google Maps satellite/hybrid base
- Places autocomplete + live details (hours, phone, rating, reviews) with 7-day cache
- Address geocoding + URL parsing
- Category filters, geo filters (near Home / Office / Between)
- Sidebar text search
- Cultural events panel ("Coming Up")
- CSV import / export with batch enrichment script
- Light / dark theme with system preference
- Mobile-responsive (drawer sidebar, bottom-sheet panels)
- Routing between places (Google Directions)
- localStorage persistence with v2 schema + migrations

---

## Quick Start

```bash
git clone https://github.com/jmackSosaAi/kyiv-map-dashboard.git
cd kyiv-map-dashboard
npm install
cp .env.example .env
# edit .env, add your VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

---

## Required Google APIs

Enable these in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Maps JavaScript API
2. Places API (new)
3. Geocoding API
4. Directions API

After enabling, create an API key and paste it into `.env` as `VITE_GOOGLE_MAPS_API_KEY`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `http://localhost:5173` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |

### Enrichment script

Batch-enrich places CSV with live Places API data:

```bash
# Dry run — shows what would be fetched, no API calls
node scripts/enrich-kyiv-places.mjs --dry-run

# Real run — writes enriched CSV
node scripts/enrich-kyiv-places.mjs
```

---

## Deploy to Vercel

```bash
# One-time setup
npm install -g vercel
vercel login

# From project root
vercel

# Follow prompts:
#   - Link to GitHub repo jmackSosaAi/kyiv-map-dashboard
#   - Add VITE_GOOGLE_MAPS_API_KEY in the Vercel dashboard (Project > Settings > Environment Variables)

# Deploy to production
vercel --prod
```

After first deploy, subsequent deploys happen automatically on every `git push` to `master` if you connect the GitHub repo in the Vercel dashboard.

---

## Project Structure

```
src/
├── components/
│   ├── AddPlaceModal.jsx   # Add/edit place form
│   ├── CategoryFilter.jsx  # Category pill filters
│   ├── EventsPanel.jsx     # Cultural events / "Coming Up"
│   ├── GeoFilter.jsx       # Proximity filters (Home/Office/Between)
│   ├── MapView.jsx         # Google Maps wrapper + markers
│   ├── PlacePanel.jsx      # Place detail sheet
│   ├── RoutePanel.jsx      # Directions panel
│   ├── Sidebar.jsx         # Main sidebar + search
│   └── StoragePanel.jsx    # CSV import/export, storage controls
├── utils/
│   ├── categoryStyles.js   # Category color/icon map
│   ├── clipboard.js        # Clipboard helpers
│   ├── csv.js              # CSV parse/serialize
│   ├── geo.js              # Haversine distance, bearing
│   ├── geocode.js          # Geocoding API wrapper
│   ├── loadGoogleMaps.js   # Dynamic Maps SDK loader
│   ├── mapLinks.js         # Maps URL parsing/generation
│   ├── migrate.js          # localStorage schema migrations
│   ├── parseMapsUrl.js     # Google Maps URL → coords
│   ├── placeDetails.js     # Places API details fetcher
│   ├── placeDetailsCache.js# 7-day TTL cache for place details
│   └── placeFilters.js     # Filter logic (category, geo, text)
├── data/
│   ├── events.js           # Cultural events data
│   ├── kyivSeed.csv        # Seed places CSV
│   └── places.js           # Default places data
├── hooks/
│   ├── useLocalStorage.js  # localStorage React hook
│   └── useTheme.js         # Dark/light theme hook
├── App.jsx
├── main.jsx
└── styles.css
scripts/
└── enrich-kyiv-places.mjs  # Batch CSV enrichment
```

---

## Architecture Notes

- Single-page React + Vite app — no backend, no server.
- All state persisted in `localStorage` (v2 schema with automatic migrations from v1).
- Google APIs are called directly from the browser using the key in `.env`.
- Anchor places:
  - **Home** and **Office** — example anchors in `src/data/places.js`; replace them with your own

---

## Known Limitations

- Browser-based scraping of restaurant websites isn't possible due to CORS. Live restaurant data relies entirely on the Places API.
- Google Maps shortlinks (`maps.app.goo.gl`) can't be expanded client-side — paste full URLs instead.
- No backend and no cross-device sync; data lives in the browser's localStorage.

---

## Install on iPhone (PWA)

The app ships as a Progressive Web App with an offline app shell.

**iOS Safari**
1. Open the deployed URL in Safari.
2. Tap the Share button (box with arrow).
3. Tap **Add to Home Screen**.
4. Tap **Add**.

The app opens fullscreen (no browser chrome), has an offline app shell, and behaves like a native app. Google Maps tiles require network — they are cross-origin and intentionally not cached.

**Android Chrome**
Android handles installation automatically via an install banner (the `beforeinstallprompt` event). A floating prompt appears in the app; tap **Install** to add it to your home screen.

**What works offline**
- App shell (HTML, CSS, JS bundles) — served from cache.
- Place data and localStorage state — always local.

**What does not work offline**
- Google Maps tiles (cross-origin, network-only by design).
- Places API / Geocoding / Directions (live API calls).

**Icon note:** `public/icons/icon-192.png` and `public/icons/icon-512.png` are placeholder slots. See `public/icons/README.md` for instructions on generating real PNGs before shipping to production.

---

## License

MIT © 2026 Jackson Mackney

---

## Credits

Built with [Claude Code](https://claude.ai/claude-code), Anthropic.
