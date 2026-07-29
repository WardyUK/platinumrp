import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, BookOpen, Gavel } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RULES, LORE } from '@/data/mockData';

const TABS = [
  { key: 'rules', label: 'Server Rules & Laws', icon: Gavel },
  { key: 'lore', label: 'City Lore & Storylines', icon: BookOpen },
];

export default function RulesLore() {
  const [tab, setTab] = useState('rules');

  return (
    <section id="rules" className="relative py-24 px-5 sm:px-8" data-testid="rules-section">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-[#4facfe] mb-3">Read before you play</div>
          <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Rules & <span className="neon-text">Lore Hub</span>
          </h2>
        </div>

        <div className="mt-10 grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sticky sidebar nav */}
          <aside className="lg:sticky lg:top-24 h-max">
            <div className="glass rounded-2xl p-3 flex lg:flex-col gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 lg:flex-none inline-flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors ${
                    tab === t.key
                      ? 'bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/10 text-white border border-[#00f2fe]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid={`rules-tab-${t.key}`}
                >
                  <t.icon size={18} className={tab === t.key ? 'text-[#00f2fe]' : ''} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="glass rounded-2xl p-6 sm:p-10 min-h-[420px]">
            {tab === 'rules' ? (
              <motion.div
                key="rules"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                data-testid="rules-content"
              >
                <div className="flex items-center gap-3 mb-6">
                  <ScrollText className="text-[#00f2fe]" />
                  <h3 className="font-outfit text-xl sm:text-2xl font-bold">Server Rules & Laws</h3>
                </div>
                <Accordion type="single" collapsible defaultValue={RULES[0].id} className="w-full">
                  {RULES.map((r) => (
                    <AccordionItem key={r.id} value={r.id} className="border-white/10">
                      <AccordionTrigger className="text-left font-outfit font-semibold text-base hover:text-[#00f2fe] hover:no-underline" data-testid={`rule-trigger-${r.id}`}>
                        {r.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-3 pt-2">
                          {r.body.map((line, i) => (
                            <li key={i} className="flex gap-3 text-slate-300 leading-relaxed">
                              <span className="text-[#4facfe] font-bold shrink-0">{String(i + 1).padStart(2, '0')}</span>
                              {line}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ) : (
              <motion.div
                key="lore"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                data-testid="lore-content"
              >
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="text-[#4facfe]" />
                  <h3 className="font-outfit text-xl sm:text-2xl font-bold">City Lore & Storylines</h3>
                </div>
                <div className="space-y-8">
                  {LORE.map((l, i) => (
                    <article key={i} className="relative pl-6 border-l-2 border-white/10">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe]" />
                      <h4 className="font-outfit text-lg font-bold neon-text">{l.heading}</h4>
                      <p className="mt-2 text-slate-300 leading-relaxed">{l.text}</p>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
