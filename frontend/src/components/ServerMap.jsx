import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Shield, Heart, Building2 } from 'lucide-react';
import { MAP_BLIPS, BLIP_STYLES } from '@/data/mockData';

// GTA V map tile pyramid (standard XYZ, ~88x88 CRS.Simple units, zoom 2-6 usable).
const MAP_STYLES = {
  atlas: 'https://gta5-map.github.io/tiles/atlas/{z}-{x}_{y}.png',
  satellite: 'https://gta5-map.github.io/tiles/satellite/{z}-{x}_{y}.png',
  road: 'https://gta5-map.github.io/tiles/road/{z}-{x}_{y}.png',
};
const MAP_BOUNDS = [[0, 0], [-88, 88]];

const FILTERS = [
  { key: 'all', label: 'All', icon: MapPin },
  { key: 'police', label: 'Police', icon: Shield },
  { key: 'safe', label: 'Safe Zones', icon: Heart },
  { key: 'business', label: 'Businesses', icon: Building2 },
];

export default function ServerMap() {
  const [filter, setFilter] = useState('all');
  const [mapStyle, setMapStyle] = useState('atlas');
  const blips = MAP_BLIPS.filter((b) => filter === 'all' || b.type === filter);

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
            Interactive <span className="neon-text">City Map</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Find police departments, safe zones and player-run businesses across Los Santos. Click any
            blip for details.
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
            maxZoom={6}
            maxBounds={[[8, -8], [-96, 96]]}
            maxBoundsViscosity={0.9}
            scrollWheelZoom={false}
            style={{ height: '560px', width: '100%', borderRadius: '14px' }}
          >
            <TileLayer
              key={mapStyle}
              url={MAP_STYLES[mapStyle]}
              tileSize={256}
              noWrap={true}
              bounds={MAP_BOUNDS}
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              attribution='GTA V map &copy; gta5-map.github.io'
            />
            {blips.map((b) => {
              const style = BLIP_STYLES[b.type];
              return (
                <CircleMarker
                  key={b.id}
                  center={b.pos}
                  radius={10}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.color,
                    fillOpacity: 0.6,
                    weight: 3,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>{b.name}</Tooltip>
                  <Popup>
                    <div className="font-ibm">
                      <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: style.color }}>
                        {style.label}
                      </div>
                      <div className="font-outfit font-bold text-base mt-0.5">{b.name}</div>
                      <p className="text-sm text-slate-300 mt-1 max-w-[220px]">{b.desc}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </motion.div>

        <div className="mt-5 flex flex-wrap gap-5">
          {Object.entries(BLIP_STYLES).map(([key, s]) => (
            <div key={key} className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
