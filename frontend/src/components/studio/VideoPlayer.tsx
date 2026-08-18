import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Sparkles } from 'lucide-react';
import { Clip } from '../../types';
import { api } from '../../services/api';
import { useStudioStore } from '../../stores/useStudioStore';

interface Props {
  clip: Clip | null;
}

export const VideoPlayer: React.FC<Props> = ({ clip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    videoDuration,
    setVideoDuration,
    isLooping,
    setIsLooping,
  } = useStudioStore();

  const [isMuted, setIsMuted] = useState(false);

  // Play/Pause toggler
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoDuration]);

  // Update on clip change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [clip?.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  if (!clip) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-[#2b2b38] bg-[#14141a]/60 p-8 text-center text-zinc-500 font-sans">
        <Sparkles className="h-10 w-10 text-[#bbf246] mb-3 opacity-60" />
        <p className="text-sm font-medium">Sélectionnez un clip pour démarrer la lecture 9:16</p>
      </div>
    );
  }

  const streamUrl = api.getClipStreamUrl(clip.id);
  const subStyle = clip.subtitle_style || 'mrbeast';

  // Subtitle styling presets
  const getSubtitleClasses = () => {
    switch (subStyle) {
      case 'cyber_glow':
        return 'text-[#bbf246] drop-shadow-[0_0_12px_rgba(187,242,70,0.9)] font-heading text-xl font-black uppercase tracking-wider text-center';
      case 'gold_energy':
        return 'text-[#ccff00] drop-shadow-[0_0_10px_rgba(204,255,0,0.8)] font-heading text-xl font-black uppercase tracking-wider text-center';
      case 'tiktok_modern':
        return 'text-white bg-[#14141a]/90 border border-[#bbf246]/40 px-3 py-1 rounded-xl text-center font-sans text-sm font-bold shadow-lg';
      case 'mrbeast':
      default:
        return 'text-[#bbf246] text-center font-heading text-2xl font-black uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(187,242,70,0.9)]';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center rounded-3xl border border-[#2b2b38] bg-[#0d0d11] p-4 shadow-2xl overflow-hidden group shadow-[#bbf246]/10"
    >
      {/* 9:16 Vertical Video Frame */}
      <div className="relative aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-2xl bg-black shadow-2xl border border-[#2b2b38]">
        <video
          ref={videoRef}
          src={streamUrl}
          loop={isLooping}
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="h-full w-full object-cover cursor-pointer"
          playsInline
        />

        {/* 1. Animated Stylized Hook Title Overlay (Top/Center) */}
        {clip.hook_title && (
          <div className="absolute top-12 left-3 right-3 flex justify-center pointer-events-none z-10">
            <div className="rounded-2xl bg-[#0d0d11]/90 px-4 py-2 text-center shadow-xl border border-[#bbf246]/50 backdrop-blur-md transform transition-all animate-bounce duration-1000">
              <span className="font-heading text-sm md:text-base font-black text-[#bbf246] uppercase tracking-wider drop-shadow-md">
                {clip.hook_title}
              </span>
            </div>
          </div>
        )}

        {/* 2. Kinetic Word-by-Word Subtitle Overlay (Bottom Third) */}
        <div className="absolute bottom-16 left-4 right-4 flex justify-center pointer-events-none z-10">
          <div className={`p-2 transition-all ${getSubtitleClasses()}`}>
            <span className="inline-block transform scale-105 transition-transform">
              {clip.title.replace(/^Clip #\d+\s*—\s*/, '')}
            </span>
          </div>
        </div>

        {/* Play/Pause Overlay Icon when hovering */}
        <div
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 cursor-pointer ${
            !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#bbf246] text-[#0d0d11] shadow-lg shadow-[#bbf246]/40 backdrop-blur-md transition-transform hover:scale-110">
            {isPlaying ? <Pause className="h-6 w-6 fill-[#0d0d11]" /> : <Play className="h-6 w-6 fill-[#0d0d11] ml-1" />}
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold text-[#bbf246] backdrop-blur-md border border-[#2b2b38] font-mono">
            1080 × 1920 (9:16)
          </span>
          <span className="rounded-full bg-[#bbf246] px-2.5 py-1 text-[10px] font-bold text-[#0d0d11] shadow-sm font-heading tracking-wide">
            ZAP2 SHORT
          </span>
        </div>
      </div>

      {/* Modern Player Controls Bar */}
      <div className="w-full max-w-[340px] pt-4 space-y-2">
        {/* Scrubber */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min="0"
            max={videoDuration || clip.duration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-[#1b1b24] rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
          />
          <span className="font-mono text-[10px] text-[#bbf246] w-8">
            {(videoDuration || clip.duration).toFixed(1)}s
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-zinc-300 hover:text-[#bbf246] transition-colors"
              title="Play/Pause (Espace)"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`transition-colors ${isLooping ? 'text-[#bbf246]' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Lecture en boucle"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Muter le son"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-zinc-300" />}
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Plein écran"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
