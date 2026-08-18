import React, { useState } from 'react';
import { X, Share2, Youtube, Instagram, CheckCircle2, AlertCircle, Loader2, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';
import { api } from '../../services/api';
import { PublishJob } from '../../types';

export const PublishModal: React.FC = () => {
  const { publishModalOpen, closePublishModal, clipToPublish } = useStudioStore();

  const [publishMode, setPublishMode] = useState<'instant' | 'schedule'>('instant');
  const [frequencyInterval, setFrequencyInterval] = useState<'1h' | '2h' | '5h' | '1_day' | '3_day' | 'custom'>('2h');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube', 'tiktok', 'instagram']);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (clipToPublish) {
      setCustomTitle(clipToPublish.title);
      setCustomDescription(clipToPublish.description || '');
      setJobs([]);
      setScheduleSuccess(false);
      setErrorMsg(null);
      setIsPublishing(false);
      // Default scheduled time to 1 hour from now formatted for datetime-local
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setScheduledAt(now.toISOString().slice(0, 16));
    }
  }, [clipToPublish?.id]);

  if (!publishModalOpen || !clipToPublish) return null;

  const togglePlatform = (plat: string) => {
    if (selectedPlatforms.includes(plat)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
    } else {
      setSelectedPlatforms([...selectedPlatforms, plat]);
    }
  };

  const handleStartPublish = async () => {
    if (selectedPlatforms.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins une plateforme.");
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);

    try {
      if (publishMode === 'schedule') {
        await api.scheduleClip({
          clip_id: clipToPublish.id,
          platforms: selectedPlatforms,
          frequency_interval: frequencyInterval,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          custom_title: customTitle,
          custom_description: customDescription,
        });
        setScheduleSuccess(true);
        setIsPublishing(false);
        setTimeout(() => {
          closePublishModal();
        }, 1500);
      } else {
        const res = await api.publishClip({
          clip_id: clipToPublish.id,
          platforms: selectedPlatforms,
          custom_title: customTitle,
          custom_description: customDescription,
        });

        // Poll jobs
        const jobIds = res.job_ids;
        const pollInterval = setInterval(async () => {
          try {
            const updatedJobs = await Promise.all(jobIds.map((id) => api.getPublishJob(id)));
            setJobs(updatedJobs);

            const allFinished = updatedJobs.every((j) => j.status === 'PUBLISHED' || j.status === 'FAILED');
            if (allFinished) {
              clearInterval(pollInterval);
              setIsPublishing(false);
            }
          } catch (e) {
            console.error("Job poll error:", e);
          }
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Erreur lors de l'opération.");
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2b2b38]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/25">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading tracking-wide">Multi-Diffusion & Calendrier</h3>
              <p className="text-xs text-zinc-400 font-sans">Publiez ou programmez la diffusion automatique de votre Short</p>
            </div>
          </div>
          <button
            onClick={closePublishModal}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-xl hover:bg-[#1b1b24] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Instant vs Auto-Schedule) */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0d0d11] border border-[#2b2b38]">
          <button
            type="button"
            onClick={() => setPublishMode('instant')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-heading transition-all ${
              publishMode === 'instant'
                ? 'bg-[#bbf246] text-[#0d0d11] shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Publication Immédiate</span>
          </button>
          <button
            type="button"
            onClick={() => setPublishMode('schedule')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-heading transition-all ${
              publishMode === 'schedule'
                ? 'bg-[#bbf246] text-[#0d0d11] shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Auto-Programmation</span>
          </button>
        </div>

        {/* Scheduling Frequency options */}
        {publishMode === 'schedule' && (
          <div className="space-y-3 rounded-2xl bg-[#1b1b24] border border-[#2b2b38] p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#bbf246] font-heading flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Fréquence de Publication Automatique
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">ZAP2 Auto-Bot</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFrequencyInterval('1h')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === '1h'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                Toutes les 1h
              </button>
              <button
                type="button"
                onClick={() => setFrequencyInterval('2h')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === '2h'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                Toutes les 2h
              </button>
              <button
                type="button"
                onClick={() => setFrequencyInterval('5h')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === '5h'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                Toutes les 5h
              </button>
              <button
                type="button"
                onClick={() => setFrequencyInterval('1_day')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === '1_day'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                1x / Jour
              </button>
              <button
                type="button"
                onClick={() => setFrequencyInterval('3_day')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === '3_day'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                3x / Jour
              </button>
              <button
                type="button"
                onClick={() => setFrequencyInterval('custom')}
                className={`py-2 px-1 rounded-xl font-bold font-heading border transition-all ${
                  frequencyInterval === 'custom'
                    ? 'bg-[#bbf246]/20 border-[#bbf246] text-[#bbf246]'
                    : 'bg-[#14141a] border-[#2b2b38] text-zinc-400 hover:text-white'
                }`}
              >
                Date & Heure
              </button>
            </div>

            {frequencyInterval === 'custom' && (
              <div className="pt-2">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl bg-[#14141a] border border-[#2b2b38] px-3.5 py-2 text-xs text-white focus:border-[#bbf246] focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Platform Selection Checkboxes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 font-sans">Sélectionnez les plateformes cibles :</label>
          <div className="grid grid-cols-3 gap-3">
            {/* YouTube */}
            <button
              type="button"
              onClick={() => togglePlatform('youtube')}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                selectedPlatforms.includes('youtube')
                  ? 'border-red-500/80 bg-red-500/15 text-red-400 shadow-md'
                  : 'border-[#2b2b38] bg-[#1b1b24]/60 text-zinc-400 hover:border-[#bbf246]/40'
              }`}
            >
              <Youtube className="h-5 w-5" />
              <span className="text-[11px] font-bold font-heading">YouTube</span>
            </button>

            {/* TikTok */}
            <button
              type="button"
              onClick={() => togglePlatform('tiktok')}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                selectedPlatforms.includes('tiktok')
                  ? 'border-[#bbf246] bg-[#bbf246]/15 text-[#bbf246] shadow-md'
                  : 'border-[#2b2b38] bg-[#1b1b24]/60 text-zinc-400 hover:border-[#bbf246]/40'
              }`}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-[11px] font-bold font-heading">TikTok</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={() => togglePlatform('instagram')}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                selectedPlatforms.includes('instagram')
                  ? 'border-pink-500/80 bg-pink-500/15 text-pink-400 shadow-md'
                  : 'border-[#2b2b38] bg-[#1b1b24]/60 text-zinc-400 hover:border-[#bbf246]/40'
              }`}
            >
              <Instagram className="h-5 w-5" />
              <span className="text-[11px] font-bold font-heading">Instagram</span>
            </button>
          </div>
        </div>

        {/* Custom Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-sans">Titre optimisé avec #Shorts</label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2 text-xs text-white focus:border-[#bbf246] focus:outline-none"
          />
        </div>

        {/* Live Publishing Feedback */}
        {jobs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2b2b38]">
            <h4 className="text-xs font-bold text-zinc-300">Statut de diffusion :</h4>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl bg-[#1b1b24] p-3 border border-[#2b2b38] text-xs"
                >
                  <span className="capitalize font-bold text-zinc-200">{job.platform}</span>

                  <div className="flex items-center gap-2">
                    {job.status === 'UPLOADING' && (
                      <span className="flex items-center gap-1 text-[#bbf246] font-medium">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Upload en cours...
                      </span>
                    )}
                    {job.status === 'PUBLISHED' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Publié avec succès
                        {job.external_url && (
                          <a
                            href={job.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#bbf246] hover:underline inline-flex items-center gap-0.5 ml-1"
                          >
                            Voir <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    )}
                    {job.status === 'FAILED' && (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Échec ({job.error_message || 'Erreur API'})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scheduleSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Short programmé dans le calendrier avec succès ! Le bot publiera automatiquement à la fréquence choisie.</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2b2b38]">
          <button
            onClick={closePublishModal}
            className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            Fermer
          </button>
          <button
            onClick={handleStartPublish}
            disabled={isPublishing}
            className="flex items-center gap-2 rounded-xl bg-[#bbf246] px-5 py-2.5 text-xs font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/25 hover:bg-[#a2d92f] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all font-heading tracking-wide"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin text-[#0d0d11]" /> : publishMode === 'schedule' ? <Calendar className="h-4 w-4 text-[#0d0d11]" /> : <Share2 className="h-4 w-4 text-[#0d0d11]" />}
            <span className="font-heading text-sm font-black text-[#0d0d11]">
              {isPublishing
                ? 'Traitement en cours...'
                : publishMode === 'schedule'
                ? 'Programmer dans le Calendrier'
                : 'Lancer la diffusion directe'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
