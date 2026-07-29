import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Copy, Play, Users, Clock, ShieldCheck, Signal } from 'lucide-react';
import { api } from '@/lib/api';

const HERO_BG =
  'https://images.unsplash.com/photo-1672872476232-da16b45c9001?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxjeWJlcnB1bmslMjBjaXR5JTIwbGFuZHNjYXBlfGVufDB8fHx8MTc4NTMzNzQxMHww&ixlib=rb-4.1.0&q=85';

// Client-side fallback used if the backend proxy itself is unreachable.
const MOCK = {
  online: true,
  hostname: 'PLATINUM ROLEPLAY | Serious Economy | TMC',
  players: 48,
  max_players: 128,
  staff_online: 4,
  uptime: '6d 14h 22m',
  server_ip: 'YOUR_SERVER_IP:PORT',
  source: 'mock',
};

export default function Hero() {
  const [status, setStatus] = useState(MOCK);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/server/status');
        if (active) setStatus(res.data);
      } catch {
        if (active) setStatus(MOCK);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const connect = () => {
    // FiveM protocol handler — opens the client and joins directly.
    window.location.href = `fivem://connect/${status.server_ip}`;
  };

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(status.server_ip);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = status.server_ip;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast.success('Copied!', { description: `${status.server_ip} is on your clipboard.` });
  };

  const stats = [
    { icon: Users, label: 'Players Online', value: `${status.players}/${status.max_players}`, testid: 'stat-players' },
    { icon: Clock, label: 'Uptime', value: status.uptime, testid: 'stat-uptime' },
    { icon: ShieldCheck, label: 'Staff Online', value: status.staff_online, testid: 'stat-staff' },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/60" />
        <motion.img
          src="/logo.png"
          alt=""
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="pointer-events-none select-none absolute -right-24 sm:right-0 top-1/2 -translate-y-1/2 w-[520px] max-w-[70vw] drop-shadow-[0_0_60px_rgba(123,47,247,0.5)]"
        />
      </div>

      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#7b2ff7]/20 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-6" data-testid="live-badge">
            <span className="relative flex h-2.5 w-2.5">
              <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-[#a64dff]" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#a64dff]" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-300">
              {status.online ? 'Server Online' : 'Offline'} · {status.source === 'live' ? 'Live' : 'Demo'} data
            </span>
          </div>

          <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
            Live your second life in <span className="neon-text">Platinum Roleplay</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            A serious-economy FiveM roleplay server. Build a legend, run the streets, or hold the
            thin blue line. {status.hostname}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={connect}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-outfit font-bold text-zinc-950 bg-gradient-to-r from-[#a64dff] to-[#7b2ff7] shadow-[0_0_20px_rgba(166,77,255,0.35)] hover:shadow-[0_0_30px_rgba(166,77,255,0.7)] transition-shadow"
              data-testid="connect-server-btn"
            >
              <Play size={18} strokeWidth={3} className="fill-zinc-950" />
              Connect Now
            </button>
            <button
              onClick={copyIp}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white glass hover:border-[#a64dff]/50 hover:bg-white/10 transition-colors"
              data-testid="copy-ip-btn"
            >
              <Copy size={18} />
              Copy IP
            </button>
            <code className="hidden sm:inline-flex items-center gap-2 text-sm text-slate-400 glass rounded-full px-4 py-2" data-testid="server-ip-display">
              <Signal size={14} className="text-[#a64dff]" />
              {status.server_ip}
            </code>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid gap-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-[#a64dff]/40 transition-colors"
              data-testid={s.testid}
            >
              <span className="grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#a64dff]/20 to-[#7b2ff7]/20 border border-white/10 text-[#a64dff]">
                <s.icon size={22} />
              </span>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">{s.label}</div>
                <div className="font-outfit text-2xl font-bold">{s.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
