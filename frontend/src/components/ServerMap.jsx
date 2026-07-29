import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Shield, Heart, Building2 } from 'lucide-react';
import { MAP_BLIPS, BLIP_STYLES } from '@/data/mockData';

const FILTERS = [
  { key: 'all', label: 'All', icon: MapPin },
  { key: 'police', label: 'Police', icon: Shield },
  { key: 'safe', label: 'Safe Zones', icon: Heart },
  { key: 'business', label: 'Businesses', icon: Building2 },
];

export default function ServerMap() {
  const [filter, setFilter] = useState('all');
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
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#00f2fe] mb-3">Explore the city</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Interactive <span className="neon-text">City Map</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Find police departments, safe zones and player-run businesses across Los Santos. Click any
            blip for details.
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-zinc-950'
                  : 'glass text-slate-300 hover:bg-white/10'
              }`}
              data-testid={`map-filter-${f.key}`}
            >
              <f.icon size={15} />
              {f.label}
            </button>
          ))}
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
            center={[34.05, -118.255]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '520px', width: '100%', borderRadius: '14px' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
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
