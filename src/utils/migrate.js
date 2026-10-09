// LocalStorage key versioning. App reads/writes kmd.v2.* exclusively;
// this helper copies legacy kmd.* keys into v2 on first run.

const V2_FLAG = 'kmd.v2.migrated';

const V1_TO_V2 = {
  'kmd.categories':       'kmd.v2.categories',
  'kmd.geoFilter':        'kmd.v2.geoFilter',
  'kmd.travelMode':       'kmd.v2.travelMode',
  'kmd.originId':         'kmd.v2.originId',
  'kmd.mapTypeId':        'kmd.v2.mapTypeId',
  'kmd.selectedPlaceId':  'kmd.v2.selectedPlaceId',
  'kmd.userPlaces':       'kmd.v2.userPlaces',
  'kmd.placeStatus':      'kmd.v2.placeStatus'
};

export function runMigrations() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(V2_FLAG)) return;
    for (const [oldK, newK] of Object.entries(V1_TO_V2)) {
      const v = window.localStorage.getItem(oldK);
      if (v !== null && window.localStorage.getItem(newK) === null) {
        window.localStorage.setItem(newK, v);
      }
    }
    window.localStorage.setItem(V2_FLAG, '1');
  } catch {
    // Storage blocked -- ignore.
  }
}

// Clear every kmd.* key (v1 + v2 + the migration flag).
export function resetAllLocalData() {
  if (typeof window === 'undefined') return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('kmd.')) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
