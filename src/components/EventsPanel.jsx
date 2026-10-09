import CalendarExportButton from './CalendarExportButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISO(d) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRange(startISO, endISO) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const sMonth = MONTHS[s.getMonth()];
  if (startISO === endISO) return `${sMonth} ${s.getDate()}`;
  if (s.getMonth() === e.getMonth()) return `${sMonth} ${s.getDate()}–${e.getDate()}`;
  return `${sMonth} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
}

function daysUntil(startISO) {
  const today = parseISO(todayISO());
  const start = parseISO(startISO);
  const ms = start.getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

function whenLabel(startISO, endISO) {
  const d = daysUntil(startISO);
  if (d < 0) {
    // Event has started; check if still ongoing
    const endDays = daysUntil(endISO);
    if (endDays >= 0) return 'happening now';
    return '';
  }
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

export default function EventsPanel({ events, onSelectEvent }) {
  const today = todayISO();
  const upcoming = events.filter((e) => e.endDate >= today);

  if (upcoming.length === 0) return null;

  return (
    <div className="filter">
      <div className="filter-header"><span>Coming Up</span></div>
      <ul className="place-list">
        {upcoming.map((e) => (
          <li key={e.id}>
            <button
              className="place-row event-row"
              onClick={() => onSelectEvent(e)}
            >
              <span className="place-text">
                <span className="place-name">{e.name}</span>
                <span className="event-meta">
                  <span className="event-date">{formatRange(e.date, e.endDate)}</span>
                  <span className="muted"> · {whenLabel(e.date, e.endDate)}</span>
                </span>
                <span className="place-meta">{e.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <CalendarExportButton events={events} />
    </div>
  );
}
