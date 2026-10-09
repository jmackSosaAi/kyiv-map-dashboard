const STORAGE_KEY = 'kmd.v2.placeDetails';
export const DETAILS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage blocked or full -- silently ignore
  }
}

export function isFresh(entry) {
  if (!entry || typeof entry.fetchedAt !== 'number') return false;
  return Date.now() - entry.fetchedAt < DETAILS_TTL_MS;
}

export function getCached(placeId) {
  if (!placeId) return null;
  const all = readAll();
  const entry = all[placeId];
  if (!entry || !isFresh(entry)) return null;
  return entry;
}

export function setCached(placeId, data) {
  if (!placeId) return;
  const all = readAll();
  all[placeId] = { data, fetchedAt: Date.now() };
  writeAll(all);
}

export function invalidateCached(placeId) {
  if (!placeId) return;
  const all = readAll();
  if (all[placeId]) {
    delete all[placeId];
    writeAll(all);
  }
}
