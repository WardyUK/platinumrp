const LOGO = 'https://customer-assets-m6fa6gv7.emergentagent.net/job_fivem-hub-11/artifacts/wbrr848j_PRP-Logo-Transparent.png';

export default function Footer() {
  return (
    <footer className="relative z-[2] border-t border-white/10 bg-zinc-950 px-5 sm:px-8 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src={LOGO} alt="Platinum Roleplay" className="h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
          <span className="font-outfit font-extrabold tracking-tight">
            PLATINUM<span className="neon-text"> ROLEPLAY</span>
          </span>
        </div>
        <p className="text-sm text-slate-500 text-center">
          Not affiliated with Rockstar Games or Take-Two. FiveM is a Cfx.re project.
        </p>
        <p className="text-sm text-slate-500">© 2026 Platinum Roleplay</p>
      </div>
    </footer>
  );
}
