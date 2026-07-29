import { useState, useEffect } from 'react';
import { Menu, X, Gamepad2 } from 'lucide-react';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'map', label: 'City Map' },
  { id: 'dashboard', label: 'UCP' },
  { id: 'store', label: 'Store' },
  { id: 'rules', label: 'Rules & Lore' },
];

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? 'backdrop-blur-md bg-zinc-950/80 border-b border-white/10' : 'bg-transparent'
      }`}
      data-testid="main-navbar"
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={() => go('home')} className="flex items-center gap-2" data-testid="nav-logo">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#4facfe] text-zinc-950">
            <Gamepad2 size={20} strokeWidth={2.5} />
          </span>
          <span className="font-outfit font-extrabold text-lg tracking-tight">
            NEON<span className="neon-text">CITY</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/5 transition-colors"
              data-testid={`nav-${l.id}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              {user.discord?.avatar && (
                <img src={user.discord.avatar} alt="" className="h-8 w-8 rounded-full border border-white/20" />
              )}
              <span className="text-sm text-slate-300">{user.discord?.username}</span>
              <button
                onClick={onLogout}
                className="text-sm px-3 py-1.5 rounded-md border border-white/10 hover:border-white/30 text-slate-300 transition-colors"
                data-testid="nav-logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => go('dashboard')}
              className="hidden md:inline-flex text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-zinc-950 hover:opacity-90 transition-opacity"
              data-testid="nav-login-cta"
            >
              Player Login
            </button>
          )}
          <button className="md:hidden text-white" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden backdrop-blur-md bg-zinc-950/95 border-b border-white/10 px-5 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="text-left px-3 py-2.5 text-slate-200 rounded-md hover:bg-white/5"
              data-testid={`nav-mobile-${l.id}`}
            >
              {l.label}
            </button>
          ))}
          {user ? (
            <button onClick={onLogout} className="text-left px-3 py-2.5 text-slate-200 rounded-md hover:bg-white/5">
              Logout ({user.discord?.username})
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
