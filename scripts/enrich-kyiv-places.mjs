#!/usr/bin/env node
// Enriches src/data/kyivSeed.csv with lat/lng/website/phone/hours/rating from
// Google Places API v1. Writes to src/data/kyivSeedEnriched.csv. Idempotent:
// rows that already have lat/lng are passed through unchanged.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// CSV helpers are inlined here (rather than imported from src/utils/csv.js)
// because Node ESM does not resolve the project's extensionless imports the
// way Vite does. Logic mirrors the RFC 4180-ish parser in src/utils/csv.js.

const CSV_HEADERS = [
  'name', 'category', 'address', 'lat', 'lng', 'neighborhood',
  'priceLevel', 'priority', 'notes', 'safetyNotes',
  'website', 'menuUrl', 'eventsUrl', 'instagramUrl', 'googleMapsUrl',
  'visited', 'wantToVisit'
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) i = 1;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++;
      } else { field += c; i++; }
    } else {
      if (c === '"') { inQuotes = true; i++; }
      else if (c === ',') { row.push(field); field = ''; i++; }
      else if (c === '\r') { i++; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; }
      else { field += c; i++; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function stringifyCsv(rows) {
  return rows
    .map((row) => row.map((cell) => {
      const s = String(cell ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(','))
    .join('\n');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'src/data/kyivSeed.csv');
const OUTPUT = resolve(ROOT, 'src/data/kyivSeedEnriched.csv');

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.websiteUri',
  'places.internationalPhoneNumber',
  'places.regularOpeningHours',
  'places.rating',
  'places.googleMapsUri',
  'places.priceLevel'
].join(',');

// ~3 req/sec ceiling. Places v1 default is generous but bursts get throttled.
const RATE_LIMIT_MS = 350;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!DRY_RUN && !API_KEY) {
  console.error('Error: GOOGLE_PLACES_API_KEY is not set.');
  console.error('Run: GOOGLE_PLACES_API_KEY=xxx node scripts/enrich-kyiv-places.mjs');
  console.error('Or use --dry-run to preview without calling the API.');
  process.exit(1);
}

function rowToObject(headers, row) {
  const o = {};
  headers.forEach((h, i) => { o[h] = (row[i] ?? '').trim(); });
  return o;
}

function objectToRow(headers, o) {
  return headers.map((h) => o[h] ?? '');
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.weekdayDescriptions) return '';
  return regularOpeningHours.weekdayDescriptions.join('; ');
}

function buildNotes(existing, place) {
  const parts = existing ? [existing] : [];
  if (place.internationalPhoneNumber) parts.push(`Phone: ${place.internationalPhoneNumber}`);
  const hours = formatHours(place.regularOpeningHours);
  if (hours) parts.push(`Hours: ${hours}`);
  if (typeof place.rating === 'number') parts.push(`Rating: ${place.rating}`);
  return parts.join('\n');
}

async function searchText(query) {
  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'en', maxResultCount: 1 })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.places?.[0] || null;
}

async function main() {
  const text = readFileSync(INPUT, 'utf8');
  const rows = parseCsv(text);
  if (rows.length < 2) {
    console.error('Input CSV has no data rows.');
    process.exit(1);
  }

  const headers = rows[0].map((h) => h.trim());
  for (const h of CSV_HEADERS) {
    if (!headers.includes(h)) console.warn(`Warning: header "${h}" missing from input.`);
  }

  const outRows = [headers];
  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 0 || (r.length === 1 && r[0] === '')) continue;
    const o = rowToObject(headers, r);
    const name = o.name;
    if (!name) {
      outRows.push(r);
      continue;
    }

    if (o.lat && o.lng) {
      console.log(`- skip  ${name} (already has lat/lng)`);
      skipped++;
      outRows.push(r);
      continue;
    }

    const query = `${name}, ${o.address || 'Kyiv, Ukraine'}`;

    if (DRY_RUN) {
      console.log(`~ would query: ${query}`);
      outRows.push(r);
      continue;
    }

    try {
      const place = await searchText(query);
      if (!place) {
        console.log(`! no result  ${name}`);
        failed++;
        outRows.push(r);
      } else {
        o.lat = place.location?.latitude ?? o.lat;
        o.lng = place.location?.longitude ?? o.lng;
        if (place.formattedAddress) o.address = place.formattedAddress;
        if (place.websiteUri) o.website = place.websiteUri;
        if (place.googleMapsUri) o.googleMapsUrl = place.googleMapsUri;
        o.notes = buildNotes(o.notes, place);
        const displayName = place.displayName?.text || name;
        console.log(`+ ok    ${name} -> ${displayName} (${o.lat}, ${o.lng})`);
        enriched++;
        outRows.push(objectToRow(headers, o));
      }
    } catch (err) {
      console.log(`x error ${name}: ${err.message}`);
      failed++;
      outRows.push(r);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log('');
  console.log(`Done. enriched=${enriched} skipped=${skipped} failed=${failed}`);
  if (DRY_RUN) {
    console.log('(dry run - no API calls made, no file written)');
  } else {
    const csv = stringifyCsv(outRows) + '\n';
    writeFileSync(OUTPUT, csv, 'utf8');
    console.log(`Wrote ${OUTPUT}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
