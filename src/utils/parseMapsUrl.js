// Best-effort extraction of lat/lng from common Google Maps URL formats.
// Returns { lat, lng } or { error: string } on failure (never throws).
export function parseMapsUrl(input) {
  if (!input || typeof input !== 'string') return { error: 'empty input' };
  const url = input.trim();

  // Shortened share links cannot be resolved client-side (CORS blocks HEAD).
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url)) {
    return { error: 'Shortened URL — open it in a browser first, then copy the expanded URL.' };
  }

  const tryPatterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,         // /maps/@LAT,LNG,zoom or /maps/place/.../@LAT,LNG
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,     // place page protobuf-ish: !3dLAT!4dLNG
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
  ];
  for (const re of tryPatterns) {
    const m = url.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (
        Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
      ) {
        return { lat, lng };
      }
    }
  }

  // Bare "lat,lng" paste.
  const bare = url.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (bare) {
    const lat = parseFloat(bare[1]);
    const lng = parseFloat(bare[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }

  return { error: 'Could not find coordinates in the URL. Paste the full URL with the @LAT,LNG segment, or use a "?q=LAT,LNG" link.' };
}
