// Fixed cultural events in Kyiv for 2026. Each event anchors to an existing
// place id so clicking pans the map to a real venue.
export const CULTURAL_EVENTS = [
  {
    id: 'evt-constitution-day',
    name: 'Constitution Day',
    date: '2026-06-28',
    endDate: '2026-06-28',
    description: 'National celebrations across Kyiv',
    anchorPlaceId: 'place-maidan'
  },
  {
    id: 'evt-ivana-kupala',
    name: 'Ivana Kupala Festival',
    date: '2026-07-06',
    endDate: '2026-07-07',
    description: 'Folk celebrations in parks and along the Dnipro',
    anchorPlaceId: 'place-maidan'
  },
  {
    id: 'evt-statehood-day',
    name: 'Ukrainian Statehood Day',
    date: '2026-07-15',
    endDate: '2026-07-15',
    description: 'Kyiv and nationwide commemorations',
    anchorPlaceId: 'place-maidan'
  },
  {
    id: 'evt-atlas-festival',
    name: 'Atlas Festival',
    date: '2026-07-17',
    endDate: '2026-07-19',
    description: 'Major music festival at Blockbuster Mall area',
    anchorPlaceId: 'place-atlas-festival'
  },
  {
    id: 'evt-independence-day',
    name: 'Independence Day',
    date: '2026-08-24',
    endDate: '2026-08-24',
    description: 'Major celebrations at Maidan Nezalezhnosti',
    anchorPlaceId: 'place-maidan'
  }
].slice().sort((a, b) => a.date.localeCompare(b.date));
