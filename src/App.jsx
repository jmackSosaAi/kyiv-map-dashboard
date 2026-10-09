import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import PlacePanel from './components/PlacePanel';
import RoutePanel from './components/RoutePanel';
import AddPlaceModal from './components/AddPlaceModal';
import InstallPrompt from './components/InstallPrompt';
import { PLACES, HOME_ID, OFFICE_ID, normalizePlace } from './data/places';
import { CULTURAL_EVENTS } from './data/events';
import { CATEGORIES } from './utils/categoryStyles';
import { applyFilters } from './utils/placeFilters';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { resetAllLocalData } from './utils/migrate';
import { geocodeAddress } from './utils/geocode';

const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const LS = {
  categories:   'kmd.v2.categories',
  geoFilter:    'kmd.v2.geoFilter',
  travelMode:   'kmd.v2.travelMode',
  origin:       'kmd.v2.originId',
  mapType:      'kmd.v2.mapTypeId',
  selected:     'kmd.v2.selectedPlaceId',
  userPlaces:   'kmd.v2.userPlaces',
  placeStatus:  'kmd.v2.placeStatus'
};

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Persisted state
  const [enabledCategories, setEnabledCategories] = useLocalStorage(LS.categories, ALL_CATEGORY_IDS);
  const [geoFilter, setGeoFilter] = useLocalStorage(LS.geoFilter, 'none');
  const [travelMode, setTravelMode] = useLocalStorage(LS.travelMode, 'WALKING');
  const [originId, setOriginId] = useLocalStorage(LS.origin, HOME_ID);
  const [mapTypeId, setMapTypeId] = useLocalStorage(LS.mapType, 'hybrid');
  const [selectedPlaceId, setSelectedPlaceIdRaw] = useLocalStorage(LS.selected, null);
  const [userPlaces, setUserPlaces] = useLocalStorage(LS.userPlaces, []);
  const [placeStatus, setPlaceStatus] = useLocalStorage(LS.placeStatus, {});

  // Ephemeral state
  const [search, setSearch] = useState('');
  const [routeRequest, setRouteRequest] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routeMode, setRouteMode] = useState(null);
  // routeMode: null | { stage: 'pickOrigin' | 'pickDest', originId: string | null }

  // Combined places list (sample + user) with status overrides applied.
  const allPlaces = useMemo(() => {
    const merged = [...PLACES, ...userPlaces.map(normalizePlace)];
    return merged.map((p) => {
      const override = placeStatus[p.id];
      return override ? { ...p, ...override } : p;
    });
  }, [userPlaces, placeStatus]);

  const homePlace   = useMemo(() => allPlaces.find((p) => p.id === HOME_ID),   [allPlaces]);
  const officePlace = useMemo(() => allPlaces.find((p) => p.id === OFFICE_ID), [allPlaces]);

  const visiblePlaces = useMemo(
    () => applyFilters(allPlaces, { search, enabledCategories, geoFilter, homePlace, officePlace }),
    [allPlaces, search, enabledCategories, geoFilter, homePlace, officePlace]
  );

  const selectedPlace = useMemo(
    () => allPlaces.find((p) => p.id === selectedPlaceId) || null,
    [allPlaces, selectedPlaceId]
  );

  useEffect(() => {
    if (selectedPlaceId && !selectedPlace) setSelectedPlaceIdRaw(null);
  }, [selectedPlaceId, selectedPlace, setSelectedPlaceIdRaw]);

  const clearRoute = useCallback(() => {
    setRouteRequest(null);
    setRouteResult(null);
    setRouteError(null);
  }, []);

  const handleRouteModePick = useCallback((placeId) => {
    setRouteMode((prev) => {
      if (!prev) return prev;
      if (prev.stage === 'pickOrigin') {
        return { stage: 'pickDest', originId: placeId };
      }
      if (prev.stage === 'pickDest') {
        if (placeId === prev.originId) return prev; // ignore self-route
        setRouteRequest({
          originId: prev.originId,
          destinationId: placeId,
          mode: travelMode
        });
        return null;
      }
      return prev;
    });
  }, [travelMode]);

  const startRouteMode = useCallback(() => {
    clearRoute();
    setRouteMode({ stage: 'pickOrigin', originId: null });
  }, [clearRoute]);

  const cancelRouteMode = useCallback(() => setRouteMode(null), []);

  const handleSelectPlace = useCallback((id) => {
    if (routeMode) {
      handleRouteModePick(id);
      return;
    }
    setSelectedPlaceIdRaw(id);
  }, [routeMode, handleRouteModePick, setSelectedPlaceIdRaw]);

  const handleSelectPlaceFromSidebar = useCallback((id) => {
    if (routeMode) {
      handleRouteModePick(id);
      setSidebarOpen(false);
      return;
    }
    setSelectedPlaceIdRaw(id);
    setSidebarOpen(false);
  }, [routeMode, handleRouteModePick]);

  const toggleCategory = useCallback((id) => {
    setEnabledCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, [setEnabledCategories]);

  const setAllCategories = useCallback(
    (on) => setEnabledCategories(on ? ALL_CATEGORY_IDS : []),
    [setEnabledCategories]
  );

  const handleRouteFrom = useCallback(
    (originPlaceId) => {
      if (!selectedPlaceId || originPlaceId === selectedPlaceId) return;
      setOriginId(originPlaceId);
      setRouteError(null);
      setRouteResult(null);
      setRouteRequest({
        originId: originPlaceId,
        destinationId: selectedPlaceId,
        mode: travelMode
      });
    },
    [selectedPlaceId, travelMode, setOriginId]
  );

  const togglePlaceFlag = useCallback((id, flag, value) => {
    setPlaceStatus((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [flag]: value }
    }));
  }, [setPlaceStatus]);

  // Geocode a place's address and persist lat/lng (+ optional formatted address)
  // as a placeStatus override. Works for both sample and user-added places.
  const geocodePlace = useCallback(async (id) => {
    const place = allPlaces.find((p) => p.id === id);
    if (!place) throw new Error('Place not found');
    const addr = (place.address || '').trim();
    if (!addr) throw new Error('No address on file. Open Add modal or edit the CSV first.');
    const { lat, lng, formattedAddress } = await geocodeAddress(addr);
    setPlaceStatus((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        lat,
        lng,
        ...(formattedAddress ? { address: formattedAddress } : {})
      }
    }));
    return { lat, lng, formattedAddress };
  }, [allPlaces, setPlaceStatus]);

  const addUserPlace = useCallback((place) => {
    setUserPlaces((prev) => [...prev, place]);
    setSelectedPlaceIdRaw(place.id);
    setShowAddModal(false);
  }, [setUserPlaces, setSelectedPlaceIdRaw]);

  const importPlaces = useCallback((places) => {
    if (!places?.length) return;
    setUserPlaces((prev) => [...prev, ...places]);
  }, [setUserPlaces]);

  const deleteUserPlace = useCallback((id) => {
    setUserPlaces((prev) => prev.filter((p) => p.id !== id));
    setPlaceStatus((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (selectedPlaceId === id) setSelectedPlaceIdRaw(null);
    if (originId === id) setOriginId(HOME_ID);
  }, [setUserPlaces, setPlaceStatus, selectedPlaceId, originId, setSelectedPlaceIdRaw, setOriginId]);

  const routeOriginPlace = useMemo(
    () => allPlaces.find((p) => p.id === routeMode?.originId) ?? null,
    [allPlaces, routeMode]
  );

  const hasActiveRoute = !!(routeResult || routeError);

  const handleSelectEvent = useCallback((event) => {
    if (event?.anchorPlaceId) handleSelectPlace(event.anchorPlaceId);
  }, [handleSelectPlace]);

  const handleResetData = useCallback(() => {
    resetAllLocalData();
    window.location.reload();
  }, []);

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="topbar">
        <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)} aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}>☰</button>
        <span className="topbar-title">Kyiv Dashboard</span>
      </div>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        places={visiblePlaces}
        totalCount={allPlaces.length}
        selectedPlaceId={selectedPlaceId}
        onSelectPlace={handleSelectPlaceFromSidebar}
        search={search}
        onChangeSearch={setSearch}
        enabledCategories={enabledCategories}
        onToggleCategory={toggleCategory}
        onSetAllCategories={setAllCategories}
        geoFilter={geoFilter}
        onChangeGeoFilter={setGeoFilter}
        hasHome={!!homePlace}
        hasOffice={!!officePlace}
        onAddPlace={() => setShowAddModal(true)}
        allPlaces={allPlaces}
        allPlacesForSearch={allPlaces}
        onImportPlaces={importPlaces}
        onResetData={handleResetData}
        events={CULTURAL_EVENTS}
        onSelectEvent={handleSelectEvent}
        theme={theme}
        onToggleTheme={toggleTheme}
        routeMode={routeMode}
        onStartRouteMode={startRouteMode}
        onCancelRouteMode={cancelRouteMode}
        onClearRoute={clearRoute}
        routeOriginPlace={routeOriginPlace}
        hasActiveRoute={hasActiveRoute}
      />

      <main className="main">
        <MapView
          places={visiblePlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectPlace}
          routeRequest={routeRequest}
          onRouteResult={(r) => { setRouteResult(r); setRouteError(null); }}
          onRouteError={(e) => { setRouteError(e); setRouteResult(null); }}
          mapTypeId={mapTypeId}
          onMapTypeChange={setMapTypeId}
          routeMode={routeMode}
          routeOriginId={routeMode?.originId ?? null}
        />

        <div className="overlays">
          {selectedPlace && (
            <PlacePanel
              place={selectedPlace}
              allPlaces={allPlaces}
              homePlace={homePlace}
              officePlace={officePlace}
              onClose={() => setSelectedPlaceIdRaw(null)}
              onRouteFrom={handleRouteFrom}
              travelMode={travelMode}
              onChangeTravelMode={setTravelMode}
              originId={originId === selectedPlace.id ? (homePlace?.id || '') : originId}
              onChangeOrigin={setOriginId}
              onTogglePlaceFlag={togglePlaceFlag}
              onGeocodePlace={geocodePlace}
              onDeletePlace={deleteUserPlace}
            />
          )}
          <RoutePanel result={routeResult} error={routeError} onClear={clearRoute} />
        </div>
      </main>

      {showAddModal && (
        <AddPlaceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={addUserPlace}
        />
      )}
      <InstallPrompt />
    </div>
  );
}
