import React, { useState, useEffect } from 'react';
import { Radio, Clock, Sparkles, CheckCircle2, AlertCircle, ArrowRight, DownloadCloud } from 'lucide-react';
import { api } from '../../services/api';
import { Project, TikTokLiveSession } from '../../types';
import { useStudioStore } from '../../stores/useStudioStore';

interface Props {
  onProjectLoaded: (project: Project | null) => void;
}

export const TikTokLiveSync: React.FC<Props> = ({ onProjectLoaded }) => {
  const [username, setUsername] = useState('@mon_compte_tiktok');
  const [delayHours, setDelayHours] = useState<number>(3.0);
  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<TikTokLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSessionId, setFetchingSessionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setActiveProjectId } = useStudioStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.listTikTokLiveSessions();
      setSessions(data);
    } catch (err) {
      console.warn("Could not load mock live sessions", err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.connectTikTokLive(username, delayHours);
      setIsConnected(true);
      setStatusMessage(res.message);
      await loadSessions();
    } catch (err: any) {
      setErrorMsg("Erreur lors de la connexion à TikTok Live Studio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReplay = async (session: TikTokLiveSession) => {
    setFetchingSessionId(session.session_id);
    setErrorMsg(null);

    try {
      const project = await api.fetchTikTokLiveReplay(session.username, session.session_id, session.title);
      setActiveProjectId(project.id);
      onProjectLoaded(project);
    } catch (err: any) {
      setErrorMsg("Erreur lors de l'importation de l'enregistrement live.");
    } finally {
      setFetchingSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header & Connection Card */}
      <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/90 p-7 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bbf246] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#bbf246]"></span>
              </span>
              <h3 className="font-heading text-2xl font-black text-white tracking-wide">
                Synchronisation TikTok Live Studio
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans max-w-xl leading-relaxed">
              Connectez votre compte TikTok pour que ZAP2 récupère automatiquement vos replays de live <strong className="text-[#bbf246] font-semibold">3 heures après la fin du direct</strong> et prépare les meilleurs moments viraux.
            </p>
          </div>

          {/* Connection Status Badge */}
          {isConnected && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-[#bbf246]/10 border border-[#bbf246]/30 px-4 py-2 text-xs font-semibold text-[#bbf246]">
              <CheckCircle2 className="h-4 w-4 text-[#bbf246]" />
              <span>Surveillance active ({delayHours}h de délai)</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleConnect} className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold font-heading text-zinc-300 uppercase tracking-wider mb-1.5">
              Nom d'utilisateur TikTok Live
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@votre_compte"
              className="w-full rounded-xl border border-[#2b2b38] bg-[#1b1b24] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold font-heading text-zinc-300 uppercase tracking-wider mb-1.5">
              Délai d'import après live
            </label>
            <div className="relative">
              <select
                value={delayHours}
                onChange={(e) => setDelayHours(parseFloat(e.target.value))}
                className="w-full appearance-none rounded-xl border border-[#2b2b38] bg-[#1b1b24] px-4 py-2.5 text-sm text-white focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
              >
                <option value={0.5}>30 minutes après le live</option>
                <option value={1.0}>1 heure après le live</option>
                <option value={2.0}>2 heures après le live</option>
                <option value={3.0}>3 heures après le live (Recommandé)</option>
                <option value={6.0}>6 heures après le live</option>
              </select>
              <Clock className="absolute right-3.5 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#bbf246] px-5 py-2.5 text-sm font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/25 hover:bg-[#a2d92f] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 font-heading tracking-wide"
            >
              <Sparkles className="h-4 w-4 text-[#0d0d11]" />
              <span className="font-heading text-base text-[#0d0d11] font-black">{isConnected ? 'Mettre à jour' : 'Connecter'}</span>
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#bbf246]/10 border border-[#bbf246]/30 px-4 py-2.5 text-xs text-[#bbf246]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Available Live Stream Replays List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#bbf246]" />
            <span>Enregistrements Live TikTok Détectés</span>
          </h4>
          <span className="text-xs text-zinc-400 font-mono">{sessions.length} replay(s) trouvés</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((sess) => {
            const isFetching = fetchingSessionId === sess.session_id;
            return (
              <div
                key={sess.session_id}
                className="group relative overflow-hidden rounded-2xl border border-[#2b2b38] bg-[#14141a]/80 p-5 hover:border-[#bbf246]/60 transition-all duration-300 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-[#bbf246]/10 border border-[#bbf246]/30 px-2.5 py-1 text-[11px] font-bold text-[#bbf246] font-mono">
                      {sess.username}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#bbf246] bg-[#bbf246]/10 px-2.5 py-0.5 rounded-full border border-[#bbf246]/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#bbf246]"></span>
                      Replay Disponible (~3h)
                    </span>
                  </div>

                  <h5 className="font-heading text-lg font-bold text-white group-hover:text-[#bbf246] transition-colors line-clamp-1">
                    {sess.title}
                  </h5>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono pt-1">
                    <span>⏱ {sess.duration_minutes} min</span>
                    <span>•</span>
                    <span>👥 {sess.viewer_peak.toLocaleString()} spectateurs</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2b2b38]/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-sans">
                    Prêt pour analyse & découpe
                  </span>

                  <button
                    onClick={() => handleFetchReplay(sess)}
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#bbf246] px-4 py-2 text-xs font-bold text-[#0d0d11] shadow-md shadow-[#bbf246]/20 hover:bg-[#a2d92f] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <DownloadCloud className="h-3.5 w-3.5 text-[#0d0d11]" />
                    <span className="font-heading text-sm font-black tracking-wide text-[#0d0d11]">
                      {isFetching ? 'Import en cours...' : 'Importer dans ZAP2'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#0d0d11]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
