import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Shield, Heart, Building2, Radio } from 'lucide-react';
import { MAP_BLIPS, BLIP_STYLES, PLAYER_BLIP_COLORS } from '@/data/mockData';
import { api } from '@/lib/api';

// Self-hosted GTA V map tiles (downloaded from gta5-map, served from /public/tiles).
const MAP_STYLES = {
  atlas: '/tiles/atlas/{z}-{x}_{y}.png',
  satellite: '/tiles/satellite/{z}-{x}_{y}.png',
  road: '/tiles/road/{z}-{x}_{y}.png',
};
const MAP_BOUNDS = [[0, 0], [-88, 88]];

// ---------------------------------------------------------------------------
// GTA game coords (x: west→east, y: south→north) -> Leaflet CRS.Simple [lat,lng].
// Linear calibration. Tune these 3 constants against your own tile set if a
// blip looks slightly off (SCALE = frac of map per game-unit; XC/YC = the game
// coordinate sitting at the map's centre).
// ---------------------------------------------------------------------------
const CAL = { SCALE: 0.000078, XC: -61, YC: 600 };
export function gameToLatLng(x, y) {
  const fx = CAL.SCALE * (x - CAL.XC) + 0.5;
  const fy = 0.5 - CAL.SCALE * (y - CAL.YC);
  return [-fy * 88, fx * 88];
}

const blipIcon = (type) => {
  const s = BLIP_STYLES[type];
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<div class="blip" style="--c:${s.color}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${s.icon}"/></svg></div>`,
  });
};

const playerIcon = (type) =>
  L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div class="pblip" style="--pc:${PLAYER_BLIP_COLORS[type] || '#e5e7eb'}"><span class="pdot"></span></div>`,
  });

const FILTERS = [
  { key: 'all', label: 'All', icon: MapPin },
  { key: 'police', label: 'Police', icon: Shield },
  { key: 'safe', label: 'Safe Zones', icon: Heart },
  { key: 'business', label: 'Businesses', icon: Building2 },
];

export default function ServerMap() {
  const [filter, setFilter] = useState('all');
  const [mapStyle, setMapStyle] = useState('atlas');
  const [showLive, setShowLive] = useState(true);
  const [livePlayers, setLivePlayers] = useState([]);
  const blips = MAP_BLIPS.filter((b) => filter === 'all' || b.type === filter);
  const timer = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/server/players-live');
        setLivePlayers(res.data.players || []);
      } catch {
        /* ignore */
      }
    };
    if (showLive) {
      load();
      timer.current = setInterval(load, 3000);
    }
    return () => clearInterval(timer.current);
  }, [showLive]);

  return (
    <section id="map" className="relative py-24 px-5 sm:px-8" data-testid="map-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#a64dff] mb-3">Explore the city</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Live <span className="neon-text">GTA V Map</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            The full Los Santos & Blaine County map with precise blips for police, safe zones and
            player businesses — plus live players moving in real time.
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-gradient-to-r from-[#a64dff] to-[#7b2ff7] text-zinc-950'
                  : 'glass text-slate-300 hover:bg-white/10'
              }`}
              data-testid={`map-filter-${f.key}`}
            >
              <f.icon size={15} />
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setShowLive((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              showLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'glass text-slate-400'
            }`}
            data-testid="map-live-toggle"
          >
            <Radio size={15} className={showLive ? 'live-dot rounded-full' : ''} />
            Live Players {showLive ? `(${livePlayers.length})` : 'Off'}
          </button>

          <div className="ml-auto flex items-center gap-1.5 glass rounded-full p-1">
            {Object.keys(MAP_STYLES).map((s) => (
              <button
                key={s}
                onClick={() => setMapStyle(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  mapStyle === s ? 'bg-[#7b2ff7] text-white' : 'text-slate-400 hover:text-white'
                }`}
                data-testid={`map-style-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-6 glass rounded-2xl p-2 overflow-hidden"
          data-testid="leaflet-map-wrapper"
        >
          <MapContainer
            crs={L.CRS.Simple}
            center={[-44, 44]}
            zoom={4}
            minZoom={3}
            maxZoom={5}
            maxBounds={[[8, -8], [-96, 96]]}
            maxBoundsViscosity={0.9}
            scrollWheelZoom={false}
            style={{ height: '620px', width: '100%', borderRadius: '14px' }}
          >
            <TileLayer
              key={mapStyle}
              url={MAP_STYLES[mapStyle]}
              tileSize={256}
              noWrap={true}
              bounds={MAP_BOUNDS}
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            />

            {blips.map((b) => {
              const style = BLIP_STYLES[b.type];
              return (
                <Marker key={b.id} position={gameToLatLng(b.game[0], b.game[1])} icon={blipIcon(b.type)}>
                  <Tooltip direction="top" offset={[0, -14]}>{b.name}</Tooltip>
                  <Popup>
                    <div className="font-ibm">
                      <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: style.color }}>
                        {style.label}
                      </div>
                      <div className="font-outfit font-bold text-base mt-0.5">{b.name}</div>
                      <p className="text-sm text-slate-300 mt-1 max-w-[220px]">{b.desc}</p>
                      <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
                        x:{b.game[0]} y:{b.game[1]}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {showLive &&
              livePlayers.map((p) => (
                <Marker key={`p-${p.id}`} position={gameToLatLng(p.x, p.y)} icon={playerIcon(p.type)} zIndexOffset={1000}>
                  <Tooltip direction="top" offset={[0, -8]}>
                    <span className="capitalize">{p.type}</span> · {p.name}
                  </Tooltip>
                </Marker>
              ))}
          </MapContainer>
        </motion.div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {Object.entries(BLIP_STYLES).map(([key, s]) => (
            <div key={key} className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
              {s.label}
            </div>
          ))}
          <span className="h-4 w-px bg-white/10" />
          {Object.entries(PLAYER_BLIP_COLORS).map(([key, c]) => (
            <div key={key} className="flex items-center gap-2 text-sm text-slate-400 capitalize">
              <span className="h-3 w-3 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
              {key} player
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
