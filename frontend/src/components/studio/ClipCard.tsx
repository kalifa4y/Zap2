import React, { useState } from 'react';
import { Play, Clock, Trash2 } from 'lucide-react';
import { Clip } from '../../types';
import { api } from '../../services/api';

interface Props {
  clip: Clip;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (clipId: string) => void;
}

export const ClipCard: React.FC<Props> = ({ clip, isSelected, onSelect, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer le Short "${clip.title}" ?`)) {
      onDelete(clip.id);
    }
  };

  const score = clip.virality_score || 85;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex cursor-pointer gap-3.5 rounded-2xl border p-3.5 transition-all duration-200 ${
        isSelected
          ? 'border-[#bbf246] bg-[#bbf246]/10 shadow-lg shadow-[#bbf246]/15'
          : 'border-[#2b2b38] bg-[#14141a]/90 hover:border-[#bbf246]/50 hover:bg-[#1b1b24]'
      }`}
    >
      {/* 9:16 Thumbnail Preview */}
      <div className="relative aspect-[9/16] w-20 flex-shrink-0 overflow-hidden rounded-xl bg-black border border-[#2b2b38] shadow-inner">
        <video
          src={api.getClipStreamUrl(clip.id)}
          className="h-full w-full object-cover"
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-between p-1.5">
          {/* Virality badge on thumb */}
          <span className="self-start rounded-md bg-[#bbf246] px-1.5 py-0.5 text-[9px] font-black text-[#0d0d11] shadow font-heading tracking-wider">
            {score}% 🔥
          </span>

          <span className="self-end font-mono text-[9px] font-bold text-[#bbf246] bg-black/80 px-1 py-0.5 rounded border border-white/10">
            {clip.duration.toFixed(1)}s
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#bbf246] text-[#0d0d11] shadow-lg">
            <Play className="h-4 w-4 fill-[#0d0d11] ml-0.5" />
          </div>
        </div>
      </div>

      {/* Clip Info */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-[#bbf246]/15 border border-[#bbf246]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#bbf246] font-heading">
                {clip.thematic_topic || "Moment Fort"}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-400">
                <Clock className="h-3 w-3 text-[#bbf246]" />
                <span>{clip.start_time.toFixed(1)}s–{clip.end_time.toFixed(1)}s</span>
              </div>
            </div>

            {/* Trash button */}
            <button
              onClick={handleDelete}
              title="Supprimer ce clip"
              className={`p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all ${
                isHovered || isSelected ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-zinc-100 font-heading tracking-wide line-clamp-2 group-hover:text-[#bbf246] transition-colors leading-snug">
            {clip.title}
          </h4>

          {clip.hook_title && (
            <p className="text-[11px] font-bold text-[#bbf246] font-heading line-clamp-1">
              {clip.hook_title}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#2b2b38]/60">
          <span className="text-[10px] text-zinc-400 line-clamp-1 font-mono">{clip.hashtags}</span>
          {isSelected && (
            <span className="flex h-2 w-2 rounded-full bg-[#bbf246] shadow-sm shadow-[#bbf246]"></span>
          )}
        </div>
      </div>
    </div>
  );
};
