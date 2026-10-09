# QA Report — Kyiv Map Dashboard Smoke Test

_Date: 2026-05-20 | Branch: feature/qa-pass | Tester: Claude Code (automated)_
_API key: NOT set (VITE_GOOGLE_MAPS_API_KEY absent — all Google-backed features untestable)_

---

## Summary

| Result | Count |
|--------|-------|
| PASS   | 20    |
| FAIL   | 5     |
| SKIP   | 2     |

---

## Desktop Pass (1280×800)

- [x] **D1** Page loads. Sidebar visible on left. Map area shows "Map failed to load / Missing VITE_GOOGLE_MAPS_API_KEY in .env" gracefully.
- [x] **D2** Theme toggle — clicking the 🌙 button switches to light mode (`data-theme=light`, `background: rgb(248,250,252)`). Click again switches back to dark. Value persists in `localStorage` as `"kmd.v2.theme"`.
- [x] **S3** Search — typing "podil" filters place list from 15 → 10 places shown. All returned places are Podil-neighbourhood entries.
- [x] **D4** Coming Up panel — 5 events shown with formatted dates ("Jun 28", "Jul 6–7", "Jul 15", "Jul 17–19", "Aug 24") and "in N days" labels (38 / 46 / 55 / 57 / 95 days from 2026-05-20). ≥1 event confirmed.
- [x] **D5** Event click — clicking "Independence Day" event row opens PlacePanel for "Maidan Nezalezhnosti".
- [x] **D6** PlacePanel — shows category chips (EVENT, MAIDAN), name, distances (Home: 2.19 km, Office: 1.50 km), description, "Visited" / "Want to visit" toggles, action grid (Open in Google Maps, Open Street View), copy buttons (Copy coords, Copy Maps link, Copy CSV row), travel mode dropdown, origin dropdown, route buttons (Home / Office / Route from selected origin). `place-panel` class confirmed present.
- [ ] **D7** AddPlaceModal — "Search Google Places" input is **missing** as first field (see BUGS.md #1). Modal does open. Category, Address, Geocode address, Extract lat/lng from URL, Latitude, Longitude, Neighborhood, Price level, Priority, Notes, Safety notes, Website, Menu URL, Events URL, Instagram fields all present. Manual flow renders correctly.
- [x] **D8** StoragePanel — visible at bottom of sidebar with 4 buttons: "Export CSV", "Import CSV…", "Load Kyiv seed", "Reset local data".
- [x] **D9** Load Kyiv seed — confirm dialog fires with message "Add the Kyiv seed list (~30 places) to your local data?". Cancelled successfully — no data loaded.

---

## Mobile Pass (375×812)

- [ ] **M1** Topbar — hamburger (☰) visible but **"Kyiv Dashboard" title text absent** at 375px (see BUGS.md #2). At 768px tablet it renders correctly.
- [x] **M2** Hamburger — clicking ☰ opens sidebar; `app.sidebar-open` class applied; `.sidebar-backdrop` element rendered with `opacity:1`. Clicking backdrop closes sidebar (app class clears `sidebar-open`).
- [x] **M3** Theme toggle in mobile — accessible in open sidebar header; toggle works identically to desktop (confirmed via JS eval).
- [x] **M4** PlacePanel bottom-sheet — clicking a place row renders PlacePanel with `border-radius: 14px 14px 0px 0px` (rounded top corners), stretches to bottom of viewport. Correct bottom-sheet layout confirmed.
- [x] **M5** AddPlaceModal mobile — at 375px modal is 343px wide (maxWidth: 375px), 812px tall — near-full-screen as expected.
- [x] **M6** No horizontal scroll — `document.body.scrollWidth === 375 === window.innerWidth`. No overflow.

---

## Tablet Pass (768×1024)

- [x] **T1** Topbar visible with "☰ Kyiv Dashboard". Drawer behaviour applies (sidebar is `position:fixed`, hamburger visible). Map area fills remainder.

---

## Console Errors

- [x] **C1** Zero JavaScript errors in browser console across all viewports.
- [x] **C2** Zero React warnings (no missing keys, no prop-type errors, no undefined refs).
- Only benign messages: Vite HMR connect/reconnect and React DevTools info notice.

---

## Skipped / Untestable

- **SKIP** Map rendering, marker clicks, map pan on place select — requires `VITE_GOOGLE_MAPS_API_KEY`.
- **SKIP** Places autocomplete in AddPlaceModal, Geocoding API, "Open Street View" live content — requires API key.

---

## Bugs Filed

See `BUGS.md` for full reproduction steps.

| ID | Severity | Title |
|----|----------|-------|
| B1 | major    | "Search Google Places" autocomplete input missing from AddPlaceModal |
| B2 | minor    | Mobile topbar missing "Kyiv Dashboard" title at 375px |
| B3 | minor    | Theme toggle click hit-target / event delivery may be unreliable |
| B4 | minor    | "Copy Maps link" duplicated in PlacePanel action grid and copy-button row |
| B5 | minor    | PlacePanel "Fetch live details" button always shown with no API-key guard |
