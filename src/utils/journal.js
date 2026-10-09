const LS_KEY = 'kmd.v2.journal';

function load() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // Quota / privacy mode -- silently ignore.
  }
}

function genId() {
  return 'jrn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

export function getEntries(placeId) {
  const data = load();
  const entries = data[placeId] || [];
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function addEntry(placeId, { date, text }) {
  const data = load();
  const existing = data[placeId] || [];
  const entry = { id: genId(), date, text, createdAt: Date.now() };
  data[placeId] = [...existing, entry];
  save(data);
  return getEntries(placeId);
}

export function updateEntry(placeId, entryId, { date, text }) {
  const data = load();
  const existing = data[placeId] || [];
  data[placeId] = existing.map((e) =>
    e.id === entryId ? { ...e, date, text } : e
  );
  save(data);
  return getEntries(placeId);
}

export function removeEntry(placeId, entryId) {
  const data = load();
  const existing = data[placeId] || [];
  data[placeId] = existing.filter((e) => e.id !== entryId);
  save(data);
  return getEntries(placeId);
}

export function getEntryCount(placeId) {
  const data = load();
  return (data[placeId] || []).length;
}

export function getAllEntries() {
  return load();
}
