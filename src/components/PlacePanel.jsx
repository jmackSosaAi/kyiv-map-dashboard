import { useEffect, useState } from 'react';
import { getCategory } from '../utils/categoryStyles';
import { googleMapsSearchUrl, streetViewUrl } from '../utils/mapLinks';
import StreetViewPano from './StreetViewPano';
import { distanceMeters, formatMeters } from '../utils/geo';
import { copyToClipboard } from '../utils/clipboard';
import { stringifyCsv, placeToCsvRow, CSV_HEADERS } from '../utils/csv';
import { fetchPlaceDetails } from '../utils/placeDetails';
import { getCached, setCached, invalidateCached } from '../utils/placeDetailsCache';
import { getEntries, addEntry, removeEntry } from '../utils/journal';

const VENUE_CATEGORIES = new Set(['restaurant', 'bar', 'club', 'cafe', 'theater', 'grocery', 'gym', 'errand']);

function relativeTime(ts) {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function PlacePanel({
  place,
  allPlaces,
  homePlace,
  officePlace,
  onClose,
  onRouteFrom,
  travelMode,
  onChangeTravelMode,
  originId,
  onChangeOrigin,
  onTogglePlaceFlag,
  onGeocodePlace,
  onDeletePlace
}) {
  const [copied, setCopied] = useState(null);
  const [geoState, setGeoState] = useState({ loading: false, error: null });
  const [details, setDetails] = useState(null);
  const [detailsFetchedAt, setDetailsFetchedAt] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [entries, setEntries] = useState(() => getEntries(place.id));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newText, setNewText] = useState('');
  const [showStreetView, setShowStreetView] = useState(false);

  useEffect(() => {
    if (!place) return undefined;
    let cancelled = false;
    setDetails(null);
    setDetailsFetchedAt(null);
    setDetailsError(null);
    setDetailsLoading(false);
    setShowAllHours(false);
    const cached = getCached(place.id);
    if (cached) {
      setDetails(cached.data);
      setDetailsFetchedAt(cached.fetchedAt);
      return undefined;
    }
    if (!VENUE_CATEGORIES.has(place.category)) return undefined;
    const canFetch = !!place.placeId
      || (place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
    if (!canFetch) return undefined;
    setDetailsLoading(true);
    fetchPlaceDetails({
      placeId: place.placeId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng
    })
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setDetailsError('No live data found for this place.');
        } else {
          setDetails(data);
          const now = Date.now();
          setDetailsFetchedAt(now);
          setCached(place.id, data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailsError(err?.message || 'Could not load live details.');
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });
    return () => { cancelled = true; };
  }, [place?.id]);

  // Re-read journal entries whenever the selected place changes.
  useEffect(() => {
    if (!place) return;
    setEntries(getEntries(place.id));
    setShowAddForm(false);
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewText('');
    setShowStreetView(false);
  }, [place?.id]);

  if (!place) return null;

  const cat = getCategory(place.category);
  const isHome = homePlace && place.id === homePlace.id;
  const isOffice = officePlace && place.id === officePlace.id;
  const isUser = place.source === 'user';
  const hasCoords = Number.isFinite(place.lat) && Number.isFinite(place.lng);

  const distFromHome = homePlace && hasCoords && Number.isFinite(homePlace.lat)
    ? distanceMeters(place, homePlace) : null;
  const distFromOffice = officePlace && hasCoords && Number.isFinite(officePlace.lat)
    ? distanceMeters(place, officePlace) : null;

  const links = place.links || {};
  const hasAnyExtraLink = links.menuUrl || links.eventsUrl || links.instagramUrl || links.website;

  const originOptions = allPlaces.filter((p) => p.id !== place.id);

  async function copy(label, text) {
    const ok = await copyToClipboard(text);
    setCopied(ok ? label : `${label} (copy failed)`);
    setTimeout(() => setCopied(null), 1500);
  }

  async function runFetchDetails({ refresh = false } = {}) {
    if (!place) return;
    if (refresh) invalidateCached(place.id);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const data = await fetchPlaceDetails({
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng
      });
      if (!data) {
        setDetailsError('No live data found for this place.');
        setDetails(null);
        setDetailsFetchedAt(null);
      } else {
        setDetails(data);
        const now = Date.now();
        setDetailsFetchedAt(now);
        setCached(place.id, data);
      }
    } catch (err) {
      setDetailsError(err?.message || 'Could not load live details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  const canFetchDetails = !!place.placeId
    || (place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
  const detailsWebsiteIsNew = details?.website
    && details.website !== (place.links?.website || '');

  const csvRowText = stringifyCsv([CSV_HEADERS, placeToCsvRow(place)]);

  return (
    <div className="place-panel">
      <div className="place-panel-header" style={{ borderColor: cat.color }}>
        <div>
          <div className="chip-row">
            <span className="chip" style={{ background: cat.color }}>{cat.label}</span>
            {place.neighborhood && <span className="chip muted-chip">{place.neighborhood}</span>}
            {place.priceLevel && <span className="chip muted-chip">{place.priceLevel}</span>}
            {place.priority > 0 && <span className="chip muted-chip">★ {place.priority}</span>}
            {isUser && <span className="chip muted-chip">user-added</span>}
            {!hasCoords && <span className="chip muted-chip">no coords</span>}
          </div>
          <h2>{place.name}</h2>
          {place.address && <p className="muted">{place.address}</p>}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </div>

      {(distFromHome != null || distFromOffice != null) && (
        <div className="dist-row">
          {distFromHome != null && (
            <span><strong>Home:</strong> {formatMeters(distFromHome)}</span>
          )}
          {distFromOffice != null && (
            <span><strong>Office:</strong> {formatMeters(distFromOffice)}</span>
          )}
        </div>
      )}

      {place.notes && <p className="place-notes">{place.notes}</p>}

      {(place.safetyNotes || place.metadata?.safetyNotes) && (
        <p className="safety-notes">
          <strong>Safety:</strong> {place.safetyNotes || place.metadata.safetyNotes}
        </p>
      )}

      <div className="flag-row">
        <label className={`flag ${place.visited ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={!!place.visited}
            onChange={(e) => onTogglePlaceFlag(place.id, 'visited', e.target.checked)}
          />
          Visited
        </label>
        <label className={`flag ${place.wantToVisit ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={!!place.wantToVisit}
            onChange={(e) => onTogglePlaceFlag(place.id, 'wantToVisit', e.target.checked)}
          />
          Want to visit
        </label>
      </div>

      <div className="journal-section">
        <div className="journal-header">
          <strong>📝 Visits &amp; Notes</strong>
          <span className="entry-count">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {!showAddForm && (
          <button
            type="button"
            className="btn small"
            style={{ marginTop: 6 }}
            onClick={() => setShowAddForm(true)}
          >
            + Add entry
          </button>
        )}

        {showAddForm && (
          <div className="journal-add-form">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <textarea
              className="journal-add-form textarea"
              placeholder="What did you do, eat, see?"
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="journal-add-actions">
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setShowAddForm(false);
                  setNewText('');
                  setNewDate(new Date().toISOString().slice(0, 10));
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn small primary"
                disabled={!newText.trim()}
                onClick={() => {
                  const updated = addEntry(place.id, { date: newDate, text: newText.trim() });
                  setEntries(updated);
                  setShowAddForm(false);
                  setNewText('');
                  setNewDate(new Date().toISOString().slice(0, 10));
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {entries.length === 0 && !showAddForm && (
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            No visits logged yet. Click Add entry to start your journal.
          </p>
        )}

        {entries.length > 0 && (
          <div className="journal-list">
            {entries.map((entry) => (
              <div key={entry.id} className="journal-entry">
                <span className="journal-entry-date">
                  {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(entry.date + 'T12:00:00'))}
                </span>
                {/* TODO: edit entry inline */}
                <span className="journal-entry-text">{entry.text}</span>
                <button
                  type="button"
                  className="journal-entry-delete"
                  aria-label="Delete entry"
                  onClick={() => {
                    if (window.confirm('Delete this journal entry?')) {
                      setEntries(removeEntry(place.id, entry.id));
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="live-details">
        <div className="details-meta">
          <strong>Live details</strong>
          {detailsFetchedAt && (
            <span className="muted small">Fetched {relativeTime(detailsFetchedAt)}</span>
          )}
        </div>

        {detailsLoading && <p className="muted small">Fetching live details…</p>}
        {detailsError && <p className="form-error small">{detailsError}</p>}

        {!detailsLoading && !details && !detailsError && (
          <button
            className="btn small"
            disabled={!canFetchDetails}
            onClick={() => runFetchDetails()}
          >
            {canFetchDetails ? 'Fetch live details' : 'Needs name + coords or place_id'}
          </button>
        )}

        {details && (
          <>
            {details.openingHours && (
              <div className="hours-today">
                {details.openingHours.today && (
                  <span>{details.openingHours.today}</span>
                )}
                {typeof details.isOpenNow === 'boolean' && (
                  <span className={details.isOpenNow ? 'open-badge' : 'closed-badge'}>
                    {details.isOpenNow ? 'Open now' : 'Closed now'}
                  </span>
                )}
              </div>
            )}

            {details.openingHours?.weekly?.length > 0 && (
              <div className="hours-week">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setShowAllHours((v) => !v)}
                >
                  {showAllHours ? 'Hide hours' : 'Show all hours'}
                </button>
                {showAllHours && (
                  <ul>
                    {details.openingHours.weekly.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(details.phone || detailsWebsiteIsNew || details.rating != null) && (
              <div className="action-grid">
                {details.phone && (
                  <a className="btn" href={`tel:${details.phone.replace(/\s+/g, '')}`}>
                    {details.phone}
                  </a>
                )}
                {detailsWebsiteIsNew && (
                  <a className="btn" href={details.website} target="_blank" rel="noreferrer">
                    Website (live)
                  </a>
                )}
                {details.rating != null && (
                  <span className="btn" aria-label="rating" style={{ cursor: 'default' }}>
                    ★ {details.rating}
                    {details.userRatingsTotal != null && ` (${details.userRatingsTotal} reviews)`}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="refresh-btn"
              onClick={() => runFetchDetails({ refresh: true })}
              disabled={detailsLoading}
            >
              Refresh
            </button>
          </>
        )}
      </div>

      {hasCoords ? (
        <>
          <div className="action-grid">
            <a className="btn" href={googleMapsSearchUrl(place)} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
            <button
              className="btn"
              onClick={() => setShowStreetView(true)}
              disabled={showStreetView}
            >
              🚶 Street View here
            </button>
          </div>
          {showStreetView && (
            <>
              <StreetViewPano
                lat={place.lat}
                lng={place.lng}
                onClose={() => setShowStreetView(false)}
              />
              <div className="street-view-fallback">
                <a href={streetViewUrl(place)} target="_blank" rel="noreferrer">
                  Open in Google Maps Street View ↗
                </a>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="no-coords-block">
          <p className="form-warning small">
            No coordinates yet. {place.address
              ? 'Geocode the saved address, or edit the CSV.'
              : 'Add an address (re-import via CSV), then geocode.'}
          </p>
          <button
            className="btn small"
            disabled={!place.address || geoState.loading || !onGeocodePlace}
            onClick={async () => {
              setGeoState({ loading: true, error: null });
              try {
                await onGeocodePlace(place.id);
                setGeoState({ loading: false, error: null });
              } catch (err) {
                setGeoState({ loading: false, error: err.message || String(err) });
              }
            }}
          >
            {geoState.loading ? 'Geocoding…' : 'Geocode address → save'}
          </button>
          {geoState.error && <p className="form-error small">{geoState.error}</p>}
        </div>
      )}

      {hasAnyExtraLink && (
        <div className="action-grid">
          {links.website && (
            <a className="btn" href={links.website} target="_blank" rel="noreferrer">Website</a>
          )}
          {links.menuUrl && (
            <a className="btn" href={links.menuUrl} target="_blank" rel="noreferrer">Menu</a>
          )}
          {links.eventsUrl && (
            <a className="btn" href={links.eventsUrl} target="_blank" rel="noreferrer">Events</a>
          )}
          {links.instagramUrl && (
            <a className="btn" href={links.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
          )}
        </div>
      )}

      <div className="copy-row">
        <button
          className="btn small"
          disabled={!hasCoords}
          onClick={() => copy('coords', `${place.lat},${place.lng}`)}
        >
          Copy coords
        </button>
        <button
          className="btn small"
          disabled={!hasCoords}
          onClick={() => copy('maps link', googleMapsSearchUrl(place))}
        >
          Copy Maps link
        </button>
        <button className="btn small" onClick={() => copy('CSV row', csvRowText)}>
          Copy CSV row
        </button>
        {copied && <span className="copy-feedback">Copied {copied}</span>}
      </div>

      <div className="route-controls">
        <label className="travel-mode">
          Travel mode
          <select value={travelMode} onChange={(e) => onChangeTravelMode(e.target.value)}>
            <option value="WALKING">Walking</option>
            <option value="DRIVING">Driving</option>
            <option value="TRANSIT">Transit</option>
            <option value="BICYCLING">Bicycling</option>
          </select>
        </label>

        <label className="travel-mode">
          Origin
          <select value={originId} onChange={(e) => onChangeOrigin(e.target.value)}>
            {originOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <div className="route-buttons">
          <button
            className="btn primary"
            onClick={() => onRouteFrom(originId)}
            disabled={!originId || originId === place.id || !hasCoords}
          >
            Route from selected origin
          </button>
          {homePlace && !isHome && (
            <button className="btn" onClick={() => onRouteFrom(homePlace.id)} disabled={!hasCoords}>
              Home
            </button>
          )}
          {officePlace && !isOffice && (
            <button className="btn" onClick={() => onRouteFrom(officePlace.id)} disabled={!hasCoords}>
              Office
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <button className="btn danger" onClick={() => onDeletePlace(place.id)}>
          Delete this place
        </button>
      )}
    </div>
  );
}
