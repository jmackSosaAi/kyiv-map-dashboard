// useCalendarExport.js
// Named "hook" per spec but exports pure utility functions — no React state.
// Safe to import from any component or plain JS module.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape special characters for iCalendar TEXT values (RFC 5545 §3.3.11).
 * Order matters: backslash must be first.
 */
function escape(s) {
  if (!s) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold a single content line to ≤75 octets per RFC 5545 §3.1.
 * Folding inserts CRLF + a single space before the overflow.
 * Simple byte-count fold (ASCII-safe; Kyiv cultural event strings are ASCII).
 */
function foldLine(line) {
  const LIMIT = 75;
  if (line.length <= LIMIT) return line;
  let result = '';
  let remaining = line;
  while (remaining.length > LIMIT) {
    result += remaining.slice(0, LIMIT) + '\r\n ';
    remaining = remaining.slice(LIMIT);
  }
  result += remaining;
  return result;
}

/**
 * Return the current UTC instant in iCalendar DTSTAMP format: YYYYMMDDTHHmmSSZ
 */
function nowZ() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Convert an ISO date string (YYYY-MM-DD) to the compact form required by
 * iCalendar DATE values: YYYYMMDD.
 */
function isoToDate(iso) {
  return iso.replace(/-/g, '');
}

/**
 * Add one calendar day to an ISO date string (YYYY-MM-DD).
 * Used to compute the EXCLUSIVE DTEND for all-day events per RFC 5545 §3.6.1.
 *
 * Example: '2026-07-19' → '2026-07-20'
 * Atlas Festival endDate '2026-07-19' → DTEND:20260720  ✓
 */
function addOneDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// ---------------------------------------------------------------------------
// Public: filter helper
// ---------------------------------------------------------------------------

/**
 * Return events whose endDate >= todayIso — the same filter EventsPanel uses.
 * Single source of truth so the exported set always matches what's displayed.
 *
 * @param {Array}  events    Full CULTURAL_EVENTS array (or any subset)
 * @param {string} todayIso  ISO date string, e.g. new Date().toISOString().slice(0,10)
 * @returns {Array}
 */
export function getUpcomingEvents(events, todayIso) {
  return events.filter((e) => e.endDate >= todayIso);
}

// ---------------------------------------------------------------------------
// Public: ICS generation
// ---------------------------------------------------------------------------

/**
 * Generate a valid RFC 5545 iCalendar (.ics) string for the given events.
 *
 * Rules applied:
 *  - All-day events use VALUE=DATE (no time component).
 *  - DTEND is EXCLUSIVE: single-day event on 2026-06-28 → DTEND:20260629.
 *    Multi-day: Atlas Festival 2026-07-17→2026-07-19 → DTEND:20260720.
 *  - Lines are folded at 75 octets with CRLF+SPACE continuation.
 *  - All line endings are CRLF (\r\n) as required by RFC 5545 §3.1.
 *
 * @param {Array}  events   Array of event objects from CULTURAL_EVENTS
 * @param {Object} options
 * @param {string} [options.location='Kyiv, Ukraine']  Default LOCATION value
 * @returns {string}  Complete .ics file content
 */
export function exportEventsToICS(events, options = {}) {
  const location = options.location || 'Kyiv, Ukraine';
  const stamp = nowZ();

  const vevents = events.map((e) => {
    // DTEND is exclusive per RFC 5545: use endDate+1 day.
    const dtend = isoToDate(addOneDay(e.endDate));
    const dtstart = isoToDate(e.date);

    const lines = [
      'BEGIN:VEVENT',
      `UID:${e.id}@kyivmap.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${escape(e.name)}`,
      `DESCRIPTION:${escape(e.description)}`,
      `LOCATION:${escape(location)}`,
      'CATEGORIES:Kyiv Cultural Event',
      'END:VEVENT',
    ];

    return lines.map(foldLine).join('\r\n');
  });

  const calLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kyiv Map Dashboard//Cultural Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Kyiv Cultural Events',
    'X-WR-TIMEZONE:Europe/Kyiv',
    ...vevents,
    'END:VCALENDAR',
  ];

  return calLines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Public: download trigger
// ---------------------------------------------------------------------------

/**
 * Trigger a browser download of an .ics file.
 * Mirrors the pattern used by downloadCsv in src/utils/csv.js.
 *
 * @param {string} filename   e.g. 'kyiv-events.ics'
 * @param {string} icsString  Output of exportEventsToICS()
 */
export function downloadIcs(filename, icsString) {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Google Calendar OAuth scaffold
// ---------------------------------------------------------------------------

// Future implementation outline (uncomment + complete when ready):
//
// const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
//
// Helper to shift a date string by +1 day (exclusive end for Google Calendar):
// function addDay(iso) { return addOneDay(iso); }
//
// for (const e of events) {
//   await fetch(CALENDAR_API, {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       summary: e.name,
//       description: e.description,
//       start: { date: e.date },
//       end:   { date: addDay(e.endDate) },  // exclusive
//       location: 'Kyiv, Ukraine'
//     })
//   });
// }
//
// Recommended library for the OAuth popup flow: @react-oauth/google
// See docs/CALENDAR_SETUP.md for full wiring instructions.

/**
 * Push events directly to the user's Google Calendar via the Calendar API.
 *
 * NOT IMPLEMENTED — the user's calendar is live and should not be touched
 * until the OAuth flow is fully wired and tested. Use the .ics export workflow
 * in the meantime (exportEventsToICS + downloadIcs).
 *
 * When ready: see the commented skeleton above and docs/CALENDAR_SETUP.md.
 *
 * @param {Array}  _events       CULTURAL_EVENTS (or filtered subset) — unused
 * @param {string} _accessToken  OAuth 2.0 Bearer token from Google — unused
 */
export async function exportToGoogleCalendar(/* events, accessToken */) {
  throw new Error(
    'Google Calendar sync not yet wired. See docs/CALENDAR_SETUP.md.'
  );
}
