import { CATEGORIES } from './categoryStyles';

// CSV column order is fixed; importers and exporters both use this.
export const CSV_HEADERS = [
  'name', 'category', 'address', 'lat', 'lng', 'neighborhood',
  'priceLevel', 'priority', 'notes', 'safetyNotes',
  'website', 'menuUrl', 'eventsUrl', 'instagramUrl', 'googleMapsUrl',
  'placeId',
  'visited', 'wantToVisit'
];

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

// --- RFC 4180-ish parser. Handles quoted fields with commas, quotes, newlines.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) i = 1; // strip BOM

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++;
      } else {
        field += c; i++;
      }
    } else {
      if (c === '"') { inQuotes = true; i++; }
      else if (c === ',') { row.push(field); field = ''; i++; }
      else if (c === '\r') { i++; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; }
      else { field += c; i++; }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function stringifyCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(',')
    )
    .join('\n');
}

export function placeToCsvRow(p) {
  return [
    p.name,
    p.category,
    p.address || '',
    Number.isFinite(p.lat) ? p.lat : '',
    Number.isFinite(p.lng) ? p.lng : '',
    p.neighborhood || '',
    p.priceLevel || '',
    p.priority ?? 0,
    p.notes || '',
    p.safetyNotes || '',
    p.links?.website || '',
    p.links?.menuUrl || '',
    p.links?.eventsUrl || '',
    p.links?.instagramUrl || '',
    p.links?.googleMapsUrl || '',
    p.placeId || '',
    p.visited ? 'true' : 'false',
    p.wantToVisit ? 'true' : 'false'
  ];
}

export function placesToCsv(places) {
  return stringifyCsv([CSV_HEADERS, ...places.map(placeToCsvRow)]);
}

// Convert CSV text into place objects. Returns { places, warnings }.
// All imported rows are tagged `source: 'user'` and get fresh user-* IDs.
export function csvToPlaces(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { places: [], warnings: ['Empty CSV.'] };

  const header = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  if (idx.name == null) {
    return { places: [], warnings: ['Missing required "name" column.'] };
  }

  const get = (r, key) => {
    const i = idx[key];
    if (i == null || i >= r.length) return '';
    return (r[i] ?? '').toString().trim();
  };

  const places = [];
  const warnings = [];
  const stamp = Date.now();

  for (let rowNum = 1; rowNum < rows.length; rowNum++) {
    const r = rows[rowNum];
    if (r.length === 0 || (r.length === 1 && r[0] === '')) continue;

    const name = get(r, 'name');
    if (!name) {
      warnings.push(`Row ${rowNum + 1}: missing name, skipped.`);
      continue;
    }

    let category = get(r, 'category') || 'other';
    if (!CATEGORY_IDS.includes(category)) {
      warnings.push(`Row ${rowNum + 1} (${name}): unknown category "${category}", set to "other".`);
      category = 'other';
    }
    if (category === 'home' || category === 'office') {
      warnings.push(`Row ${rowNum + 1} (${name}): "${category}" is reserved for anchors, set to "other".`);
      category = 'other';
    }

    const latStr = get(r, 'lat');
    const lngStr = get(r, 'lng');
    let lat = null;
    let lng = null;
    if (latStr) {
      const n = parseFloat(latStr);
      if (Number.isFinite(n) && n >= -90 && n <= 90) lat = n;
      else warnings.push(`Row ${rowNum + 1} (${name}): invalid lat "${latStr}", left blank.`);
    }
    if (lngStr) {
      const n = parseFloat(lngStr);
      if (Number.isFinite(n) && n >= -180 && n <= 180) lng = n;
      else warnings.push(`Row ${rowNum + 1} (${name}): invalid lng "${lngStr}", left blank.`);
    }
    if ((lat === null) !== (lng === null)) {
      // Only one provided -- drop both so we don't render in the ocean.
      warnings.push(`Row ${rowNum + 1} (${name}): only one of lat/lng provided, both dropped.`);
      lat = null;
      lng = null;
    }

    const truthy = (s) => /^(true|1|yes)$/i.test(s);

    places.push({
      id: `user-${stamp}-${rowNum}`,
      name,
      category,
      address: get(r, 'address'),
      neighborhood: get(r, 'neighborhood'),
      lat,
      lng,
      priority: parseInt(get(r, 'priority'), 10) || 0,
      priceLevel: get(r, 'priceLevel'),
      notes: get(r, 'notes'),
      safetyNotes: get(r, 'safetyNotes'),
      visited: truthy(get(r, 'visited')),
      wantToVisit: truthy(get(r, 'wantToVisit')),
      placeId: get(r, 'placeId'),
      links: {
        website: get(r, 'website'),
        menuUrl: get(r, 'menuUrl'),
        eventsUrl: get(r, 'eventsUrl'),
        instagramUrl: get(r, 'instagramUrl'),
        googleMapsUrl: get(r, 'googleMapsUrl')
      },
      source: 'user'
    });
  }

  return { places, warnings };
}

// Trigger a browser download of CSV text.
export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
