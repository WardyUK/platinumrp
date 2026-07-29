import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, Crown, Car, Users } from 'lucide-react';
import { STORE_PACKAGES } from '@/data/mockData';

const STORE_BG =
  'https://images.pexels.com/photos/17195067/pexels-photo-17195067.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

const ICONS = { 'bronze-vip': Crown, 'import-car': Car, 'gang-whitelist': Users };

export default function Store() {
  // In production, this button links to your Tebex/Buycraft package checkout.
  // e.g. window.location.href = `https://your-store.tebex.io/checkout/pkg/${pkg.id}`
  const checkout = (pkg) => {
    toast.success('Redirecting to checkout', {
      description: `${pkg.name} — this demo links to your Tebex store in production.`,
    });
  };

  return (
    <section id="store" className="relative py-24 px-5 sm:px-8 overflow-hidden" data-testid="store-section">
      <div className="absolute inset-0 opacity-20">
        <img src={STORE_BG} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-zinc-950/80" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#a64dff] mb-3">Support the city</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Donation & <span className="neon-text">Store Hub</span>
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Every purchase keeps the servers running and unlocks premium perks. Powered by Tebex —
            instant delivery.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
          {STORE_PACKAGES.map((pkg, i) => {
            const Icon = ICONS[pkg.id] || Crown;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  pkg.featured
                    ? 'bg-gradient-to-b from-[#a64dff]/10 to-[#7b2ff7]/5 border-2 border-[#a64dff]/50 shadow-[0_0_30px_rgba(166,77,255,0.25)]'
                    : 'glass'
                }`}
                data-testid={`store-card-${pkg.id}`}
              >
                {pkg.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#a64dff] to-[#7b2ff7]">
                    {pkg.tagline}
                  </span>
                )}
                <span
                  className={`grid place-items-center h-12 w-12 rounded-xl border border-white/10 ${
                    pkg.featured ? 'text-[#a64dff] bg-[#a64dff]/15' : 'text-[#7b2ff7] bg-[#7b2ff7]/10'
                  }`}
                >
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 font-outfit text-xl font-bold">{pkg.name}</h3>
                {!pkg.featured && <p className="text-sm text-slate-400 mt-1">{pkg.tagline}</p>}

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-outfit text-4xl font-black">${pkg.price}</span>
                  <span className="text-slate-400 text-sm mb-1.5">{pkg.period}</span>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check size={17} className="text-[#a64dff] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => checkout(pkg)}
                  className={`mt-7 w-full py-3 rounded-full font-outfit font-bold transition-all ${
                    pkg.featured
                      ? 'bg-gradient-to-r from-[#a64dff] to-[#7b2ff7] text-zinc-950 hover:shadow-[0_0_25px_rgba(166,77,255,0.6)]'
                      : 'glass hover:bg-white/10 text-white'
                  }`}
                  data-testid={`store-checkout-${pkg.id}`}
                >
                  Get {pkg.name}
                </button>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Payments are securely handled by Tebex. Perks are delivered to your linked character
          automatically.
        </p>
      </div>
    </section>
  );
}
