import React, { useState, useEffect } from 'react';
import { Type, Hash, AlignLeft, Download, Share2, Check, Sparkles, Trash2, Zap, Palette } from 'lucide-react';
import { Clip } from '../../types';
import { api } from '../../services/api';
import { useStudioStore } from '../../stores/useStudioStore';

interface Props {
  clip: Clip | null;
  onClipUpdated: (updated: Clip) => void;
  onDeleteClip?: (clipId: string) => void;
}

export const ClipMetadataForm: React.FC<Props> = ({ clip, onClipUpdated, onDeleteClip }) => {
  const { openPublishModal } = useStudioStore();

  const [title, setTitle] = useState('');
  const [hookTitle, setHookTitle] = useState('');
  const [subtitleStyle, setSubtitleStyle] = useState<'mrbeast' | 'cyber_glow' | 'tiktok_modern' | 'gold_energy'>('mrbeast');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (clip) {
      setTitle(clip.title);
      setHookTitle(clip.hook_title || '🔥 MOMENT INATTENDU EN LIVE !');
      setSubtitleStyle(clip.subtitle_style || 'mrbeast');
      setDescription(clip.description || '');
      setHashtags(clip.hashtags || '#Shorts #Reels #TikTok #Zap2');
    }
  }, [clip?.id]);

  if (!clip) return null;

  const handleSave = async () => {
    try {
      const updated = await api.updateClip(clip.id, {
        title,
        hook_title: hookTitle,
        subtitle_style: subtitleStyle,
        description,
        hashtags,
      });
      onClipUpdated(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Save clip metadata error:", err);
    }
  };

  const handleAddHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags((prev) => `${prev} ${tag}`.trim());
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Supprimer définitivement le Short "${clip.title}" ?`)) {
      onDeleteClip && onDeleteClip(clip.id);
    }
  };

  const recommendedTags = ["#Shorts", "#Reels", "#TikTok", "#Zap2", "#Viral", "#Live", "#Moments"];

  return (
    <div className="flex flex-col justify-between h-full rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-5 backdrop-blur-xl space-y-6 shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2b2b38]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#bbf246]" />
            <h3 className="text-base font-bold text-white font-heading tracking-wide">Métadonnées & Style Viral</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#bbf246]/15 border border-[#bbf246]/40 px-2 py-0.5 text-[10px] font-bold text-[#bbf246] font-mono">
              Score: {clip.virality_score || 88}% 🔥
            </span>
            {isSaved && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#bbf246] bg-[#bbf246]/10 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" />
                Enregistré
              </span>
            )}
          </div>
        </div>

        {/* Hook Title (Top Overlay) */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 font-sans">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#bbf246] fill-[#bbf246]" />
              Titre d'Accroche / Hook Animé (Haut 9:16)
            </span>
            <span className="text-[10px] text-[#bbf246] font-mono font-bold">Incrusté</span>
          </label>
          <input
            type="text"
            value={hookTitle}
            onChange={(e) => setHookTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Ex: 🔥 CE MOMENT INATTENDU EN LIVE !"
            className="w-full rounded-xl bg-[#1b1b24] border border-[#bbf246]/40 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 font-bold focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
          />
        </div>

        {/* Kinetic Subtitles Style Preset */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 font-sans">
            <Palette className="h-3.5 w-3.5 text-[#bbf246]" />
            Style des Sous-titres Cinétiques (Karaoké)
          </label>
          <select
            value={subtitleStyle}
            onChange={(e) => {
              const newStyle = e.target.value as any;
              setSubtitleStyle(newStyle);
              api.updateClip(clip.id, { subtitle_style: newStyle }).then(onClipUpdated);
            }}
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2.5 text-xs font-medium text-zinc-200 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
          >
            <option value="mrbeast">🔥 Style MrBeast (Electric Lime & Blanc Pop)</option>
            <option value="cyber_glow">⚡ Cyber Glow (Néon Chartreuse Zap2)</option>
            <option value="tiktok_modern">✨ TikTok Modern (Blanc Épuré & Boîte Sombre)</option>
            <option value="gold_energy">💡 Gold Energy (Jaune Doré Énergique)</option>
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 font-sans">
            <Type className="h-3.5 w-3.5 text-[#bbf246]" />
            Titre de Publication (YouTube / TikTok / Reels)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Titre accrocheur..."
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 font-sans">
            <AlignLeft className="h-3.5 w-3.5 text-[#bbf246]" />
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Ajoutez une description engageante..."
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246] resize-none"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 font-sans">
            <Hash className="h-3.5 w-3.5 text-[#bbf246]" />
            Hashtags
          </label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            onBlur={handleSave}
            placeholder="#Shorts #Reels #Zap2..."
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246] font-mono"
          />

          {/* Hashtag suggestion pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recommendedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddHashtag(tag)}
                className="rounded-lg bg-[#1b1b24] hover:bg-[#bbf246]/20 hover:text-[#bbf246] hover:border-[#bbf246]/50 border border-[#2b2b38] px-2 py-0.5 text-[10px] font-mono text-zinc-400 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="space-y-2.5 pt-4 border-t border-[#2b2b38]">
        <button
          onClick={() => openPublishModal(clip)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#bbf246] px-4 py-3 text-xs font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/30 hover:bg-[#a2d92f] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
        >
          <Share2 className="h-4 w-4 text-[#0d0d11]" />
          <span className="font-heading text-base font-black tracking-wide text-[#0d0d11]">Publier ou Programmer (YouTube, TikTok, Insta)</span>
        </button>

        <div className="flex items-center gap-2">
          <a
            href={api.getClipDownloadUrl(clip.id)}
            download
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1b1b24] hover:bg-[#242432] border border-[#2b2b38] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#bbf246]" />
            <span>Télécharger (.mp4 9:16)</span>
          </a>

          <button
            onClick={handleDelete}
            title="Supprimer ce clip"
            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
