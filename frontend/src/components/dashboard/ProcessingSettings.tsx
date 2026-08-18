import React from 'react';
import { Sliders, Volume2, Mic, Clock, Sparkles } from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';

export const ProcessingSettings: React.FC = () => {
  const { processingSettings, setProcessingSettings } = useStudioStore();

  return (
    <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/90 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 pb-4 border-b border-[#2b2b38]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/20">
          <Sliders className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white font-heading tracking-wide">Paramètres de Découpe IA & Viralité</h3>
          <p className="text-xs text-zinc-400 font-sans">Ajustez la sensibilité acoustique, le regroupement thématique et la durée des clips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Silence Threshold dB */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Volume2 className="h-3.5 w-3.5 text-[#bbf246]" />
              Seuil de Silence (dB)
            </span>
            <span className="font-mono font-bold text-[#bbf246]">{processingSettings.silence_db} dB</span>
          </div>
          <input
            type="range"
            min="-50"
            max="-15"
            step="1"
            value={processingSettings.silence_db}
            onChange={(e) => setProcessingSettings({ silence_db: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[#1b1b24] rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>-50 dB (Très sensible)</span>
            <span>-15 dB (Moins sensible)</span>
          </div>
        </div>

        {/* Min Silence Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-[#bbf246]" />
              Durée minimale de silence (Jump-cut)
            </span>
            <span className="font-mono font-bold text-[#bbf246]">{processingSettings.min_silence_duration}s</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={processingSettings.min_silence_duration}
            onChange={(e) => setProcessingSettings({ min_silence_duration: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[#1b1b24] rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0.2s (Coupes dynamiques)</span>
            <span>2.0s (Pauses longues)</span>
          </div>
        </div>

        {/* Whisper Model */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Mic className="h-3.5 w-3.5 text-[#bbf246]" />
            Modèle Faster-Whisper (Transcription)
          </label>
          <select
            value={processingSettings.whisper_model}
            onChange={(e) => setProcessingSettings({ whisper_model: e.target.value })}
            className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3.5 py-2.5 text-xs font-medium text-zinc-200 focus:border-[#bbf246] focus:outline-none focus:ring-1 focus:ring-[#bbf246]"
          >
            <option value="tiny">Tiny — Ultra rapide (CPU basique)</option>
            <option value="base">Base (Recommandé) — Équilibré et rapide</option>
            <option value="small">Small — Précision supérieure</option>
            <option value="medium">Medium — Haute fidélité (GPU recommandé)</option>
          </select>
        </div>

        {/* Target Clip Duration (45s to 90s) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-[#bbf246]" />
              Durée cible thématique (~1 min)
            </span>
            <span className="font-mono font-bold text-[#bbf246]">
              {processingSettings.min_clip_duration}s – {processingSettings.max_clip_duration}s
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={processingSettings.min_clip_duration}
              onChange={(e) => setProcessingSettings({ min_clip_duration: parseFloat(e.target.value) })}
              className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3 py-2 text-xs text-zinc-200 focus:border-[#bbf246]"
            >
              <option value="35">Min: 35s</option>
              <option value="45">Min: 45s (Recommandé)</option>
              <option value="55">Min: 55s</option>
            </select>
            <select
              value={processingSettings.max_clip_duration}
              onChange={(e) => setProcessingSettings({ max_clip_duration: parseFloat(e.target.value) })}
              className="w-full rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-3 py-2 text-xs text-zinc-200 focus:border-[#bbf246]"
            >
              <option value="60">Max: 60s (Shorts Standard)</option>
              <option value="75">Max: 75s</option>
              <option value="90">Max: 90s (Reels / TikTok Max)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
