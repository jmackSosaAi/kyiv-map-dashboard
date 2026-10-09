// One source of truth for category colors + labels.
// Keep simple, readable, high-contrast against satellite imagery.

export const CATEGORIES = [
  { id: 'home',       label: 'Home',       color: '#22c55e' }, // green
  { id: 'office',     label: 'Office',     color: '#3b82f6' }, // blue
  { id: 'restaurant', label: 'Restaurant', color: '#ef4444' }, // red
  { id: 'bar',        label: 'Bar',        color: '#a855f7' }, // purple
  { id: 'club',       label: 'Club',       color: '#ec4899' }, // pink
  { id: 'theater',    label: 'Theater',    color: '#f59e0b' }, // amber
  { id: 'cafe',       label: 'Cafe',       color: '#d97706' }, // dark amber
  { id: 'grocery',    label: 'Grocery',    color: '#14b8a6' }, // teal
  { id: 'gym',        label: 'Gym',        color: '#06b6d4' }, // cyan
  { id: 'transit',    label: 'Transit',    color: '#64748b' }, // slate
  { id: 'errand',     label: 'Errand',     color: '#8b5cf6' }, // violet
  { id: 'event',      label: 'Event',      color: '#fb923c' }, // orange
  { id: 'trip',       label: 'Trip',       color: '#84cc16' }, // lime
  { id: 'other',      label: 'Other',      color: '#9ca3af' }  // gray
];

const BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export function getCategory(id) {
  return BY_ID[id] || BY_ID.other;
}

export function getCategoryColor(id) {
  return getCategory(id).color;
}

// Home and office are anchors -- render with a larger/distinct symbol.
export function isAnchorCategory(id) {
  return id === 'home' || id === 'office';
}
