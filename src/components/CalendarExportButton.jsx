import { useState } from 'react';
import { getUpcomingEvents, exportEventsToICS, downloadIcs } from '../hooks/useCalendarExport';

/**
 * Renders a button that exports upcoming cultural events to a .ics file.
 *
 * Props:
 *   events {Array} — the full events array from EventsPanel (pre-passed, not pre-filtered).
 *                    Filtering to upcoming is done here via getUpcomingEvents so the
 *                    exported set always matches the displayed list.
 */
export default function CalendarExportButton({ events }) {
  const [toast, setToast] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = getUpcomingEvents(events, today);
  const hasEvents = upcoming.length > 0;

  function handleExport() {
    const ics = exportEventsToICS(upcoming);
    downloadIcs('kyiv-events.ics', ics);

    setToast(`Exported ${upcoming.length} event${upcoming.length !== 1 ? 's' : ''} to kyiv-events.ics`);
    setTimeout(() => setToast(''), 2000);
  }

  return (
    <div className="calendar-export-row">
      <button
        className="small block"
        onClick={handleExport}
        disabled={!hasEvents}
        title={hasEvents ? 'Download upcoming events as .ics' : 'No upcoming events'}
      >
        📅 Export to calendar (.ics)
      </button>
      {toast && (
        <p className="calendar-export-toast">{toast}</p>
      )}
    </div>
  );
}
