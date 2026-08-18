import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Film } from 'lucide-react';
import { Project } from '../../types';
import { useStudioStore } from '../../stores/useStudioStore';

interface Props {
  project: Project;
}

export const ProcessingProgress: React.FC<Props> = ({ project }) => {
  const { setActiveTab, setSelectedClipId } = useStudioStore();

  const isCompleted = project.status === 'COMPLETED';
  const isFailed = project.status === 'FAILED';

  const handleGoToStudio = () => {
    if (project.clips && project.clips.length > 0) {
      setSelectedClipId(project.clips[0].id);
    }
    setActiveTab('studio');
  };

  return (
    <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#2b2b38]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#bbf246] shadow-md shadow-[#bbf246]/25 text-[#0d0d11]">
            <Sparkles className="h-5 w-5 fill-[#0d0d11]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading tracking-wide">Découpe Thématique & Rendu 9:16</h3>
            <p className="text-xs text-zinc-400 font-mono">{project.filename}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bbf246]/15 px-3.5 py-1 text-xs font-bold text-[#bbf246] border border-[#bbf246]/40">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terminé
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
              <AlertCircle className="h-3.5 w-3.5" />
              Erreur
            </span>
          )}
          {!isCompleted && !isFailed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bbf246]/15 px-3.5 py-1 text-xs font-bold text-[#bbf246] border border-[#bbf246]/30">
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-[#bbf246]"></span>
              {project.progress}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & Stage Info */}
      <div className="py-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">{project.current_stage || "Traitement en cours..."}</span>
          <span className="font-mono font-bold text-[#bbf246]">{project.progress}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-3.5 w-full bg-[#1b1b24] rounded-full overflow-hidden p-0.5 border border-[#2b2b38]">
          <div
            className="h-full bg-[#bbf246] rounded-full transition-all duration-500 shadow-sm shadow-[#bbf246]/40"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        {/* Dynamic Sound Wave Indicator */}
        {!isCompleted && !isFailed && (
          <div className="flex items-center justify-center gap-1.5 py-4">
            <div className="w-1.5 bg-[#bbf246] rounded-full animate-wave-1"></div>
            <div className="w-1.5 bg-[#a2d92f] rounded-full animate-wave-2"></div>
            <div className="w-1.5 bg-[#8bc31f] rounded-full animate-wave-3"></div>
            <div className="w-1.5 bg-[#bbf246] rounded-full animate-wave-4"></div>
            <div className="w-1.5 bg-[#d8fc6b] rounded-full animate-wave-5"></div>
            <span className="ml-3 text-xs text-zinc-400 font-mono">Regroupement thématique, jump-cuts & format 9:16...</span>
          </div>
        )}

        {isFailed && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-300">
            <p className="font-semibold">Une erreur est survenue lors de l'exécution :</p>
            <p className="mt-1 font-mono text-[11px] text-rose-400">{project.error_message}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {isCompleted && (
        <div className="pt-4 border-t border-[#2b2b38] flex items-center justify-between">
          <div className="text-xs text-zinc-300">
            <span className="font-bold text-white font-mono">{project.clips?.length || 0} Shorts</span> thématiques 9:16 prêts pour l'édition
          </div>
          <button
            onClick={handleGoToStudio}
            className="inline-flex items-center gap-2 rounded-xl bg-[#bbf246] px-5 py-2.5 text-xs font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/30 hover:bg-[#a2d92f] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Film className="h-4 w-4 text-[#0d0d11]" />
            <span className="font-heading text-sm tracking-wide font-black text-[#0d0d11]">Ouvrir le Studio 9:16</span>
            <ArrowRight className="h-4 w-4 text-[#0d0d11]" />
          </button>
        </div>
      )}
    </div>
  );
};
