import React, { useState, useRef } from 'react';
import { UploadCloud, Film, Scissors, Sparkles, AlertCircle, Trash2, Radio, Link as LinkIcon, DownloadCloud, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Project } from '../../types';
import { useStudioStore } from '../../stores/useStudioStore';
import { TikTokLiveSync } from './TikTokLiveSync';

interface Props {
  onProjectLoaded: (project: Project | null) => void;
  activeProject: Project | null;
}

export const VideoUploader: React.FC<Props> = ({ onProjectLoaded, activeProject }) => {
  const [ingestionMode, setIngestionMode] = useState<'upload' | 'tiktok_live' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);

  const { processingSettings, setActiveProjectId } = useStudioStore();

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setIsUploading(true);
    setUploadPercent(0);

    try {
      const project = await api.uploadVideo(file, (percent) => {
        setUploadPercent(percent);
      });
      setActiveProjectId(project.id);
      onProjectLoaded(project);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Erreur lors du téléversement de la vidéo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    setIsDownloadingUrl(true);

    try {
      const project = await api.downloadVideoFromUrl(urlInput.trim());
      setActiveProjectId(project.id);
      onProjectLoaded(project);
      setUrlInput('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Impossible de télécharger la vidéo depuis cette URL.");
    } finally {
      setIsDownloadingUrl(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartProcessing = async () => {
    if (!activeProject) return;
    try {
      await api.processVideo({
        project_id: activeProject.id,
        silence_db: processingSettings.silence_db,
        min_silence_duration: processingSettings.min_silence_duration,
        whisper_model: processingSettings.whisper_model,
        min_clip_duration: processingSettings.min_clip_duration,
        max_clip_duration: processingSettings.max_clip_duration,
      });
      const updated = await api.getProject(activeProject.id);
      onProjectLoaded(updated);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Erreur au lancement du traitement.");
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette vidéo et tout son projet ?")) return;

    try {
      setIsDeleting(true);
      await api.deleteProject(activeProject.id);
      setActiveProjectId(null);
      onProjectLoaded(null);
    } catch (err: any) {
      setErrorMsg("Erreur lors de la suppression de la vidéo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ingestion Mode Selector */}
      <div className="flex items-center justify-center">
        <div className="inline-flex flex-wrap p-1.5 rounded-2xl bg-[#14141a] border border-[#2b2b38] gap-1 shadow-lg">
          <button
            onClick={() => setIngestionMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
              ingestionMode === 'upload'
                ? 'bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>1. Fichier Vidéo Local</span>
          </button>

          <button
            onClick={() => setIngestionMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
              ingestionMode === 'url'
                ? 'bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            <span>2. Lien Web (YouTube / Twitch / TikTok)</span>
          </button>

          <button
            onClick={() => setIngestionMode('tiktok_live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
              ingestionMode === 'tiktok_live'
                ? 'bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>3. TikTok Live Studio Auto</span>
          </button>
        </div>
      </div>

      {/* Mode 1: File Dropzone */}
      {ingestionMode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-[#bbf246] bg-[#bbf246]/10 scale-[1.01]'
              : 'border-[#2b2b38] bg-[#14141a]/80 hover:border-[#bbf246]/60 hover:bg-[#1b1b24]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".mp4,.mov,.mkv,.webm"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#bbf246] text-[#0d0d11] shadow-lg shadow-[#bbf246]/25 transition-transform hover:scale-110">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-white font-heading tracking-wide">
                Déposez votre enregistrement vidéo ici
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans">
                Glissez votre fichier vidéo brut <span className="text-[#bbf246] font-mono font-medium">(.mp4, .mov, .mkv, .webm)</span> ou cliquez pour parcourir vos dossiers.
              </p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full max-w-md space-y-2 pt-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Téléversement local vers ZAP2...</span>
                  <span className="text-[#bbf246] font-bold">{uploadPercent}%</span>
                </div>
                <div className="h-2 w-full bg-[#20202a] rounded-full overflow-hidden border border-[#2b2b38]">
                  <div
                    className="h-full bg-[#bbf246] transition-all duration-300 shadow-sm shadow-[#bbf246]/50"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Online URL Direct Downloader */}
      {ingestionMode === 'url' && (
        <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/90 p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#bbf246] text-[#0d0d11] shadow-md shadow-[#bbf246]/20">
              <DownloadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Importation Automatique via URL (yt-dlp)</h3>
              <p className="text-xs text-zinc-400">Collez le lien d'une vidéo ou rediffusion (YouTube, Twitch, TikTok, direct MP4)</p>
            </div>
          </div>

          <form onSubmit={handleUrlImport} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou lien live Twitch/TikTok"
              disabled={isDownloadingUrl}
              className="flex-1 rounded-xl bg-[#1b1b24] border border-[#2b2b38] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#bbf246] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isDownloadingUrl || !urlInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#bbf246] px-6 py-3 text-sm font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/25 hover:bg-[#a2d92f] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 font-heading tracking-wide"
            >
              {isDownloadingUrl ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0d0d11]" />
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="h-4 w-4 text-[#0d0d11]" />
                  <span>Importer la Vidéo</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: TikTok Live Sync */}
      {ingestionMode === 'tiktok_live' && (
        <TikTokLiveSync onProjectLoaded={onProjectLoaded} />
      )}

      {/* Active Project Overview & Action Button */}
      {activeProject && (
        <div className="rounded-3xl border border-[#2b2b38] bg-[#14141a]/95 p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b1b24] text-[#bbf246] border border-[#2b2b38] shadow-inner">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white font-heading truncate max-w-xs">{activeProject.filename}</h4>
                {activeProject.source_type === 'TIKTOK_LIVE' && (
                  <span className="rounded-md bg-[#bbf246]/15 border border-[#bbf246]/40 px-2 py-0.5 text-[10px] font-bold text-[#bbf246] uppercase">
                    TIKTOK LIVE
                  </span>
                )}
                {activeProject.source_type === 'ONLINE_URL' && (
                  <span className="rounded-md bg-[#bbf246]/15 border border-[#bbf246]/40 px-2 py-0.5 text-[10px] font-bold text-[#bbf246] uppercase">
                    WEB IMPORT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5 font-mono">
                <span>{Math.round(activeProject.duration)}s</span>
                <span>•</span>
                <span>{activeProject.width}x{activeProject.height}</span>
                <span>•</span>
                <span className="text-[#bbf246] font-semibold">{activeProject.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Delete Project Button */}
            <button
              onClick={handleDeleteProject}
              disabled={isDeleting || activeProject.status === 'PROCESSING'}
              title="Supprimer cette vidéo et son projet"
              className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            {activeProject.status !== 'PROCESSING' && (
              <button
                onClick={handleStartProcessing}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#bbf246] px-6 py-3 text-sm font-bold text-[#0d0d11] shadow-lg shadow-[#bbf246]/30 hover:bg-[#a2d92f] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Scissors className="h-4 w-4 text-[#0d0d11]" />
                <span className="font-heading text-base tracking-wide font-black text-[#0d0d11]">Lancer la découpe thématique (45-90s)</span>
                <Sparkles className="h-4 w-4 text-[#0d0d11]" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
