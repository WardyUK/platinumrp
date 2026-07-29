import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Wallet, Landmark, Bitcoin, IdCard, Home, Warehouse, Car, KeyRound, Loader2,
  Heart, Shield, Beef, Droplet, Brain, Package, Crosshair, Wrench, Gem, Layers, Phone,
  Radio, Sandwich, Briefcase, Users, Clock, TrendingUp, ArrowDownLeft, ArrowUpRight, ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const DiscordMark = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
  </svg>
);

const money = (n) => '$' + Number(n || 0).toLocaleString();
const timeAgo = (iso) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6);
  return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const RARITY = {
  common: '#94a3b8', uncommon: '#22c55e', rare: '#38bdf8', epic: '#a64dff', legendary: '#f59e0b',
};
const itemIcon = (it) => {
  const byName = { phone: Phone, water_bottle: Droplet, sandwich: Sandwich, radio: Radio, gold_chain: Gem, id_card: IdCard };
  if (byName[it.name]) return byName[it.name];
  const byType = { weapon: Crosshair, tool: Wrench, ammo: Layers, valuable: Gem };
  return byType[it.type] || Package;
};

const VITALS = [
  { key: 'health', label: 'Health', icon: Heart, color: '#ef4444' },
  { key: 'armor', label: 'Armor', icon: Shield, color: '#a64dff' },
  { key: 'hunger', label: 'Hunger', icon: Beef, color: '#f59e0b' },
  { key: 'thirst', label: 'Thirst', icon: Droplet, color: '#38bdf8' },
  { key: 'stress', label: 'Stress', icon: Brain, color: '#f472b6' },
];

const Bar = ({ value, color }) => (
  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
    <div className="stat-bar-fill h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
  </div>
);

const Card = ({ children, className = '', testid }) => (
  <div className={`glass rounded-2xl p-6 ${className}`} data-testid={testid}>{children}</div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={`text-sm font-semibold text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

const Pill = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
    ok ? 'text-[#a64dff] border-[#a64dff]/40 bg-[#a64dff]/10' : 'text-slate-500 border-white/10 bg-white/5'
  }`}>
    <ShieldCheck size={13} /> {label}
  </span>
);

