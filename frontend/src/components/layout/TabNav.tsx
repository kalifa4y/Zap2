import React from 'react';
import { UploadCloud, Film, CalendarCheck } from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';

export const TabNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  const tabs = [
    { id: 'upload' as const, label: '1. Ingestion & Découpe IA', icon: UploadCloud, desc: 'Fichier vidéo, Lien Web ou TikTok Live' },
    { id: 'studio' as const, label: '2. Studio 9:16 & Titres Animés', icon: Film, desc: 'Clips 45-90s, Hook titles & sous-titres' },
    { id: 'accounts' as const, label: '3. Planificateur & Multi-Posting', icon: CalendarCheck, desc: 'Calendrier automatique & publication' },
  ];

  return (
    <div className="border-b border-[#2b2b38] bg-[#0d0d11]/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center gap-3 border-b-2 py-4 px-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'border-[#bbf246] text-white'
                    : 'border-transparent text-zinc-400 hover:border-[#bbf246]/40 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#bbf246] text-[#0d0d11] font-bold shadow-md shadow-[#bbf246]/30'
                      : 'bg-[#1b1b24] text-zinc-400 group-hover:bg-[#242432] group-hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className={`font-heading text-base ${isActive ? 'text-white font-bold' : ''}`}>{tab.label}</div>
                  <div className="hidden sm:block text-[11px] font-sans text-zinc-400">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
