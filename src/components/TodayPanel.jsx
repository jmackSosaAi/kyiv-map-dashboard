import { getToday, daysBetween, formatRelativeDay, formatDateRange, getCurrentDayName, getCurrentDayShort, isEventActiveOn } from '../utils/timeHelpers';
import { getCached } from '../utils/placeDetailsCache';
import { getCategory } from '../utils/categoryStyles';

const FOOD_CATS = new Set(['restaurant', 'bar', 'cafe', 'club']);

export default function TodayPanel({ events, allPlaces, onSelectPlace, onSelectEvent }) {
  const today = getToday();
  const dayName = getCurrentDayName();
  const dayShort = getCurrentDayShort();

  // Section 1 — Right Now
  const todayEvents = events.filter((e) => isEventActiveOn(e, today));
  const next7End = (() => {
    const [y, m, d] = today.split('-').map(Number);
    const dt = new Date(y, m - 1, d + 7);
    return dt.toISOString().slice(0, 10);
  })();
  const upcomingWeek = events.filter((e) => e.date >= today && e.date <= next7End);

  // Section 2 — This Week (up to 3, sorted by date)
  const weekEvents = upcomingWeek.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  // Section 3 — Want to visit
  const bookmarked = allPlaces
    .filter((p) => p.wantToVisit === true)
    .sort((a, b) => a.name.localeCompare(b.name));
  const bookmarkedShown = bookmarked.slice(0, 5);
  const bookmarkedExtra = bookmarked.length - bookmarkedShown.length;

  // Section 4 — Open today (best-effort from cache)
  const openToday = allPlaces
    .filter((p) => {
      if (!FOOD_CATS.has(p.category)) return false;
      const entry = getCached(p.id);
      if (!entry) return false;
      const weekly = entry.data?.openingHours?.weekly;
      if (!Array.isArray(weekly)) return false;
      const line = weekly.find((l) => l.startsWith(dayShort));
      return line && !line.includes('Closed');
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 5);

  // Don't render if nothing to show
  const hasContent =
    todayEvents.length > 0 || upcomingWeek.length > 0 || bookmarked.length > 0 || openToday.length > 0;
  if (!hasContent) return null;

  // Format today's display date e.g. "Wednesday, May 21"
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="filter">
      <div className="filter-header"><span>Today</span></div>

      {/* Section 1 — Right Now */}
      <div className="today-section">
        <p className="today-date">{todayLabel}</p>
        {todayEvents.map((e) => (
          <button
            key={e.id}
            className="today-row"
            style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '4px 0' }}
            onClick={() => onSelectEvent(e)}
          >
            <span className="today-highlight">🎉 {e.name}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}> is happening today</span>
          </button>
        ))}
        {upcomingWeek.length > 0 && (
          <p className="today-empty">
            {upcomingWeek.length} event{upcomingWeek.length !== 1 ? 's' : ''} in the next 7 days
          </p>
        )}
      </div>

      {/* Section 2 — This Week */}
      {weekEvents.length > 0 && (
        <div className="today-section">
          <h3>This Week</h3>
          {weekEvents.map((e) => {
            const rel = formatRelativeDay(e.date);
            const d = daysBetween(today, e.date);
            return (
              <button
                key={e.id}
                className="today-row"
                style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
                onClick={() => onSelectEvent(e)}
              >
                <span style={{ fontSize: 11, color: 'var(--accent)', minWidth: 60 }}>{rel}</span>
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                <span className="today-badge">in {d}d</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Section 3 — Bookmarked */}
      {bookmarked.length > 0 && (
        <div className="today-section">
          <h3>Bookmarked</h3>
          {bookmarkedShown.map((p) => {
            const cat = getCategory(p.category);
            return (
              <button
                key={p.id}
                className="today-row"
                style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
                onClick={() => onSelectPlace(p.id)}
              >
                <span className="dot" style={{ background: cat.color }} />
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span className="today-badge">{cat.label}</span>
              </button>
            );
          })}
          {bookmarkedExtra > 0 && (
            <p className="today-empty">+{bookmarkedExtra} more</p>
          )}
        </div>
      )}

      {/* Section 4 — Open today */}
      {openToday.length > 0 && (
        <div className="today-section">
          <h3>Likely open today</h3>
          {openToday.map((p) => {
            const cat = getCategory(p.category);
            const sub = [p.cuisine, p.neighborhood].filter(Boolean).join(' · ');
            return (
              <button
                key={p.id}
                className="today-row"
                style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
                onClick={() => onSelectPlace(p.id)}
              >
                <span className="dot" style={{ background: cat.color }} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  {sub && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
