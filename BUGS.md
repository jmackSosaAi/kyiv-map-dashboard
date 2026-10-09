# Bug Report — Kyiv Map Dashboard QA Pass

_Date: 2026-05-20 | Tester: Claude Code (automated smoke test) | Branch: feature/qa-pass_

---

## [major] "Search Google Places" autocomplete input missing from AddPlaceModal

**Where:** `AddPlaceModal` component — the add-place form
**Steps to reproduce:**
1. Click the "+ Add place" button in the sidebar header.
2. Observe the fields in the modal.
**Expected:** "Search Google Places" is the first field (spec requirement), rendered but disabled/greyed-out when `VITE_GOOGLE_MAPS_API_KEY` is absent.
**Actual:** The field is completely absent. The first field is "Name *". The tip text says "search below to auto-fill" but no search input exists in the DOM. Users have no indication that a Places autocomplete input will appear once the key is set.
**Screenshot:** screenshots/desktop-add-place-modal.png

---

## [minor] Mobile topbar missing "Kyiv Dashboard" text label at 375px

**Where:** Topbar component — mobile viewport (≤860px breakpoint)
**Steps to reproduce:**
1. Resize viewport to 375×812 (iPhone SE).
2. Observe the topbar at the top of the screen.
**Expected:** Topbar shows "☰  Kyiv Dashboard" — hamburger icon AND title text.
**Actual:** At 375px only the hamburger icon (☰) is visible in the topbar. The "Kyiv Dashboard" title text does not render. At 768px (tablet) it renders correctly.
**Screenshot:** screenshots/mobile-topbar.png

---

## [minor] Theme toggle requires JavaScript `.click()` — `preview_click` tool interception

**Where:** `ThemeToggle` button in `Sidebar` header
**Steps to reproduce:**
1. On desktop, click the 🌙 / ☀️ button in the sidebar header via a standard pointer click.
**Expected:** Theme flips immediately on click; background colour changes; button emoji toggles.
**Actual:** The toggle works correctly when triggered via `element.click()` in JS (confirmed: data-theme flips, localStorage persists, background changes). No React errors observed. However, click event delivery via the preview tool's standard click mechanism did not trigger a visible repaint in the screenshot, suggesting the button may have a very small hit-target or z-index stacking issue that could affect real users on touch devices.
**Screenshot:** screenshots/desktop-light-theme.png

---

## [minor] "Copy Maps link" action duplicated — appears in both action grid and copy-button row

**Where:** `PlacePanel` component — action buttons section
**Steps to reproduce:**
1. Click any place row to open the PlacePanel.
2. Observe the buttons below "Live details".
**Expected:** Each action appears once. "Copy Maps link" should be in one section only.
**Actual:** "Copy Maps link" appears twice — once in the action grid row (alongside "Open in Google Maps" and "Open Street View") and again in the copy-buttons row (alongside "Copy coords" and "Copy CSV row"). This is redundant and wastes limited horizontal space.
**Screenshot:** screenshots/desktop-place-panel.png

---

## [minor] PlacePanel "Live details / Fetch live details" section always visible without API key

**Where:** `PlacePanel` component — live details section
**Steps to reproduce:**
1. Open any PlacePanel (click an event or place row).
2. Observe the "Live details" section.
**Expected:** "Live details" section is hidden or shows a clear "Requires Google Maps API key" message when the key is absent.
**Actual:** "Live details" label and "Fetch live details" button are always rendered. Clicking "Fetch live details" presumably fails silently without the API key. No disabled state or explanatory message.
**Screenshot:** screenshots/desktop-place-panel.png
