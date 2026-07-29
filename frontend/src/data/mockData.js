// ---------------------------------------------------------------------------
// Static / mock content for presentational modules.
// Swap these arrays for live API/DB responses when going to production.
// ---------------------------------------------------------------------------

// GTA V map is roughly a 8192x8192 game-unit square. Using Leaflet CRS.Simple
// we map game units to image coordinates. Coordinates below are illustrative
// placements on the CartoDB dark tile layer (lat/lng) so the demo renders
// against a real slippy map. For a true GTA grid, load a custom tile set and
// switch the map to L.CRS.Simple with [y, x] game coords.
export const MAP_BLIPS = [
  {
    id: 'lspd-mission-row',
    type: 'police',
    name: 'Mission Row PD (LSPD)',
    desc: 'Central Los Santos Police Department. Booking, armory & impound.',
    pos: [34.052, -118.243],
  },
  {
    id: 'bcso-paleto',
    type: 'police',
    name: 'BCSO — Paleto Bay',
    desc: "Blaine County Sheriff's Office. Rural patrol HQ.",
    pos: [34.101, -118.29],
  },
  {
    id: 'pillbox-hospital',
    type: 'safe',
    name: 'Pillbox Medical Center',
    desc: 'Safe zone. EMS respawn & downed-player revives.',
    pos: [34.041, -118.26],
  },
  {
    id: 'legion-spawn',
    type: 'safe',
    name: 'Legion Square Spawn',
    desc: 'New citizen spawn point. Green (no-crime) zone.',
    pos: [34.045, -118.25],
  },
  {
    id: 'benny-mechanic',
    type: 'business',
    name: "Benny's Original Motorworks",
    desc: 'Player-run mechanic shop. Custom builds & repairs.',
    pos: [34.06, -118.27],
  },
  {
    id: 'vanilla-unicorn',
    type: 'business',
    name: 'Vanilla Unicorn (Nightclub)',
    desc: 'Player-owned nightclub. Events, DJ sets & VIP tables.',
    pos: [34.03, -118.235],
  },
];

export const BLIP_STYLES = {
  police: { color: '#a64dff', label: 'Police Station', ring: 'rgba(166,77,255,0.25)' },
  safe: { color: '#22c55e', label: 'Safe Zone', ring: 'rgba(34,197,94,0.25)' },
  business: { color: '#7b2ff7', label: 'Business', ring: 'rgba(123,47,247,0.25)' },
};

export const STORE_PACKAGES = [
  {
    id: 'bronze-vip',
    name: 'Bronze VIP',
    price: 9.99,
    period: '/mo',
    tagline: 'Kickstart your city life',
    featured: false,
    features: [
      'VIP Discord role & color',
      'Priority queue slot',
      '$25,000 starter cash',
      'Exclusive VIP license plate',
      'Access to VIP-only garage',
    ],
  },
  {
    id: 'import-car',
    name: 'Custom Import Car Slot',
    price: 24.99,
    period: 'one-time',
    tagline: 'Most popular',
    featured: true,
    features: [
      'Unlock 1 custom import vehicle slot',
      'Add your own handling & liveries',
      'Everything in Bronze VIP',
      'Priority queue (Gold tier)',
      'Custom plate of your choice',
      'Dedicated garage spot',
    ],
  },
  {
    id: 'gang-whitelist',
    name: 'Gang Whitelist Pack',
    price: 49.99,
    period: 'one-time',
    tagline: 'Run the streets',
    featured: false,
    features: [
      'Official whitelisted gang territory',
      'Custom gang clothing & tags',
      'Warehouse + stash property',
      'Up to 10 member slots',
      'Everything in Import Car slot',
    ],
  },
];

export const RULES = [
  {
    id: 'general',
    title: 'General Server Rules',
    body: [
      'You must maintain character (RP) at all times inside the city.',
      'No cheating, modding, exploiting or use of third-party menus. Instant permaban.',
      'Respect all players and staff. Zero tolerance for OOC harassment, racism or slurs.',
      'A valid, working microphone is required to connect.',
      'Do not stream-snipe or metagame using Twitch/Discord/OOC information.',
    ],
  },
  {
    id: 'rdm-vdm',
    title: 'RDM / VDM Guidelines',
    body: [
      'RDM (Random Deathmatch): Killing a player without prior valid RP interaction is forbidden.',
      'VDM (Vehicle Deathmatch): Using your vehicle as a weapon without RP context is forbidden.',
      'Initiation is required before any hostile action — give a clear demand and a chance to comply.',
      'Combat logging (disconnecting to avoid RP consequences) results in a ban.',
    ],
  },
  {
    id: 'metagaming',
    title: 'Metagaming & Powergaming',
    body: [
      'Metagaming: Using out-of-character info (streams, Discord, /ooc) in your roleplay is banned.',
      'Powergaming: Forcing RP scenarios your character realistically could not, or using unrealistic actions to gain an advantage.',
      'Your character should not know a person by name unless properly introduced in-city.',
      'Fail RP (e.g. driving a supercar off a cliff and continuing as normal) is punishable.',
    ],
  },
];

export const LORE = [
  {
    heading: 'The City of Los Santos, 2026',
    text: 'After the collapse of the old syndicates, Los Santos reinvented itself as a neon-soaked playground of ambition. Corporate towers glitter over Vinewood while the streets below hum with racers, hustlers and dreamers. The LSPD holds a fragile line as new powers rise from the docks of La Mesa to the hills of Vinewood.',
  },
  {
    heading: 'Active Factions',
    text: 'The Vagos control the eastern import trade. The Ballas run the underground clubs and pill routes. The Company — a slick corporate front — launders half the city\'s money through legitimate businesses. Independent crews fight for scraps in between, and alliances shift with every sunrise.',
  },
  {
    heading: 'Notable Storylines',
    text: 'The "Midnight Import Wars" saw player crews battle for control of the custom car pipeline for three straight weeks. The infamous "Pillbox Siege" ended with a hostage standoff broadcast across the city. And whispers of a rogue ex-detective building a vigilante network continue to shape the criminal underworld.',
  },
];

export const STAFF = [
  { name: 'Nyx', role: 'Head Admin', status: 'online' },
  { name: 'Rook', role: 'Senior Mod', status: 'online' },
  { name: 'Vega', role: 'Support', status: 'online' },
];
