import { Gamepad2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-[2] border-t border-white/10 bg-zinc-950 px-5 sm:px-8 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#4facfe] text-zinc-950">
            <Gamepad2 size={18} strokeWidth={2.5} />
          </span>
          <span className="font-outfit font-extrabold tracking-tight">
            NEON<span className="neon-text">CITY</span> RP
          </span>
        </div>
        <p className="text-sm text-slate-500 text-center">
          Not affiliated with Rockstar Games or Take-Two. FiveM is a Cfx.re project.
        </p>
        <p className="text-sm text-slate-500">© 2026 Neon City RP</p>
      </div>
    </footer>
  );
}
