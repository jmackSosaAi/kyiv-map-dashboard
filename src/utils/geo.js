// Lightweight geo helpers. No external deps.

export const KYIV_CENTER = { lat: 50.4501, lng: 30.5234 };
export const KYIV_DEFAULT_ZOOM = 13;

// Tunable thresholds for geo filters.
export const NEAR_RADIUS_M = 1500;        // "Near Home / Near Office"
export const BETWEEN_CORRIDOR_M = 1000;   // "Between Home and Office" perpendicular width

// Haversine distance in meters.
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Perpendicular distance (m) from a point to the segment [a, b].
// Uses an equirectangular projection — accurate at city scale.
export function pointToSegmentDistance(point, a, b) {
  const meanLat = (a.lat + b.lat + point.lat) / 3;
  const cosMean = Math.cos((meanLat * Math.PI) / 180);
  const toXY = (p) => ({
    x: (p.lng - a.lng) * 111320 * cosMean,
    y: (p.lat - a.lat) * 110540
  });
  const A = { x: 0, y: 0 };
  const B = toXY(b);
  const P = toXY(point);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(P.x, P.y);
  let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: t * dx, y: t * dy };
  return Math.hypot(P.x - proj.x, P.y - proj.y);
}

export function formatMeters(m) {
  if (m == null) return '';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

export function formatSeconds(s) {
  if (s == null) return '';
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
