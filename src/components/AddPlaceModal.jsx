import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../utils/categoryStyles';
import { geocodeAddress } from '../utils/geocode';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';
import { parseMapsUrl } from '../utils/parseMapsUrl';

const PLACES_FIELDS = [
  'place_id',
  'name',
  'formatted_address',
  'geometry',
  'website',
  'url',
  'formatted_phone_number',
  'opening_hours',
  'rating',
  'price_level'
];

const PRICE_LEVEL_MAP = ['', '$', '$$', '$$$', '$$$$'];

const EMPTY = {
  name: '',
  category: 'restaurant',
  address: '',
  neighborhood: '',
  lat: '',
  lng: '',
  priority: 3,
  priceLevel: '',
  notes: '',
  safetyNotes: '',
  website: '',
  menuUrl: '',
  eventsUrl: '',
  instagramUrl: '',
  googleMapsUrl: '',
  placeId: ''
};

export default function AddPlaceModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlWarning, setUrlWarning] = useState(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [placesWarning, setPlacesWarning] = useState(null);
  const [placesFilled, setPlacesFilled] = useState(false);
  const placesInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const placesListenerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return;
        if (!google?.maps?.places?.Autocomplete) {
          setPlacesWarning('Places API unavailable. Enable the Places API on your Google Cloud key to use search.');
          return;
        }
        if (!placesInputRef.current) return;
        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(50.35, 30.35),
          new google.maps.LatLng(50.55, 30.75)
        );
        const ac = new google.maps.places.Autocomplete(placesInputRef.current, {
          fields: PLACES_FIELDS,
          componentRestrictions: { country: 'ua' },
          bounds,
          strictBounds: false
        });
        autocompleteRef.current = ac;
        placesListenerRef.current = ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place || !place.geometry || !place.geometry.location) {
            setPlacesWarning('Pick a suggestion from the dropdown — no details returned.');
            return;
          }
          setPlacesWarning(null);
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const extraLines = [];
          if (place.formatted_phone_number) extraLines.push(`📞 ${place.formatted_phone_number}`);
          const hoursText = place.opening_hours?.weekday_text;
          if (hoursText && hoursText.length) extraLines.push(`⏰ ${hoursText.join('; ')}`);
          if (typeof place.rating === 'number') extraLines.push(`⭐ ${place.rating}`);
          const priceLevel = typeof place.price_level === 'number'
            ? PRICE_LEVEL_MAP[place.price_level] || ''
            : '';
          setForm((f) => {
            const appended = extraLines.length
              ? (f.notes ? `${f.notes}\n${extraLines.join('\n')}` : extraLines.join('\n'))
              : f.notes;
            return {
              ...f,
              name: place.name || f.name,
              address: place.formatted_address || f.address,
              lat: lat.toFixed(6),
              lng: lng.toFixed(6),
              googleMapsUrl: place.url || f.googleMapsUrl,
              website: place.website || f.website,
              priceLevel: priceLevel || f.priceLevel,
              placeId: place.place_id || f.placeId,
              notes: appended
            };
          });
          setPlacesFilled(true);
          setInfo(null);
          setError(null);
        });
        setPlacesReady(true);
      })
      .catch((e) => {
        if (cancelled) return;
        setPlacesWarning(e?.message || 'Could not load Google Places.');
      });
    return () => {
      cancelled = true;
      if (placesListenerRef.current) {
        placesListenerRef.current.remove();
        placesListenerRef.current = null;
      }
      autocompleteRef.current = null;
    };
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGeocode() {
    setError(null);
    setInfo(null);
    const addr = form.address.trim();
    if (!addr) {
      setError('Enter an address first (tip: append ", Kyiv, Ukraine").');
      return;
    }
    setGeocoding(true);
    try {
      const { lat, lng, formattedAddress } = await geocodeAddress(addr);
      setForm((f) => ({
        ...f,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address: formattedAddress || f.address
      }));
      setInfo(`Geocoded → ${formattedAddress}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setGeocoding(false);
    }
  }

  function handleParseUrl() {
    setUrlWarning(null);
    if (!urlInput.trim()) {
      setUrlWarning('Paste a Google Maps URL above first.');
      return;
    }
    const result = parseMapsUrl(urlInput);
    if (result.error) {
      setUrlWarning(result.error);
      return;
    }
    setForm((f) => ({
      ...f,
      lat: result.lat.toFixed(6),
      lng: result.lng.toFixed(6),
      googleMapsUrl: urlInput.trim()
    }));
    setUrlWarning(null);
    setInfo(`Coordinates filled from URL: ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!form.name.trim()) { setError('Name is required.'); return; }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Latitude and longitude are required. Use the Geocode button, paste a Maps URL, or enter coordinates manually.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Lat/lng out of range.');
      return;
    }

    onSubmit({
      id: `user-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      address: form.address.trim(),
      neighborhood: form.neighborhood.trim(),
      lat,
      lng,
      priority: Number(form.priority) || 0,
      priceLevel: form.priceLevel,
      notes: form.notes.trim(),
      safetyNotes: form.safetyNotes.trim(),
      placeId: form.placeId,
      links: {
        website: form.website.trim(),
        menuUrl: form.menuUrl.trim(),
        eventsUrl: form.eventsUrl.trim(),
        instagramUrl: form.instagramUrl.trim(),
        googleMapsUrl: form.googleMapsUrl.trim()
      },
      source: 'user'
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add a place</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="muted small">
          Saved only in this browser's localStorage. Tip: enable the Places API on your Google Cloud key, then search below to auto-fill. Manual geocoding still works with <code>, Kyiv, Ukraine</code>.
        </p>

        <form onSubmit={handleSubmit} className="add-form">
          {placesWarning ? (
            <p className="form-warning">{placesWarning}</p>
          ) : (
            <label>
              Search Google Places
              <input
                ref={placesInputRef}
                type="text"
                placeholder='Try "Kanapa Kyiv" or "Puzata Hata Khreshchatyk"'
                autoComplete="off"
                disabled={!placesReady}
              />
            </label>
          )}
          {placesFilled && (
            <p className="form-info" style={{ color: '#2f9e44' }}>Filled from Google Places</p>
          )}

          <label>
            Name *
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </label>

          <label>
            Category
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {CATEGORIES.filter((c) => c.id !== 'home' && c.id !== 'office').map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>

          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Khreshchatyk St, 1, Kyiv, Ukraine"
            />
          </label>
          <div className="inline-actions">
            <button
              type="button"
              className="btn"
              onClick={handleGeocode}
              disabled={geocoding}
            >
              {geocoding ? 'Geocoding…' : 'Geocode address → lat/lng'}
            </button>
          </div>

          <label>
            Or paste a Google Maps URL
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.google.com/maps/place/.../@50.46,30.52,17z/..."
            />
          </label>
          <div className="inline-actions">
            <button type="button" className="btn" onClick={handleParseUrl}>
              Extract lat/lng from URL
            </button>
          </div>
          {urlWarning && <p className="form-warning">{urlWarning}</p>}

          <div className="grid-2">
            <label>
              Latitude *
              <input
                type="number" step="any" inputMode="decimal"
                value={form.lat} onChange={(e) => update('lat', e.target.value)}
                placeholder="50.4501"
              />
            </label>
            <label>
              Longitude *
              <input
                type="number" step="any" inputMode="decimal"
                value={form.lng} onChange={(e) => update('lng', e.target.value)}
                placeholder="30.5234"
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              Neighborhood
              <input value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} />
            </label>
            <label>
              Price level
              <select value={form.priceLevel} onChange={(e) => update('priceLevel', e.target.value)}>
                <option value="">—</option>
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
                <option value="$$$$">$$$$</option>
              </select>
            </label>
          </div>

          <label>
            Priority (1–5)
            <input
              type="number" min="0" max="5"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
            />
          </label>

          <label>
            Notes
            <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </label>

          <label>
            Safety notes
            <textarea rows={2} value={form.safetyNotes} onChange={(e) => update('safetyNotes', e.target.value)} />
          </label>

          <div className="grid-2">
            <label>
              Website
              <input value={form.website} onChange={(e) => update('website', e.target.value)} />
            </label>
            <label>
              Menu URL
              <input value={form.menuUrl} onChange={(e) => update('menuUrl', e.target.value)} />
            </label>
            <label>
              Events URL
              <input value={form.eventsUrl} onChange={(e) => update('eventsUrl', e.target.value)} />
            </label>
            <label>
              Instagram
              <input value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} />
            </label>
          </div>

          {info && <p className="form-info">{info}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">Add place</button>
          </div>
        </form>
      </div>
    </div>
  );
}
