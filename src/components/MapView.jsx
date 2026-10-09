import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { KYIV_CENTER, KYIV_DEFAULT_ZOOM } from '../utils/geo';
import { getCategoryColor, isAnchorCategory } from '../utils/categoryStyles';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

// Build a circular SVG marker icon. Anchors get a thicker white ring.
// User-added markers get a yellow ring to distinguish them from sample data.
function buildMarkerIcon(google, color, { selected = false, anchor = false, isUser = false } = {}) {
  const base = anchor ? 11 : 8;
  const scale = selected ? base + 2 : base;
  const stroke = anchor ? '#ffffff' : isUser ? '#facc15' : '#0b1220';
  const strokeWeight = anchor ? 3 : isUser ? 2.5 : selected ? 2.5 : 1.5;
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: stroke,
    strokeWeight,
    scale
  };
}

// Cluster bubble renderer: yellow → orange → red as count grows.
function customClusterRenderer({ count, position }) {
  const color = count < 6 ? '#facc15' : count < 16 ? '#f59e0b' : '#ef4444';
  const size = Math.min(56, 32 + count * 2);
  return new google.maps.Marker({
    position,
    label: { text: String(count), color: '#0b1220', fontSize: '12px', fontWeight: '700' },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.95,
      strokeColor: '#0b1220',
      strokeWeight: 2,
      scale: size / 4
    },
    zIndex: 500
  });
}

export default function MapView({
  places,
  selectedPlaceId,
  onSelectPlace,
  routeRequest,
  onRouteResult,
  onRouteError,
  mapTypeId = 'hybrid',
  onMapTypeChange,
  routeMode,
  routeOriginId
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const clustererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const onMapTypeChangeRef = useRef(onMapTypeChange);

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => { onMapTypeChangeRef.current = onMapTypeChange; }, [onMapTypeChange]);

  // 1. Mount: load script + create map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const map = new google.maps.Map(containerRef.current, {
          center: KYIV_CENTER,
          zoom: KYIV_DEFAULT_ZOOM,
          mapTypeId,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          tilt: 0
        });
        map.addListener('maptypeid_changed', () => {
          const next = map.getMapTypeId();
          onMapTypeChangeRef.current?.(next);
        });
        mapRef.current = map;
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: { strokeColor: '#facc15', strokeOpacity: 0.95, strokeWeight: 5 }
        });
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || String(err));
        setStatus('error');
      });
    return () => {
      cancelled = true;
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
    // mapTypeId is only used at init; subsequent changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the map's mapTypeId in sync if it's changed from outside.
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    if (map && map.getMapTypeId() !== mapTypeId) {
      map.setMapTypeId(mapTypeId);
    }
  }, [mapTypeId, status]);

  // 2. Sync markers with `places` (skip rows with missing coords).
  useEffect(() => {
    if (status !== 'ready' || !window.google) return;
    const google = window.google;
    const map = mapRef.current;
    const existing = markersRef.current;
    const placesWithCoords = places.filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    const nextIds = new Set(placesWithCoords.map((p) => p.id));

    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    }

    const inRouteMode = !!routeMode;
    const isPickDest = routeMode?.stage === 'pickDest';

    const anchorMarkers = [];
    const clusterableMarkers = [];

    for (const place of placesWithCoords) {
      const color = getCategoryColor(place.category);
      const anchor = isAnchorCategory(place.category);
      const selected = place.id === selectedPlaceId;
      const isUser = place.source === 'user';
      const isOrigin = isPickDest && place.id === routeOriginId;
      const icon = buildMarkerIcon(google, color, { selected, anchor, isUser });

      // Route-mode visual tweaks
      if (inRouteMode) {
        icon.fillOpacity = 0.85;
      }
      if (isOrigin) {
        icon.strokeColor = '#facc15';
        icon.strokeWeight = 5;
        icon.fillOpacity = 1;
      }

      let marker = existing.get(place.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          title: place.name,
          icon,
          zIndex: anchor ? 1000 : selected ? 900 : 100
        });
        marker.addListener('click', () => onSelectPlace?.(place.id));
        existing.set(place.id, marker);
      } else {
        marker.setPosition({ lat: place.lat, lng: place.lng });
        marker.setTitle(place.name);
        marker.setIcon(icon);
        marker.setZIndex(isOrigin ? 950 : anchor ? 1000 : selected ? 900 : 100);
      }

      if (anchor) {
        anchorMarkers.push(marker);
      } else {
        clusterableMarkers.push(marker);
      }
    }

    // Anchor markers stay directly on the map — always visible.
    anchorMarkers.forEach((m) => m.setMap(map));

    // Rebuild clusterer with non-anchor markers.
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    } else {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        algorithm: new SuperClusterAlgorithm({ radius: 60, maxZoom: 14 }),
        renderer: { render: customClusterRenderer }
      });
    }
    // Hand ownership to the clusterer (removes markers from direct map, re-adds at right zooms).
    clusterableMarkers.forEach((m) => m.setMap(null));
    clustererRef.current.addMarkers(clusterableMarkers);
  }, [places, selectedPlaceId, status, onSelectPlace, routeMode, routeOriginId]);

  // 3. Pan/zoom to selected place (skip rows with missing coords).
  useEffect(() => {
    if (status !== 'ready' || !selectedPlaceId) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
    const map = mapRef.current;
    map.panTo({ lat: place.lat, lng: place.lng });
    if (map.getZoom() < 15) map.setZoom(15);
  }, [selectedPlaceId, places, status]);

  const routeKey = useMemo(() => {
    if (!routeRequest) return null;
    return `${routeRequest.originId}|${routeRequest.destinationId}|${routeRequest.mode}`;
  }, [routeRequest]);

  // 4. Routing.
  useEffect(() => {
    if (status !== 'ready') return;
    const renderer = directionsRendererRef.current;
    const service = directionsServiceRef.current;
    if (!routeRequest) {
      renderer.set('directions', null);
      return;
    }
    const origin = places.find((p) => p.id === routeRequest.originId);
    const destination = places.find((p) => p.id === routeRequest.destinationId);
    if (!origin || !destination) {
      onRouteError?.('Origin or destination not found');
      return;
    }
    const google = window.google;
    const modeMap = {
      WALKING: google.maps.TravelMode.WALKING,
      DRIVING: google.maps.TravelMode.DRIVING,
      TRANSIT: google.maps.TravelMode.TRANSIT,
      BICYCLING: google.maps.TravelMode.BICYCLING
    };
    const travelMode = modeMap[routeRequest.mode] || google.maps.TravelMode.WALKING;

    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode
      },
      (result, statusCode) => {
        if (statusCode === 'OK' && result) {
          renderer.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          onRouteResult?.({
            distanceMeters: leg?.distance?.value ?? null,
            durationSeconds: leg?.duration?.value ?? null,
            mode: routeRequest.mode,
            originName: origin.name,
            destName: destination.name
          });
        } else {
          renderer.set('directions', null);
          onRouteError?.(`Routing failed: ${statusCode}`);
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, status]);

  if (status === 'error') {
    return (
      <div className="map-error">
        <h2>Map failed to load</h2>
        <p>{error}</p>
        <p>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to a <code>.env</code> file in the
          project root and restart the dev server. See <code>.env.example</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="map-container">
      {status === 'loading' && <div className="map-loading">Loading map…</div>}
      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}
