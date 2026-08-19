import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const TermsOfService: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl bg-[#14141a] border border-[#2b2b38] px-4 py-2 text-xs font-bold text-zinc-300 hover:text-[#bbf246] hover:border-[#bbf246]/40 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Retour à l'application</span>
      </button>

      <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#2b2b38]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#bbf246] text-[#0d0d11] shadow-lg shadow-[#bbf246]/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-wide">
              Conditions Générales d'Utilisation (CGU) — ZAP2
            </h1>
            <p className="text-xs text-zinc-400 font-sans">Dernière mise à jour : 18 Août 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 font-sans leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#bbf246]" />
              1. Objet du Service
            </h2>
            <p>
              Le service <strong>ZAP2</strong> propose aux créateurs de contenu, streamers et entreprises une plateforme d'automatisation permettant d'analyser, découper des vidéos au format 9:16 (Shorts) et de programmer leur diffusion sur les plateformes tierces partenaires (TikTok et YouTube Shorts).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#bbf246]" />
              2. Respect des Conditions des Plateformes Tierces
            </h2>
            <p>
              En utilisant ZAP2 pour publier ou programmer du contenu sur TikTok ou YouTube, l'utilisateur s'engage expressément à respecter les règles de communauté et conditions d'utilisation respectives :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li>Conditions d'Utilisation et Règles Communautaires de <strong>TikTok</strong>.</li>
              <li>Conditions d'Utilisation de <strong>YouTube</strong> et Règlement de la communauté Google.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#bbf246]" />
              3. Propriété Intellectuelle & Contenus
            </h2>
            <p>
              L'utilisateur conserve l'intégralité de ses droits de propriété intellectuelle sur les vidéos et flux multimédias importés. L'utilisateur garantit disposer de tous les droits, autorisations et licences nécessaires pour exploiter et rediffuser les contenus traités par ZAP2.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#bbf246]" />
              4. Disponibilité & Responsabilité
            </h2>
            <p>
              ZAP2 s'efforce de maintenir une disponibilité optimale du service mais ne saurait être tenu responsable des interruptions liées aux maintenances, pannes de réseaux tiers ou modifications des politiques d'API des plateformes partenaires.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
