import React, { useState } from 'react';
import { Sliders, RotateCw } from 'lucide-react';
import { Clip } from '../../types';
import { api } from '../../services/api';

interface Props {
  clip: Clip | null;
  onClipUpdated: (updated: Clip) => void;
}

export const TimelineAdjuster: React.FC<Props> = ({ clip, onClipUpdated }) => {
  if (!clip) return null;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdjustTime = async (type: 'start' | 'end', delta: number) => {
    if (!clip) return;
    setIsUpdating(true);

    let newStart = clip.start_time;
    let newEnd = clip.end_time;

    if (type === 'start') {
      newStart = Math.max(0, clip.start_time + delta);
      if (newStart >= newEnd - 5) return; // Maintain min 5s duration
    } else {
      newEnd = clip.end_time + delta;
      if (newEnd <= newStart + 5) return;
    }

    try {
      const updated = await api.updateClip(clip.id, {
        start_time: Math.round(newStart * 10) / 10,
        end_time: Math.round(newEnd * 10) / 10,
      });
      onClipUpdated(updated);
    } catch (err) {
      console.error("Failed to update clip timeline:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-4 backdrop-blur-xl space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-100 font-heading tracking-wide">
          <Sliders className="h-3.5 w-3.5 text-[#bbf246]" />
          Ajustement Fin des Bornes Temporelles
        </span>
        {isUpdating && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#bbf246] animate-pulse">
            <RotateCw className="h-3 w-3 animate-spin text-[#bbf246]" />
            Ré-encodage rapide...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Start Time Fine-Tune */}
        <div className="rounded-2xl bg-[#1b1b24] p-3 border border-[#2b2b38] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-sans">Début</span>
            <span className="font-mono font-bold text-[#bbf246]">{clip.start_time.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={isUpdating || clip.start_time <= 0}
              onClick={() => handleAdjustTime('start', -0.5)}
              className="flex-1 rounded-xl bg-[#242432] hover:bg-[#bbf246]/20 hover:text-[#bbf246] py-1 text-xs font-mono text-zinc-200 disabled:opacity-50 transition-colors"
            >
              -0.5s
            </button>
            <button
              disabled={isUpdating}
              onClick={() => handleAdjustTime('start', +0.5)}
              className="flex-1 rounded-xl bg-[#242432] hover:bg-[#bbf246]/20 hover:text-[#bbf246] py-1 text-xs font-mono text-zinc-200 disabled:opacity-50 transition-colors"
            >
              +0.5s
            </button>
          </div>
        </div>

        {/* End Time Fine-Tune */}
        <div className="rounded-2xl bg-[#1b1b24] p-3 border border-[#2b2b38] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-sans">Fin</span>
            <span className="font-mono font-bold text-[#bbf246]">{clip.end_time.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={isUpdating}
              onClick={() => handleAdjustTime('end', -0.5)}
              className="flex-1 rounded-xl bg-[#242432] hover:bg-[#bbf246]/20 hover:text-[#bbf246] py-1 text-xs font-mono text-zinc-200 disabled:opacity-50 transition-colors"
            >
              -0.5s
            </button>
            <button
              disabled={isUpdating}
              onClick={() => handleAdjustTime('end', +0.5)}
              className="flex-1 rounded-xl bg-[#242432] hover:bg-[#bbf246]/20 hover:text-[#bbf246] py-1 text-xs font-mono text-zinc-200 disabled:opacity-50 transition-colors"
            >
              +0.5s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
