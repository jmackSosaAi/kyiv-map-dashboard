// Build external links to Google Maps / Street View from a place.
// Reference: https://developers.google.com/maps/documentation/urls/get-started

export function googleMapsSearchUrl(place) {
  const q = encodeURIComponent(`${place.lat},${place.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function streetViewUrl(place) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${place.lat},${place.lng}`;
}

export function googleMapsDirectionsUrl(origin, destination, mode = 'walking') {
  const o = `${origin.lat},${origin.lng}`;
  const d = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${mode}`;
}
