import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2b2b38] bg-[#0d0d11]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#14141a] p-1.5 border border-[#bbf246]/30 shadow-md shadow-[#bbf246]/20 transition-all hover:scale-105 hover:border-[#bbf246]">
            <img src="/logo.png" alt="ZAP2 Logo" className="h-full w-full object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading text-3xl font-black tracking-widest text-white">
                ZAP<span className="text-[#bbf246]">2</span>
              </span>
              <span className="rounded-full bg-[#bbf246]/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#bbf246] border border-[#bbf246]/30 uppercase font-heading">
                AI STUDIO 9:16
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">Découpe Intelligente & Multi-Posting Autonome</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#14141a] px-3.5 py-1.5 border border-[#2b2b38] text-xs text-zinc-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bbf246] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#bbf246]"></span>
            </span>
            <span className="font-medium">Moteur Whisper & FFmpeg : Prêts</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-[#bbf246]/15 px-3.5 py-1.5 border border-[#bbf246]/40 text-xs font-bold text-[#bbf246] font-heading shadow-sm shadow-[#bbf246]/15">
            <Sparkles className="h-3.5 w-3.5 text-[#bbf246]" />
            <span>Virality Engine v2.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};