export default function Dashboard({ user, loading, onRefresh }) {
  const [active, setActive] = useState(0);

  const login = async () => {
    try {
      const res = await api.get('/auth/discord/login');
      window.location.href = res.data.url;
    } catch {
      toast.error('Discord login unavailable', { description: 'OAuth is not configured on the server yet.' });
    }
  };

  const demoLogin = async () => {
    try {
      const res = await api.post('/auth/demo-login');
      localStorage.setItem('ncrp_token', res.data.token);
      toast.success('Welcome, Demo Citizen', { description: 'Exploring the control panel in demo mode.' });
      onRefresh?.();
    } catch {
      toast.error('Could not start demo session');
    }
  };

  const chars = user?.characters || [];
  const c = chars[active] || chars[0];
  const totalWeight = c ? c.inventory.reduce((s, i) => s + i.weight * i.amount, 0) : 0;
  const netWorth = c
    ? c.cash + c.bank + c.properties.reduce((s, p) => s + p.value, 0)
    : 0;

  return (
    <section id="dashboard" className="relative py-24 px-5 sm:px-8" data-testid="dashboard-section">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#7b2ff7] mb-3">Player UCP</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Your <span className="neon-text">Control Panel</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Link your Discord to manage your characters, finances, inventory, health and assets in
            real time.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center h-64 glass rounded-2xl" data-testid="dashboard-loading">
            <Loader2 className="animate-spin text-[#a64dff]" size={32} />
          </div>
        ) : !user ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 relative overflow-hidden glass rounded-3xl p-10 sm:p-14 text-center"
            data-testid="discord-login-panel"
          >
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#7b2ff7]/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#a64dff]/25 blur-3xl" />
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
                <DiscordMark size={20} /> Login via Discord
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="mt-12">
            {/* Header + character switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 glass rounded-2xl p-5" data-testid="dashboard-welcome">
              <div className="flex items-center gap-4">
                {user.discord?.avatar && (
                  <img src={user.discord.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-[#a64dff]/50" />
                )}
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Signed in as</div>
                  <div className="font-outfit text-xl font-bold">{user.discord?.username}</div>
                </div>
                <span className="ml-2 inline-flex items-center gap-2 text-sm text-[#a64dff]">
                  <span className="h-2 w-2 rounded-full bg-[#a64dff] live-dot" /> Linked
                </span>
              </div>
              <div className="lg:ml-auto flex flex-wrap gap-2">
                {chars.map((ch, i) => (
                  <button
                    key={ch.id}
                    onClick={() => setActive(i)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-colors ${
                      active === i ? 'bg-gradient-to-r from-[#a64dff]/25 to-[#7b2ff7]/15 border border-[#a64dff]/40' : 'glass hover:bg-white/10'
                    }`}
                    data-testid={`char-switch-${i}`}
                  >
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-[#7b2ff7]/25 text-[#a64dff] font-outfit font-bold">
                      {ch.firstname[0]}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-tight">{ch.name}</span>
                      <span className="block text-[11px] text-slate-400">Lvl {ch.level} · {ch.primary ? 'Main' : 'Alt'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {c && (
              <>
                {/* Vitals */}
                <Card className="mb-6" testid="card-vitals">
                  <div className="flex items-center gap-2 mb-5">
                    <Heart size={18} className="text-[#ef4444]" />
                    <h3 className="font-outfit font-bold text-lg">Vitals</h3>
                    <span className="ml-auto text-xs text-slate-500">Last synced from city</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    {VITALS.map((v) => (
                      <div key={v.key} data-testid={`vital-${v.key}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                            <v.icon size={14} style={{ color: v.color }} /> {v.label}
                          </span>
                          <span className="text-sm font-bold" style={{ color: v.color }}>{c.status[v.key]}%</span>
                        </div>
                        <Bar value={c.status[v.key]} color={v.color} />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Money */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                  <Card testid="card-cash">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest"><Wallet size={14} /> Cash</div>
                    <div className="font-outfit text-2xl font-black text-[#a64dff] mt-2">{money(c.cash)}</div>
                  </Card>
                  <Card testid="card-bank">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest"><Landmark size={14} /> Bank</div>
                    <div className="font-outfit text-2xl font-black text-[#7b2ff7] mt-2">{money(c.bank)}</div>
                  </Card>
                  <Card testid="card-crypto">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest"><Bitcoin size={14} /> Crypto</div>
                    <div className="font-outfit text-2xl font-black text-amber-400 mt-2">{c.crypto} <span className="text-sm text-slate-500">QBIT</span></div>
                  </Card>
                  <Card testid="card-networth">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest"><TrendingUp size={14} /> Net Worth</div>
                    <div className="font-outfit text-2xl font-black text-emerald-400 mt-2">{money(netWorth)}</div>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl flex flex-wrap h-auto gap-1">
                    {[
                      ['overview', 'Overview', User],
                      ['inventory', 'Inventory', Package],
                      ['bank', 'Bank', Landmark],
                      ['assets', 'Assets', Home],
                    ].map(([v, label, Icon]) => (
                      <TabsTrigger
                        key={v}
                        value={v}
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#a64dff] data-[state=active]:to-[#7b2ff7] data-[state=active]:text-zinc-950 rounded-lg px-4 py-2 text-sm font-semibold text-slate-300"
                        data-testid={`tab-${v}`}
                      >
                        <Icon size={15} className="mr-2" /> {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Overview */}
                  <TabsContent value="overview" className="mt-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Card testid="overview-character">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#a64dff]/20 text-[#a64dff]"><User size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Character Registry</h3>
                        </div>
                        <InfoRow label="Name" value={c.name} />
                        <InfoRow label="Citizen ID" value={c.citizen_id} mono />
                        <InfoRow label="Job" value={`${c.job.label} · ${c.job.grade}`} />
                        <InfoRow label="On Duty" value={c.job.onduty ? 'Yes' : 'No'} />
                        <InfoRow label="Gang" value={c.gang} />
                        <InfoRow label="Phone" value={c.phone} mono />
                        <InfoRow label="Playtime" value={`${c.playtime_hours} hrs`} />
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                            <span>Level {c.level}</span><span>{c.xp}% to next</span>
                          </div>
                          <Bar value={c.xp} color="#a64dff" />
                        </div>
                      </Card>

                      <Card testid="overview-skills">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#7b2ff7]/20 text-[#7b2ff7]"><TrendingUp size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Skills</h3>
                        </div>
                        <div className="space-y-4">
                          {c.skills.map((s) => (
                            <div key={s.name}>
                              <div className="flex justify-between mb-1.5 text-sm"><span className="text-slate-300">{s.name}</span><span className="font-semibold text-[#a64dff]">{s.level}</span></div>
                              <Bar value={s.level} color="#7b2ff7" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 pt-4 border-t border-white/5">
                          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Licenses</div>
                          <div className="flex flex-wrap gap-2">
                            <Pill ok={c.licenses.drivers} label="Drivers" />
                            <Pill ok={c.licenses.weapons} label="Weapons" />
                            <Pill ok={c.licenses.commercial} label="Commercial" />
                            <Pill ok={c.licenses.pilot} label="Pilot" />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Inventory */}
                  <TabsContent value="inventory" className="mt-6">
                    <Card testid="inventory-card">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#a64dff]/20 text-[#a64dff]"><Package size={20} /></span>
                        <h3 className="font-outfit font-bold text-lg">Inventory</h3>
                        <span className="ml-auto text-sm text-slate-400">{c.inventory.length} items</span>
                      </div>
                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Carry Weight</span>
                          <span className="font-mono">{totalWeight.toFixed(1)} / {c.max_weight} kg</span>
                        </div>
                        <Bar value={(totalWeight / c.max_weight) * 100} color={totalWeight / c.max_weight > 0.85 ? '#ef4444' : '#a64dff'} />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3" data-testid="inventory-grid">
                        {c.inventory.map((it, i) => {
                          const Icon = itemIcon(it);
                          const col = RARITY[it.rarity] || RARITY.common;
                          return (
                            <div
                              key={i}
                              className="relative aspect-square rounded-xl bg-white/5 border p-2 flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-colors group"
                              style={{ borderColor: `${col}55` }}
                              title={`${it.label} (${it.rarity})`}
                              data-testid={`inv-item-${it.name}`}
                            >
                              <span className="absolute top-1 right-1.5 text-[11px] font-bold font-mono px-1.5 rounded bg-black/50" style={{ color: col }}>x{it.amount}</span>
                              <Icon size={26} style={{ color: col }} />
                              <span className="text-[11px] text-slate-300 text-center leading-tight line-clamp-2">{it.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Bank */}
                  <TabsContent value="bank" className="mt-6">
                    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
                      <Card testid="bank-summary">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#7b2ff7]/20 text-[#7b2ff7]"><Landmark size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Accounts</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-300"><Wallet size={16} /> Cash</span>
                            <span className="font-outfit font-bold text-[#a64dff]">{money(c.cash)}</span>
                          </div>
                          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-300"><Landmark size={16} /> Bank</span>
                            <span className="font-outfit font-bold text-[#7b2ff7]">{money(c.bank)}</span>
                          </div>
                          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-300"><Bitcoin size={16} /> Crypto (QBIT)</span>
                            <span className="font-outfit font-bold text-amber-400">{c.crypto}</span>
                          </div>
                        </div>
                      </Card>
                      <Card testid="bank-transactions">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#a64dff]/20 text-[#a64dff]"><Clock size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Recent Transactions</h3>
                        </div>
                        <div className="space-y-2.5">
                          {c.transactions.map((t, i) => {
                            const inbound = t.type === 'deposit' || t.type === 'paycheck';
                            return (
                              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                                <span className={`grid place-items-center h-9 w-9 rounded-lg ${inbound ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                  {inbound ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm capitalize">{t.type} · {t.label}</div>
                                  <div className="text-xs text-slate-400">{timeAgo(t.date)}</div>
                                </div>
                                <div className={`ml-auto font-semibold ${inbound ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {inbound ? '+' : '-'}{money(t.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Assets */}
                  <TabsContent value="assets" className="mt-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Card testid="assets-properties">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#a64dff]/20 text-[#a64dff]"><Home size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Property Ledger</h3>
                        </div>
                        <div className="space-y-3">
                          {c.properties.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                              <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#a64dff]/15 text-[#a64dff]">
                                {p.type === 'Warehouse' ? <Warehouse size={17} /> : <Home size={17} />}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm">{p.type}</div>
                                <div className="text-xs text-slate-400 truncate">{p.location}</div>
                              </div>
                              <div className="ml-auto text-sm font-semibold text-[#7b2ff7]">{money(p.value)}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card testid="assets-vehicles">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#7b2ff7]/20 text-[#7b2ff7]"><Car size={20} /></span>
                          <h3 className="font-outfit font-bold text-lg">Garage & Vehicles</h3>
                        </div>
                        <div className="space-y-3">
                          {c.vehicles.map((v, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                              <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#7b2ff7]/15 text-[#7b2ff7]"><Car size={17} /></span>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm">{v.model}</div>
                                <div className="text-xs text-slate-400">{v.garage}{v.class ? ` · ${v.class}` : ''}</div>
                              </div>
                              <div className="ml-auto flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                                  <KeyRound size={11} /> {v.plate}
                                </span>
                                <span className={`text-[11px] font-semibold ${v.stored ? 'text-[#a64dff]' : 'text-amber-400'}`}>
                                  {v.stored ? 'Stored' : 'Impounded'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
