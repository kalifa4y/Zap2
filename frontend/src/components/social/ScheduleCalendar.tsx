import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { PublishJob } from '../../types';

export const ScheduleCalendar: React.FC = () => {
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningNow, setIsRunningNow] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'>('all');

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCalendarJobs();
      setJobs(data);
    } catch (err) {
      console.error("Failed to load schedule calendar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRunNow = async () => {
    setIsRunningNow(true);
    try {
      await api.runSchedulerNow();
      await fetchCalendar();
    } catch (err) {
      console.error("Run now error:", err);
    } finally {
      setIsRunningNow(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (window.confirm("Annuler et supprimer ce post programmé ?")) {
      try {
        await api.cancelPublishJob(jobId);
        setJobs(jobs.filter((j) => j.id !== jobId));
      } catch (err) {
        console.error("Delete job error:", err);
      }
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === 'all') return true;
    return j.status === statusFilter;
  });

  const scheduledCount = jobs.filter((j) => j.status === 'SCHEDULED').length;
  const publishedCount = jobs.filter((j) => j.status === 'PUBLISHED').length;

  return (
    <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-6 backdrop-blur-xl space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2b2b38]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/25">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading tracking-wide">
              Calendrier & File d'Attente Automatisée
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Diffusion autonome sur YouTube Shorts, TikTok & Instagram Reels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchCalendar}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[#2b2b38] bg-[#1b1b24] hover:bg-[#242432] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#bbf246]' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleRunNow}
            disabled={isRunningNow || scheduledCount === 0}
            className="flex items-center gap-2 rounded-xl bg-[#bbf246] px-4 py-2 text-xs font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/25 hover:bg-[#a2d92f] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all font-heading tracking-wide"
          >
            {isRunningNow ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0d0d11]" /> : <Play className="h-3.5 w-3.5 fill-[#0d0d11] text-[#0d0d11]" />}
            <span>Exécuter les posts dus ({scheduledCount})</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#bbf246]/30 bg-[#1b1b24] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400">En attente (Planifiés)</p>
            <p className="text-2xl font-black text-[#bbf246] font-heading">{scheduledCount}</p>
          </div>
          <Clock className="h-6 w-6 text-[#bbf246]/50" />
        </div>

        <div className="rounded-2xl border border-[#2b2b38] bg-[#1b1b24] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400">Publiés avec succès</p>
            <p className="text-2xl font-black text-white font-heading">{publishedCount}</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-400/50" />
        </div>

        <div className="rounded-2xl border border-[#2b2b38] bg-[#1b1b24] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400">Fréquences Actives</p>
            <p className="text-base font-bold text-[#bbf246] font-heading">Auto-Sync 1h-24h</p>
          </div>
          <Sparkles className="h-6 w-6 text-[#bbf246]/50" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold font-heading transition-all ${
            statusFilter === 'all'
              ? 'bg-[#bbf246] text-[#0d0d11] shadow'
              : 'bg-[#1b1b24] text-zinc-400 hover:text-white border border-[#2b2b38]'
          }`}
        >
          Tous ({jobs.length})
        </button>
        <button
          onClick={() => setStatusFilter('SCHEDULED')}
          className={`px-3 py-1 rounded-xl text-xs font-bold font-heading transition-all ${
            statusFilter === 'SCHEDULED'
              ? 'bg-[#bbf246] text-[#0d0d11] shadow'
              : 'bg-[#1b1b24] text-zinc-400 hover:text-white border border-[#2b2b38]'
          }`}
        >
          À Venir ({scheduledCount})
        </button>
        <button
          onClick={() => setStatusFilter('PUBLISHED')}
          className={`px-3 py-1 rounded-xl text-xs font-bold font-heading transition-all ${
            statusFilter === 'PUBLISHED'
              ? 'bg-emerald-500 text-white shadow'
              : 'bg-[#1b1b24] text-zinc-400 hover:text-white border border-[#2b2b38]'
          }`}
        >
          Diffusés ({publishedCount})
        </button>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-[#2b2b38] p-8">
            <Layers className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-300 font-heading">Aucun post dans la file d'attente</p>
            <p className="text-xs text-zinc-500 font-sans mt-1">
              Rendez-vous dans le Studio pour sélectionner un Short et choisir "Auto-Programmation".
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isScheduled = job.status === 'SCHEDULED';
            const isPublished = job.status === 'PUBLISHED';
            const isFailed = job.status === 'FAILED';

            return (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#2b2b38] bg-[#1b1b24]/80 p-4 transition-all hover:border-[#bbf246]/50"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#242432] text-[#bbf246] font-black uppercase text-xs">
                    {job.platform.slice(0, 2)}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-heading">
                        {job.platform}
                      </span>
                      {job.frequency_interval && (
                        <span className="rounded-md bg-[#bbf246]/20 border border-[#bbf246]/40 px-1.5 py-0.2 text-[9px] font-bold text-[#bbf246] font-mono">
                          {job.frequency_interval}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-zinc-100 truncate max-w-sm">
                      {job.custom_title || `Clip ID: ${job.clip_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2b2b38]">
                  {/* Status & Time */}
                  <div className="text-left sm:text-right">
                    {isScheduled && (
                      <div className="flex items-center sm:justify-end gap-1.5 text-xs text-[#bbf246] font-mono font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {job.scheduled_at
                            ? new Date(job.scheduled_at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Prochain créneau'}
                        </span>
                      </div>
                    )}
                    {isPublished && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Publié
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Erreur
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {isScheduled && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      title="Annuler ce post"
                      className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
