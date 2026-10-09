import {
  distanceMeters,
  pointToSegmentDistance,
  NEAR_RADIUS_M,
  BETWEEN_CORRIDOR_M
} from './geo';

export const GEO_FILTERS = [
  { id: 'none',       label: 'All' },
  { id: 'nearHome',   label: 'Near Home' },
  { id: 'nearOffice', label: 'Near Office' },
  { id: 'between',    label: 'Between Home & Office' }
];

function matchesSearch(p, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    (p.name || '').toLowerCase().includes(needle) ||
    (p.category || '').toLowerCase().includes(needle) ||
    (p.neighborhood || '').toLowerCase().includes(needle) ||
    (p.address || '').toLowerCase().includes(needle) ||
    (p.notes || '').toLowerCase().includes(needle)
  );
}

// Apply search + category + geo filters. Anchors are always shown unless a
// non-matching search query is active.
export function applyFilters(places, { search, enabledCategories, geoFilter, homePlace, officePlace }) {
  const q = (search || '').trim();
  return places.filter((p) => {
    if (!matchesSearch(p, q)) return false;
    if (p.id === 'home' || p.id === 'office') return true;
    if (!enabledCategories.includes(p.category)) return false;
    if (!geoFilter || geoFilter === 'none') return true;

    if (geoFilter === 'nearHome' && homePlace) {
      return distanceMeters(p, homePlace) <= NEAR_RADIUS_M;
    }
    if (geoFilter === 'nearOffice' && officePlace) {
      return distanceMeters(p, officePlace) <= NEAR_RADIUS_M;
    }
    if (geoFilter === 'between' && homePlace && officePlace) {
      return pointToSegmentDistance(p, homePlace, officePlace) <= BETWEEN_CORRIDOR_M;
    }
    return true;
  });
}
