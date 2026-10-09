export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(isoA, isoB) {
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  return Math.round((parse(isoB) - parse(isoA)) / 86400000);
}

export function formatRelativeDay(isoDate) {
  const d = daysBetween(getToday(), isoDate);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 0) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}

export function formatDateShort(isoDate) {
  const [y, m, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, day));
}

export function formatDateRange(isoStart, isoEnd) {
  if (isoStart === isoEnd) return formatDateShort(isoStart);
  const [sy, sm, sd] = isoStart.split('-').map(Number);
  const [ey, em, ed] = isoEnd.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const fmt = (d, opts) => new Intl.DateTimeFormat(undefined, opts).format(d);
  if (sm === em && sy === ey) {
    return `${fmt(s, { month: 'short', day: 'numeric' })}–${ed}`;
  }
  return `${fmt(s, { month: 'short', day: 'numeric' })} – ${fmt(e, { month: 'short', day: 'numeric' })}`;
}

export function getCurrentDayName() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date());
}

export function getCurrentDayShort() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date());
}

export function isEventActiveOn(event, isoDate) {
  return event.date <= isoDate && isoDate <= event.endDate;
}
