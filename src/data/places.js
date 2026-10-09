// Sample Kyiv places. Coordinates are approximate -- edit freely.
// `id: "home"` and `id: "office"` are anchors used for routing + geo filters.
//
// Schema (all fields optional except id/name/category/lat/lng):
//   id, name, category, address, neighborhood, lat, lng
//   priority (1-5), priceLevel ('$' | '$$' | '$$$' | '$$$$' | '')
//   notes, safetyNotes
//   visited, wantToVisit (booleans -- live defaults; runtime status may be
//     overridden by the user and persisted to localStorage)
//   links: { website, menuUrl, eventsUrl, instagramUrl, googleMapsUrl }
//   metadata: free-form { priceNotes, translatedMenuNotes, eventNotes, safetyNotes }
//   source: 'sample' (added automatically below)

const RAW_PLACES = [
  {
    id: 'home',
    name: 'Home (example)',
    category: 'home',
    address: 'Kontraktova Square, Podil, Kyiv',
    neighborhood: 'Podil',
    lat: 50.4655,
    lng: 30.5155,
    priority: 5,
    notes: 'Example base location. Replace with your own.'
  },
  {
    id: 'office',
    name: 'Office (example)',
    category: 'office',
    address: 'Sofiivska Square, Kyiv, Ukraine',
    neighborhood: 'Shevchenko',
    lat: 50.4531,
    lng: 30.5149,
    priority: 5,
    notes: 'Example work location. Replace with your own.'
  },

  // Restaurants
  {
    id: 'rest-kanapa',
    name: 'Kanapa',
    category: 'restaurant',
    address: 'Andriivskyi Descent, 19',
    neighborhood: 'Podil',
    lat: 50.4592,
    lng: 30.5165,
    priority: 4,
    priceLevel: '$$$',
    wantToVisit: true,
    notes: 'Modern Ukrainian, popular for tourists and locals',
    links: { website: 'https://kanapa-restaurant.com/' }
  },
  {
    id: 'rest-ostannya-barykada',
    name: 'Ostannya Barykada',
    category: 'restaurant',
    address: 'Maidan Nezalezhnosti, Globus Mall',
    neighborhood: 'Maidan',
    lat: 50.4498,
    lng: 30.5231,
    priority: 3,
    priceLevel: '$$',
    notes: 'Hidden Ukrainian restaurant, password entry'
  },

  // Bars
  {
    id: 'bar-parovoz',
    name: 'Parovoz Speak Easy',
    category: 'bar',
    address: 'Kostiantynivska St, 2A',
    neighborhood: 'Podil',
    lat: 50.4626,
    lng: 30.5132,
    priority: 3,
    priceLevel: '$$',
    notes: 'Speakeasy cocktail bar in Podil'
  },

  // Clubs
  {
    id: 'club-closer',
    name: 'Closer',
    category: 'club',
    address: 'Nyzhnoiurkivska St, 31',
    neighborhood: 'Podil',
    lat: 50.4719,
    lng: 30.4904,
    priority: 3,
    notes: 'Well-known electronic music venue',
    safetyNotes: 'Check curfew / air-raid schedule before late-night travel'
  },

  // Theater
  {
    id: 'theater-opera',
    name: 'National Opera of Ukraine',
    category: 'theater',
    address: 'Volodymyrska St, 50',
    neighborhood: 'Shevchenko',
    lat: 50.4456,
    lng: 30.5126,
    priority: 4,
    wantToVisit: true,
    notes: 'Opera and ballet',
    links: { website: 'https://opera.com.ua/', eventsUrl: 'https://opera.com.ua/en/repertoire/' }
  },

  // Cafe
  {
    id: 'cafe-honey',
    name: 'Honey Cafe',
    category: 'cafe',
    address: 'Khoryva St, Podil',
    neighborhood: 'Podil',
    lat: 50.4641,
    lng: 30.5158,
    priority: 3,
    priceLevel: '$',
    notes: 'Sample cafe -- edit me'
  },

  // Grocery
  {
    id: 'grocery-silpo-podil',
    name: 'Silpo (Podil)',
    category: 'grocery',
    address: 'Verkhnii Val St',
    neighborhood: 'Podil',
    lat: 50.4659,
    lng: 30.5198,
    priority: 3,
    notes: 'Large grocery chain'
  },

  // Gym
  {
    id: 'gym-sport-life',
    name: 'Sport Life',
    category: 'gym',
    address: 'Sahaidachnoho St',
    neighborhood: 'Podil',
    lat: 50.4615,
    lng: 30.5193,
    priority: 2,
    notes: 'Chain gym'
  },

  // Transit
  {
    id: 'transit-kontraktova',
    name: 'Kontraktova Ploshcha (Metro)',
    category: 'transit',
    address: 'Kontraktova Square',
    neighborhood: 'Podil',
    lat: 50.4644,
    lng: 30.5151,
    priority: 4,
    notes: 'Blue line, Podil'
  },
  {
    id: 'transit-khreshchatyk',
    name: 'Khreshchatyk (Metro)',
    category: 'transit',
    address: 'Khreshchatyk',
    neighborhood: 'Maidan',
    lat: 50.4475,
    lng: 30.5221,
    priority: 4,
    notes: 'Red line, city center'
  },

  // Event anchors (used by the Coming Up panel)
  {
    id: 'place-maidan',
    name: 'Maidan Nezalezhnosti',
    category: 'event',
    address: 'Maidan Nezalezhnosti, Kyiv',
    neighborhood: 'Maidan',
    lat: 50.4498,
    lng: 30.5231,
    priority: 5,
    notes: 'Independence Square -- primary site for national celebrations.'
  },
  {
    id: 'place-atlas-festival',
    name: 'Blockbuster Mall / Atlas Festival',
    category: 'event',
    address: 'Stepana Bandery Ave, 36, Kyiv',
    neighborhood: 'Obolon',
    lat: 50.5125,
    lng: 30.4983,
    priority: 4,
    notes: 'Atlas Festival venue area.'
  },

  // Errand placeholder
  {
    id: 'errand-pharmacy',
    name: 'ANC Pharmacy',
    category: 'errand',
    address: 'Sahaidachnoho St',
    neighborhood: 'Podil',
    lat: 50.4607,
    lng: 30.5208,
    priority: 1,
    notes: 'Sample pharmacy -- edit me'
  }
];

function normalize(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address || '',
    neighborhood: p.neighborhood || '',
    lat: p.lat,
    lng: p.lng,
    priority: p.priority ?? 0,
    priceLevel: p.priceLevel || '',
    notes: p.notes || '',
    safetyNotes: p.safetyNotes || '',
    visited: p.visited ?? false,
    wantToVisit: p.wantToVisit ?? false,
    placeId: p.placeId || '',
    links: {
      website: p.links?.website || '',
      menuUrl: p.links?.menuUrl || '',
      eventsUrl: p.links?.eventsUrl || '',
      instagramUrl: p.links?.instagramUrl || '',
      googleMapsUrl: p.links?.googleMapsUrl || ''
    },
    metadata: {
      priceNotes: p.metadata?.priceNotes || '',
      translatedMenuNotes: p.metadata?.translatedMenuNotes || '',
      eventNotes: p.metadata?.eventNotes || '',
      safetyNotes: p.metadata?.safetyNotes || ''
    },
    source: 'sample'
  };
}

export const PLACES = RAW_PLACES.map(normalize);
export const normalizePlace = normalize;

export const HOME_ID = 'home';
export const OFFICE_ID = 'office';
