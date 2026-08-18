import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { Footer } from './components/layout/Footer';
import { VideoUploader } from './components/dashboard/VideoUploader';
import { ProcessingSettings } from './components/dashboard/ProcessingSettings';
import { ProcessingProgress } from './components/dashboard/ProcessingProgress';
import { ClipList } from './components/studio/ClipList';
import { VideoPlayer } from './components/studio/VideoPlayer';
import { TimelineAdjuster } from './components/studio/TimelineAdjuster';
import { ClipMetadataForm } from './components/studio/ClipMetadataForm';
import { SocialAccounts } from './components/social/SocialAccounts';
import { PublishModal } from './components/social/PublishModal';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { useStudioStore } from './stores/useStudioStore';
import { api } from './services/api';
import { Project, Clip } from './types';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    activeTab,
    activeProjectId,
    setActiveProjectId,
    selectedClipId,
    setSelectedClipId,
  } = useStudioStore();

  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/privacy') return 'privacy';
      if (window.location.pathname === '/terms') return 'terms';
    }
    return null;
  });

  // Listen to browser URL changes
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/privacy') setLegalView('privacy');
      else if (window.location.pathname === '/terms') setLegalView('terms');
      else setLegalView(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openPrivacy = () => {
    setLegalView('privacy');
    window.history.pushState({}, '', '/privacy');
  };

  const openTerms = () => {
    setLegalView('terms');
    window.history.pushState({}, '', '/terms');
  };

  const closeLegal = () => {
    setLegalView(null);
    window.history.pushState({}, '', '/');
  };

  // Query project status with auto-polling when PROCESSING
  const { data: activeProject, refetch: refetchProject } = useQuery<Project>({
    queryKey: ['project', activeProjectId],
    queryFn: () => (activeProjectId ? api.getProject(activeProjectId) : Promise.reject('No ID')),
    enabled: !!activeProjectId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'PROCESSING' ? 1500 : false;
    },
  });

  // Query social accounts
  const { data: socialAccounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: () => api.getSocialAccounts(),
  });

  // Auto select first clip when project completed
  useEffect(() => {
    if (activeProject && activeProject.clips && activeProject.clips.length > 0) {
      if (!selectedClipId || !activeProject.clips.some((c) => c.id === selectedClipId)) {
        setSelectedClipId(activeProject.clips[0].id);
      }
    }
  }, [activeProject?.id, activeProject?.status]);

  const selectedClip = activeProject?.clips?.find((c) => c.id === selectedClipId) || null;

  const handleClipUpdated = (updated: Clip) => {
    queryClient.setQueryData(['project', activeProjectId], (old: Project | undefined) => {
      if (!old) return old;
      return {
        ...old,
        clips: old.clips.map((c) => (c.id === updated.id ? updated : c)),
      };
    });
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      await api.deleteClip(clipId);
      queryClient.setQueryData(['project', activeProjectId], (old: Project | undefined) => {
        if (!old) return old;
        const remainingClips = old.clips.filter((c) => c.id !== clipId);
        if (selectedClipId === clipId) {
          setSelectedClipId(remainingClips.length > 0 ? remainingClips[0].id : null);
        }
        return {
          ...old,
          clips: remainingClips,
        };
      });
    } catch (err) {
      console.error("Delete clip error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col font-sans selection:bg-[#bbf246] selection:text-[#0d0d11]">
      {/* Navigation Header */}
      <Header />

      {/* Main Content or Legal View */}
      {legalView === 'privacy' ? (
        <main className="flex-1">
          <PrivacyPolicy onBack={closeLegal} />
        </main>
      ) : legalView === 'terms' ? (
        <main className="flex-1">
          <TermsOfService onBack={closeLegal} />
        </main>
      ) : (
        <>
          <TabNav />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* TAB 1: INGESTION & PIPELINE DASHBOARD */}
            {activeTab === 'upload' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <VideoUploader
                  onProjectLoaded={(proj) => {
                    if (proj) {
                      setActiveProjectId(proj.id);
                      refetchProject();
                    } else {
                      setActiveProjectId(null);
                    }
                  }}
                  activeProject={activeProject || null}
                />

                {activeProject && activeProject.status === 'PROCESSING' && (
                  <ProcessingProgress project={activeProject} />
                )}

                {activeProject && activeProject.status === 'COMPLETED' && (
                  <ProcessingProgress project={activeProject} />
                )}

                <ProcessingSettings />
              </div>
            )}

            {/* TAB 2: STUDIO 9:16 & ÉDITION */}
            {activeTab === 'studio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[650px]">
                {/* Column 1: Clip List */}
                <div className="lg:col-span-3 h-full overflow-hidden">
                  <ClipList
                    clips={activeProject?.clips || []}
                    onDeleteClip={handleDeleteClip}
                  />
                </div>

                {/* Column 2: 9:16 Video Player & Timeline Adjuster */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="flex-1 flex items-center justify-center">
                    <VideoPlayer clip={selectedClip} />
                  </div>
                  <TimelineAdjuster clip={selectedClip} onClipUpdated={handleClipUpdated} />
                </div>

                {/* Column 3: SEO Metadata & Publishing Form */}
                <div className="lg:col-span-4 h-full">
                  <ClipMetadataForm
                    clip={selectedClip}
                    onClipUpdated={handleClipUpdated}
                    onDeleteClip={handleDeleteClip}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: MULTI-POSTING SOCIAL ACCOUNTS */}
            {activeTab === 'accounts' && (
              <div className="max-w-5xl mx-auto">
                <SocialAccounts accounts={socialAccounts} onRefresh={refetchAccounts} />
              </div>
            )}
          </main>
        </>
      )}

      {/* Global Footer with Legal Links */}
      <Footer onOpenPrivacy={openPrivacy} onOpenTerms={openTerms} />

      {/* Global Publish Modal */}
      <PublishModal />
    </div>
  );
};
