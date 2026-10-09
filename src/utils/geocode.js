import { loadGoogleMaps } from './loadGoogleMaps';

// Uses google.maps.Geocoder from the JS SDK -- billed against the Geocoding API.
// Returns { lat, lng, formattedAddress }.
export async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw new Error('Address is empty');
  }
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: results[0].formatted_address
        });
      } else if (status === 'ZERO_RESULTS') {
        reject(new Error('No results. Try appending ", Kyiv, Ukraine" or paste coordinates manually.'));
      } else if (status === 'REQUEST_DENIED') {
        reject(new Error('Request denied. Enable the Geocoding API for this key in Google Cloud Console.'));
      } else if (status === 'OVER_QUERY_LIMIT') {
        reject(new Error('Quota exceeded. Try again later.'));
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}
