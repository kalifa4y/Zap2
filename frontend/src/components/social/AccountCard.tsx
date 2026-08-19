import React, { useState } from 'react';
import { Youtube, Share2, CheckCircle2, Unlink, ExternalLink, AlertCircle } from 'lucide-react';
import { SocialAccount } from '../../types';
import { api } from '../../services/api';

interface Props {
  platform: 'youtube' | 'tiktok';
  account?: SocialAccount;
  onRefresh: () => void;
}

export const AccountCard: React.FC<Props> = ({ platform, account, onRefresh }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const platformMeta = {
    youtube: {
      name: 'YouTube Shorts',
      icon: Youtube,
      color: 'bg-[#ff0000] text-white',
      textColor: 'text-red-400',
      badgeBg: 'bg-red-500/10 border-red-500/20 text-red-400',
      desc: 'Publication directe via YouTube Data API v3'
    },
    tiktok: {
      name: 'TikTok',
      icon: Share2,
      color: 'bg-[#bbf246] text-[#0d0d11]',
      textColor: 'text-[#bbf246]',
      badgeBg: 'bg-[#bbf246]/10 border-[#bbf246]/20 text-[#bbf246]',
      desc: 'Posting direct via TikTok Content Posting API'
    }
  };

  const current = platformMeta[platform];
  const Icon = current.icon;
  const isConnected = !!account && account.is_active;

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const res = await api.getOAuthAuthorizeUrl(platform);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        setErrorMsg("URL d'autorisation non reçue du serveur.");
      }
    } catch (err: any) {
      console.error(`Connect ${platform} error:`, err);
      const detail = err.response?.data?.detail || err.message || 'Erreur réseau ou configuration manquante.';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;
    try {
      await api.disconnectSocialAccount(account.id);
      onRefresh();
    } catch (err) {
      console.error(`Disconnect ${platform} error:`, err);
    }
  };

  return (
    <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-6 backdrop-blur-xl flex flex-col justify-between space-y-6 shadow-xl">
      <div className="space-y-4">
        {/* Header with Icon and Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${current.color} shadow-lg`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-heading tracking-wide">{current.name}</h4>
              <p className="text-xs text-zinc-400 font-sans">{current.desc}</p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            isConnected ? 'bg-[#bbf246]/15 border-[#bbf246]/40 text-[#bbf246]' : 'bg-[#1b1b24] border-[#2b2b38] text-zinc-400'
          }`}>
            {isConnected ? <CheckCircle2 className="h-3 w-3" /> : null}
            {isConnected ? 'Connecté' : 'Non associé'}
          </span>
        </div>

        {/* Account Details if Connected */}
        {isConnected ? (
          <div className="rounded-2xl bg-[#1b1b24] p-3.5 border border-[#2b2b38] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {account.avatar_url ? (
                <img src={account.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full border border-[#bbf246]/40" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#bbf246] text-[#0d0d11] flex items-center justify-center text-xs font-bold">
                  {account.account_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-zinc-100 font-heading">{account.account_name}</p>
                <p className="text-[10px] font-mono text-zinc-400">ID: {account.account_id}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-[#242432] transition-colors"
              title="Déconnecter le compte"
            >
              <Unlink className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#1b1b24]/60 p-3.5 border border-dashed border-[#2b2b38] text-xs text-zinc-400 text-center font-sans">
            Aucun compte associé. Associez votre compte pour diffuser ou planifier vos Shorts automatiquement.
          </div>
        )}

        {/* Error message alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Button */}
      {!isConnected && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b1b24] hover:bg-[#242432] border border-[#2b2b38] hover:border-[#bbf246]/50 py-2.5 text-xs font-bold text-zinc-100 transition-all duration-200"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#bbf246]" />
          <span>{isConnecting ? 'Connexion en cours...' : `Connecter ${current.name}`}</span>
        </button>
      )}
    </div>
  );
};
