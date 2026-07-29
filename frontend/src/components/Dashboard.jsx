import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Wallet, Landmark, IdCard, Home, Warehouse, Car, KeyRound, Loader2, LogIn, ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

// Discord brand mark (inline SVG so we avoid extra icon deps).
const DiscordMark = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
  </svg>
);

const StatCard = ({ icon: Icon, title, accent = '#00f2fe', children, testid, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="glass rounded-2xl p-6 hover:border-white/20 transition-colors"
    data-testid={testid}
  >
    <div className="flex items-center gap-3 mb-5">
      <span
        className="grid place-items-center h-10 w-10 rounded-xl border border-white/10"
        style={{ background: `${accent}22`, color: accent }}
      >
        <Icon size={20} />
      </span>
      <h3 className="font-outfit font-bold text-lg">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

const Pill = ({ ok, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
      ok ? 'text-[#00f2fe] border-[#00f2fe]/40 bg-[#00f2fe]/10' : 'text-slate-500 border-white/10 bg-white/5'
    }`}
  >
    <ShieldCheck size={13} />
    {label}
  </span>
);

const money = (n) => '$' + Number(n).toLocaleString();

export default function Dashboard({ user, loading }) {
  const login = async () => {
    try {
      const res = await api.get('/auth/discord/login');
      window.location.href = res.data.url;
    } catch (e) {
      toast.error('Discord login unavailable', {
        description: 'OAuth is not configured on the server yet.',
      });
    }
  };

  return (
    <section id="dashboard" className="relative py-24 px-5 sm:px-8" data-testid="dashboard-section">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#4facfe] mb-3">Player UCP</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Your <span className="neon-text">Control Panel</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Link your Discord to view your character, licenses, properties and garage in real time.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center h-64 glass rounded-2xl" data-testid="dashboard-loading">
            <Loader2 className="animate-spin text-[#00f2fe]" size={32} />
          </div>
        ) : !user ? (
          // ---------- Logged-out: Discord OAuth landing ----------
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 relative overflow-hidden glass rounded-3xl p-10 sm:p-14 text-center"
            data-testid="discord-login-panel"
          >
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#4facfe]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00f2fe]/20 blur-3xl" />
            <div className="relative">
              <span className="grid place-items-center h-16 w-16 mx-auto rounded-2xl bg-[#5865F2] text-white mb-6">
                <DiscordMark size={32} />
              </span>
              <h3 className="font-outfit text-2xl font-bold">Secure Player Login</h3>
              <p className="mt-3 text-slate-300 max-w-md mx-auto">
                Authenticate with Discord to access your citizen dashboard. We only read your public
                profile — never your messages.
              </p>
              <button
                onClick={login}
                className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-outfit font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-[0_0_25px_rgba(88,101,242,0.5)] transition-colors"
                data-testid="discord-login-btn"
              >
                <DiscordMark size={20} />
                Login via Discord
              </button>
            </div>
          </motion.div>
        ) : (
          // ---------- Logged-in dashboard ----------
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-8 glass rounded-2xl p-5" data-testid="dashboard-welcome">
              {user.discord?.avatar && (
                <img src={user.discord.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-[#00f2fe]/50" />
              )}
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Welcome back</div>
                <div className="font-outfit text-xl font-bold">{user.discord?.username}</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-2 text-sm text-[#00f2fe]">
                <span className="h-2 w-2 rounded-full bg-[#00f2fe] live-dot" /> Linked
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <StatCard icon={User} title="Character Registry" testid="card-character" delay={0}>
                <Row label="Name" value={user.character?.name} />
                <Row label="Citizen ID" value={user.character?.citizen_id} mono />
                <Row label="Job" value={user.character?.job} />
                <Row label="Gang" value={user.character?.gang} />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
                      <Wallet size={14} /> Cash
                    </div>
                    <div className="font-outfit text-xl font-bold text-[#00f2fe] mt-1">{money(user.character?.cash)}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
                      <Landmark size={14} /> Bank
                    </div>
                    <div className="font-outfit text-xl font-bold text-[#4facfe] mt-1">{money(user.character?.bank)}</div>
                  </div>
                </div>
              </StatCard>

              <StatCard icon={IdCard} title="Licenses" accent="#4facfe" testid="card-licenses" delay={0.08}>
                <div className="flex flex-wrap gap-2.5">
                  <Pill ok={user.licenses?.drivers} label="Drivers" />
                  <Pill ok={user.licenses?.weapons} label="Weapons" />
                  <Pill ok={user.licenses?.commercial} label="Commercial" />
                  <Pill ok={user.licenses?.pilot} label="Pilot" />
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Renew or apply for new licenses at the DMV in-city (Legion Square).
                </p>
              </StatCard>

              <StatCard icon={Home} title="Property Ledger" testid="card-properties" delay={0.16}>
                <div className="space-y-3">
                  {user.properties?.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                      <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#00f2fe]/15 text-[#00f2fe]">
                        {p.type === 'Warehouse' ? <Warehouse size={17} /> : <Home size={17} />}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{p.type}</div>
                        <div className="text-xs text-slate-400 truncate">{p.location}</div>
                      </div>
                      <div className="ml-auto text-sm font-semibold text-[#4facfe]">{money(p.value)}</div>
                    </div>
                  ))}
                </div>
              </StatCard>

              <StatCard icon={Car} title="Garage & Vehicle Registry" accent="#4facfe" testid="card-vehicles" delay={0.24}>
                <div className="space-y-3">
                  {user.vehicles?.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                      <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#4facfe]/15 text-[#4facfe]">
                        <Car size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{v.model}</div>
                        <div className="text-xs text-slate-400">{v.garage}</div>
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                          <KeyRound size={11} /> {v.plate}
                        </span>
                        <span className={`text-[11px] font-semibold ${v.stored ? 'text-[#00f2fe]' : 'text-amber-400'}`}>
                          {v.stored ? 'Stored' : 'Impounded'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </StatCard>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
