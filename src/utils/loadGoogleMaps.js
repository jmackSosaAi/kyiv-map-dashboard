// Singleton loader for the Google Maps JS API. Shared by MapView + geocoder.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loaderPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;
  if (!API_KEY) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY in .env'));
  }
  loaderPromise = new Promise((resolve, reject) => {
    const cbName = '__kyivMapInit_' + Math.random().toString(36).slice(2);
    window[cbName] = () => {
      delete window[cbName];
      resolve(window.google);
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      API_KEY
    )}&libraries=geometry,places&callback=${cbName}&v=weekly&loading=async`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function isGoogleMapsLoaded() {
  return typeof window !== 'undefined' && !!window.google?.maps;
}
