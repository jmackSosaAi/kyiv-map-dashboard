import CategoryFilter from './CategoryFilter';
import GeoFilter from './GeoFilter';
import EventsPanel from './EventsPanel';
import StoragePanel from './StoragePanel';
import RouteHighlighter from './RouteHighlighter';
import TodayPanel from './TodayPanel';
import { getCategory } from '../utils/categoryStyles';
import SearchBar from './SearchBar';
import { getEntryCount } from '../utils/journal';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}

export default function Sidebar({
  places,
  totalCount,
  selectedPlaceId,
  onSelectPlace,
  search,
  onChangeSearch,
  enabledCategories,
  onToggleCategory,
  onSetAllCategories,
  geoFilter,
  onChangeGeoFilter,
  hasHome,
  hasOffice,
  onAddPlace,
  allPlaces,
  allPlacesForSearch,
  onImportPlaces,
  onResetData,
  events,
  onSelectEvent,
  theme,
  onToggleTheme,
  routeMode,
  onStartRouteMode,
  onCancelRouteMode,
  onClearRoute,
  routeOriginPlace,
  hasActiveRoute
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <h1>Kyiv Dashboard</h1>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <p className="muted">{places.length} of {totalCount} places shown</p>
        <SearchBar
          places={allPlacesForSearch}
          value={search}
          onChange={onChangeSearch}
          onSelectPlace={onSelectPlace}
        />
        <button className="btn primary block" onClick={onAddPlace}>+ Add place</button>
      </div>

      <TodayPanel
        events={events}
        allPlaces={allPlacesForSearch}
        onSelectPlace={onSelectPlace}
        onSelectEvent={onSelectEvent}
      />

      <RouteHighlighter
        routeMode={routeMode}
        onStartRouteMode={onStartRouteMode}
        onCancelRouteMode={onCancelRouteMode}
        onClearRoute={onClearRoute}
        originPlace={routeOriginPlace}
        hasActiveRoute={hasActiveRoute}
      />

      <CategoryFilter
        enabled={enabledCategories}
        onToggle={onToggleCategory}
        onSetAll={onSetAllCategories}
      />

      <GeoFilter
        value={geoFilter}
        onChange={onChangeGeoFilter}
        hasHome={hasHome}
        hasOffice={hasOffice}
      />

      <EventsPanel events={events} onSelectEvent={onSelectEvent} />

      <div className="place-list-wrap">
        <div className="filter-header"><span>Places</span></div>
        <ul className="place-list">
          {places.map((p) => {
            const cat = getCategory(p.category);
            const selected = p.id === selectedPlaceId;
            const hasCoords = Number.isFinite(p.lat) && Number.isFinite(p.lng);
            return (
              <li key={p.id}>
                <button
                  className={selected ? 'place-row selected' : 'place-row'}
                  onClick={() => onSelectPlace(p.id)}
                >
                  <span className="dot" style={{ background: cat.color }} />
                  <span className="place-text">
                    <span className="place-name">
                      {p.name}
                      {p.source === 'user' && <span className="tag-user">user</span>}
                      {!hasCoords && <span className="tag-warn">no coords</span>}
                      {getEntryCount(p.id) > 0 && (
                        <span className="entry-badge" title={`${getEntryCount(p.id)} journal entries`}>
                          📝 {getEntryCount(p.id)}
                        </span>
                      )}
                    </span>
                    <span className="place-meta">
                      {cat.label}
                      {p.neighborhood ? ` • ${p.neighborhood}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {places.length === 0 && (
            <li className="empty">No places match the current filters.</li>
          )}
        </ul>
      </div>

      <StoragePanel
        allPlaces={allPlaces}
        onImportPlaces={onImportPlaces}
        onResetData={onResetData}
      />
    </aside>
  );
}
