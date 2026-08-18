import React from 'react';
import { ShieldCheck, FileText, Github, ExternalLink, Sparkles } from 'lucide-react';

interface Props {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<Props> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="w-full border-t border-[#2b2b38] bg-[#0d0d11]/80 backdrop-blur-xl py-6 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-white text-base tracking-wider">
              ZAP<span className="text-[#bbf246]">2</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-sans">Studio IA de Repurposing 9:16</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
          <button
            onClick={onOpenPrivacy}
            className="flex items-center gap-1 hover:text-[#bbf246] transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#bbf246]" />
            <span>Politique de Confidentialité</span>
          </button>

          <button
            onClick={onOpenTerms}
            className="flex items-center gap-1 hover:text-[#bbf246] transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-[#bbf246]" />
            <span>Conditions d'Utilisation (CGU)</span>
          </button>

          <a
            href="https://github.com/kalifa4y/Zap2"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
          <Sparkles className="h-3 w-3 text-[#bbf246]" />
          <span>Production Ready v2.0</span>
        </div>
      </div>
    </footer>
  );
};
