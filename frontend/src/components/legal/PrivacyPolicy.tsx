import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, Mail } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-wide">
              Politique de Confidentialité — ZAP2
            </h1>
            <p className="text-xs text-zinc-400 font-sans">Dernière mise à jour : 18 Août 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 font-sans leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#bbf246]" />
              1. Introduction & Engagement
            </h2>
            <p>
              L'application <strong>ZAP2</strong> (accessible sur https://zap2.onrender.com) respecte la vie privée de ses utilisateurs et s'engage à protéger l'ensemble des données personnelles collectées lors de l'utilisation de nos services de découpe vidéo intelligente et de multi-diffusion sur les réseaux sociaux (TikTok et YouTube Shorts).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#bbf246]" />
              2. Données collectées via TikTok et YouTube
            </h2>
            <p>Lorsque vous connectez vos comptes sociaux à ZAP2 via le protocole OAuth2 officiel :</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li><strong>Identifiant de compte public :</strong> Nom d'affichage, identifiant unique (@username), photo de profil.</li>
              <li><strong>Tokens d'authentification :</strong> Jetons d'accès (Access Tokens) et jetons de rafraîchissement chiffrés servant exclusivement à publier vos extraits vidéo avec votre consentement explicite.</li>
              <li><strong>Contenus vidéo :</strong> Fichiers vidéo importés et clips 9:16 générés pour les besoins de l'édition et de la diffusion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#bbf246]" />
              3. Utilisation des données de l'API TikTok for Developers
            </h2>
            <p>
              ZAP2 utilise les API officielles de TikTok (<em>Login Kit</em>, <em>Content Posting API</em>) exclusivement pour :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li>Permettre l'authentification sécurisée de l'utilisateur.</li>
              <li>Permettre à l'utilisateur de téléverser et planifier des vidéos 9:16 sur son propre compte TikTok.</li>
              <li>Consulter l'état de publication d'une vidéo demandée par l'utilisateur.</li>
            </ul>
            <p className="text-[#bbf246] font-semibold text-xs mt-1">
              ZAP2 ne vend, ne loue, ni ne transfère aucune donnée TikTok ou information personnelle à des tiers ou courtiers de données.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-[#bbf246]" />
              4. Suppression des Données & Révocation d'Accès
            </h2>
            <p>
              Vous pouvez à tout moment déconnecter vos comptes sociaux directement depuis l'onglet <strong>"Réseaux & Auto-Post"</strong> de l'application ZAP2 ou en révoquant l'accès depuis vos paramètres de sécurité TikTok (<em>Paramètres & Confidentialité &gt; Sécurité &gt; Applications et Services autorisés</em>).
            </p>
            <p>
              Pour toute demande de suppression intégrale de vos données personnelles et vidéos de nos serveurs, vous pouvez nous contacter à l'adresse ci-dessous.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#bbf246]" />
              5. Contact & Délégué à la Protection des Données
            </h2>
            <p>
              Pour toute question concernant cette politique ou l'exercice de vos droits, vous pouvez nous contacter à :<br />
              <strong className="text-white font-mono">contact@zap2.app</strong> ou via notre repository officiel <a href="https://github.com/kalifa4y/Zap2" className="text-[#bbf246] underline" target="_blank" rel="noreferrer">github.com/kalifa4y/Zap2</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
