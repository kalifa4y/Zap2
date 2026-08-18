import { create } from 'zustand';
import { Clip } from '../types';

interface StudioState {
  activeTab: 'upload' | 'studio' | 'accounts';
  setActiveTab: (tab: 'upload' | 'studio' | 'accounts') => void;

  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;

  // Processing Settings
  processingSettings: {
    silence_db: number;
    min_silence_duration: number;
    whisper_model: string;
    min_clip_duration: number;
    max_clip_duration: number;
  };
  setProcessingSettings: (settings: Partial<StudioState['processingSettings']>) => void;

  // Video Player Controls
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  isLooping: boolean;
  setIsLooping: (isLooping: boolean) => void;

  // Publish Modal State
  publishModalOpen: boolean;
  clipToPublish: Clip | null;
  openPublishModal: (clip: Clip) => void;
  closePublishModal: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  activeTab: 'upload',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id }),

  processingSettings: {
    silence_db: -30.0,
    min_silence_duration: 0.5,
    whisper_model: 'base',
    min_clip_duration: 45.0,
    max_clip_duration: 90.0,
  },
  setProcessingSettings: (newSettings) =>
    set((state) => ({
      processingSettings: { ...state.processingSettings, ...newSettings },
    })),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  currentTime: 0,
  setCurrentTime: (currentTime) => set({ currentTime }),
  videoDuration: 0,
  setVideoDuration: (videoDuration) => set({ videoDuration }),
  isLooping: true,
  setIsLooping: (isLooping) => set({ isLooping }),

  publishModalOpen: false,
  clipToPublish: null,
  openPublishModal: (clip) => set({ publishModalOpen: true, clipToPublish: clip }),
  closePublishModal: () => set({ publishModalOpen: false, clipToPublish: null }),
}));
