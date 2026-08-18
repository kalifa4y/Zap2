import React from 'react';
import { Film } from 'lucide-react';
import { Clip } from '../../types';
import { ClipCard } from './ClipCard';
import { useStudioStore } from '../../stores/useStudioStore';

interface Props {
  clips: Clip[];
  onDeleteClip?: (clipId: string) => void;
}

export const ClipList: React.FC<Props> = ({ clips, onDeleteClip }) => {
  const { selectedClipId, setSelectedClipId } = useStudioStore();

  return (
    <div className="flex h-full flex-col rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-4 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#2b2b38]">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-[#bbf246]" />
          <h3 className="text-base font-bold text-white font-heading tracking-wide">Clips Thématiques ({clips.length})</h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#bbf246] bg-[#1b1b24] border border-[#2b2b38] px-2.5 py-0.5 rounded-full">
          9:16 Viraux
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-zinc-500 font-sans">
            <Film className="h-8 w-8 text-zinc-600 mb-2" />
            <p>Aucun clip généré pour le moment.</p>
          </div>
        ) : (
          clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isSelected={selectedClipId === clip.id}
              onSelect={() => setSelectedClipId(clip.id)}
              onDelete={(id) => onDeleteClip && onDeleteClip(id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
