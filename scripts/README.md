# Scripts

## `enrich-kyiv-places.mjs`

Batch-enriches `src/data/kyivSeed.csv` with real lat/lng, formatted address,
website, phone, opening hours, and rating from the Google Places API (new v1).
Output is written to `src/data/kyivSeedEnriched.csv` — the original seed is
never touched.

### One-time Google Cloud setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or pick a project.
3. APIs & Services -> Library -> enable **Places API (New)**. (This is a
   separate product from the legacy "Places API". The script uses the v1
   endpoint, which requires the new API.)
4. APIs & Services -> Credentials -> Create credentials -> API key.
5. Restrict the key to the **Places API (New)** under "API restrictions".
   No HTTP referrer restriction (this runs from your machine, not a browser).

If your existing `VITE_GOOGLE_MAPS_API_KEY` already has Places API (New)
enabled and no referrer restriction, you can reuse it. Otherwise create a
separate key.

### Run it

```sh
# preview without calling the API
node scripts/enrich-kyiv-places.mjs --dry-run

# real run
GOOGLE_PLACES_API_KEY=your_key_here node scripts/enrich-kyiv-places.mjs
```

Output: `src/data/kyivSeedEnriched.csv`. Re-running is idempotent — rows
that already have lat/lng are passed through unchanged.

### Import into the app

1. Start the dev server (`npm run dev`).
2. Sidebar -> Storage -> Import CSV.
3. Pick `src/data/kyivSeedEnriched.csv`.

### Known limits

- **Ambiguous names.** Generic restaurant names like "Catch", "Praha", or
  "Avalon" can match the wrong venue (or one outside Kyiv). The script takes
  the top result with no location bias. Spot-check the output before
  importing and tighten the `address` column in `kyivSeed.csv` for any rows
  that get the wrong match.
- **Quota.** Places API (New) Text Search is paid per request. 33 rows is
  trivial cost (~$0.50 at standard pricing), but watch your billing if you
  expand the seed.
- **Rate limiting.** Script sleeps ~350ms between requests (~3 req/sec) to
  stay well under throttling thresholds. Bump `RATE_LIMIT_MS` in the script
  if you hit `RESOURCE_EXHAUSTED`.
- **Field shape.** Opening hours, phone, and rating are appended to the
  `notes` column (the CSV schema has no dedicated columns). The Maps URL
  goes to `googleMapsUrl`, website to `website`, formatted address replaces
  `address`.
