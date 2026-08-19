import React from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { SocialAccount } from '../../types';
import { AccountCard } from './AccountCard';
import { ScheduleCalendar } from './ScheduleCalendar';

interface Props {
  accounts: SocialAccount[];
  onRefresh: () => void;
}

export const SocialAccounts: React.FC<Props> = ({ accounts, onRefresh }) => {
  const getAccount = (plat: 'youtube' | 'tiktok') => {
    return accounts.find((acc) => acc.platform.toLowerCase() === plat);
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#bbf246]/10 px-3 py-1 text-xs font-bold text-[#bbf246] border border-[#bbf246]/30 font-heading">
            <ShieldCheck className="h-3.5 w-3.5 text-[#bbf246]" />
            <span>OAuth2 Sécurisé & Auto-Diffusion</span>
          </div>
          <h2 className="text-3xl font-black text-white font-heading tracking-wide">
            Comptes Réseaux & Planificateur Autonome
          </h2>
          <p className="text-xs text-zinc-300 max-w-xl font-sans leading-relaxed">
            Associez vos comptes officiels YouTube Shorts et TikTok. ZAP2 gère la diffusion automatique à vos fréquences souhaitées (toutes les 1h, 2h, 5h ou par jour) sans aucune intervention manuelle.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#1b1b24] p-4 border border-[#2b2b38] text-xs font-mono text-zinc-300 shadow-inner">
          <KeyRound className="h-4 w-4 text-[#bbf246] flex-shrink-0" />
          <span>Gestion des tokens sécurisée</span>
        </div>
      </div>

      {/* Social Accounts Grid (2 columns: YouTube & TikTok) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountCard platform="youtube" account={getAccount('youtube')} onRefresh={onRefresh} />
        <AccountCard platform="tiktok" account={getAccount('tiktok')} onRefresh={onRefresh} />
      </div>

      {/* Auto-Scheduler Calendar & Post Queue */}
      <ScheduleCalendar />
    </div>
  );
};
