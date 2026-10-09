import { loadGoogleMaps } from './loadGoogleMaps';

const DETAIL_FIELDS = [
  'place_id',
  'name',
  'formatted_address',
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'url',
  'opening_hours',
  'rating',
  'user_ratings_total',
  'price_level'
];

function statusMessage(status) {
  // PlacesService statuses are strings on google.maps.places.PlacesServiceStatus.
  switch (status) {
    case 'OK': return 'OK';
    case 'ZERO_RESULTS': return 'No results for this place.';
    case 'NOT_FOUND': return 'Place not found.';
    case 'REQUEST_DENIED': return 'Request denied. Enable Places API on this key.';
    case 'OVER_QUERY_LIMIT': return 'Places API quota exceeded.';
    case 'INVALID_REQUEST': return 'Invalid Places request.';
    default: return `Places error: ${status}`;
  }
}

function buildHours(detailsOpeningHours) {
  if (!detailsOpeningHours) return null;
  const weekly = Array.isArray(detailsOpeningHours.weekday_text)
    ? detailsOpeningHours.weekday_text.slice()
    : [];
  // JS Date.getDay() => 0=Sun..6=Sat. Google's weekday_text starts on Monday.
  const jsDow = new Date().getDay();
  const mondayIndex = (jsDow + 6) % 7;
  const today = weekly[mondayIndex] || null;
  let isOpenNow;
  try {
    if (typeof detailsOpeningHours.isOpen === 'function') {
      isOpenNow = detailsOpeningHours.isOpen();
    } else if (typeof detailsOpeningHours.open_now === 'boolean') {
      isOpenNow = detailsOpeningHours.open_now;
    }
  } catch {
    isOpenNow = undefined;
  }
  return { today, weekly, isOpenNow };
}

function shape(details) {
  if (!details) return null;
  const hours = buildHours(details.opening_hours);
  return {
    placeId: details.place_id || '',
    openingHours: hours,
    isOpenNow: hours ? hours.isOpenNow : undefined,
    phone: details.formatted_phone_number || details.international_phone_number || '',
    website: details.website || '',
    rating: typeof details.rating === 'number' ? details.rating : null,
    userRatingsTotal: typeof details.user_ratings_total === 'number' ? details.user_ratings_total : null,
    googleUrl: details.url || '',
    priceLevel: typeof details.price_level === 'number' ? details.price_level : null
  };
}

function getDetailsById(google, service, placeId) {
  return new Promise((resolve, reject) => {
    service.getDetails({ placeId, fields: DETAIL_FIELDS }, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        resolve(result);
      } else {
        reject(new Error(statusMessage(status)));
      }
    });
  });
}

function findPlaceId(google, service, { name, lat, lng }) {
  return new Promise((resolve, reject) => {
    const request = {
      query: `${name} Kyiv`,
      fields: ['place_id'],
      locationBias: { center: { lat, lng }, radius: 500 }
    };
    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
        resolve(results[0].place_id);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve(null);
      } else {
        reject(new Error(statusMessage(status)));
      }
    });
  });
}

export async function fetchPlaceDetails({ placeId, name, address, lat, lng }) {
  const google = await loadGoogleMaps();
  if (!google?.maps?.places?.PlacesService) {
    throw new Error('Places library unavailable.');
  }
  const service = new google.maps.places.PlacesService(document.createElement('div'));

  let effectiveId = placeId || '';
  if (!effectiveId) {
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    effectiveId = await findPlaceId(google, service, { name, lat, lng });
    if (!effectiveId) return null;
  }

  const details = await getDetailsById(google, service, effectiveId);
  return shape(details);
}
