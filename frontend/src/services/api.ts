import axios from 'axios';
import { Project, Clip, ProcessVideoOptions, SocialAccount, PublishJob } from '../types';

const getApiBaseUrl = () => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv?.VITE_API_BASE_URL) {
    return metaEnv.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    // When running in production (e.g., Render, Docker, or any port other than Vite dev 5173)
    if (window.location.port !== '5173') {
      return `${window.location.origin}/api/v1`;
    }
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Video Endpoints
  async uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<Project> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Project>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  async downloadVideoFromUrl(url: string): Promise<Project> {
    const response = await apiClient.post<Project>('/videos/download-url', { url });
    return response.data;
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/cut/projects/${projectId}`);
    return response.data;
  },

  async listProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/cut/projects');
    return response.data;
  },

  // Cut & Pipeline Endpoints
  async processVideo(options: ProcessVideoOptions): Promise<{ project_id: string; status: string; message: string }> {
    const response = await apiClient.post('/cut/process', options);
    return response.data;
  },

  async updateClip(clipId: string, data: Partial<Clip>): Promise<Clip> {
    const response = await apiClient.patch<Clip>(`/cut/clips/${clipId}`, data);
    return response.data;
  },

  async deleteClip(clipId: string): Promise<{ deleted: boolean; clip_id: string; project_id: string }> {
    const response = await apiClient.delete<{ deleted: boolean; clip_id: string; project_id: string }>(`/cut/clips/${clipId}`);
    return response.data;
  },

  async deleteProject(projectId: string): Promise<{ deleted: boolean; project_id: string }> {
    const response = await apiClient.delete<{ deleted: boolean; project_id: string }>(`/cut/projects/${projectId}`);
    return response.data;
  },

  getClipStreamUrl(clipId: string): string {
    return `${API_BASE_URL}/cut/clips/${clipId}/stream`;
  },

  getClipDownloadUrl(clipId: string): string {
    return `${API_BASE_URL}/cut/clips/${clipId}/download`;
  },

  getRawVideoStreamUrl(projectId: string): string {
    return `${API_BASE_URL}/videos/stream/${projectId}`;
  },

  // Social & Auth Endpoints
  async getSocialAccounts(): Promise<SocialAccount[]> {
    const response = await apiClient.get<SocialAccount[]>('/social/accounts');
    return response.data;
  },

  async disconnectSocialAccount(accountId: string): Promise<void> {
    await apiClient.delete(`/social/accounts/${accountId}`);
  },

  async getOAuthAuthorizeUrl(platform: string): Promise<{ authorization_url: string; platform: string }> {
    const response = await apiClient.get<{ authorization_url: string; platform: string }>(`/auth/${platform}/authorize`);
    return response.data;
  },

  async publishClip(payload: {
    clip_id: string;
    platforms: string[];
    custom_title?: string;
    custom_description?: string;
  }): Promise<{ message: string; job_ids: string[] }> {
    const response = await apiClient.post('/social/publish', payload);
    return response.data;
  },

  async scheduleClip(payload: {
    clip_id: string;
    platforms: string[];
    scheduled_at?: string;
    frequency_interval?: string;
    custom_title?: string;
    custom_description?: string;
  }): Promise<{ message: string; job_ids: string[] }> {
    const response = await apiClient.post('/social/schedule', payload);
    return response.data;
  },

  async getCalendarJobs(): Promise<PublishJob[]> {
    const response = await apiClient.get<PublishJob[]>('/social/calendar');
    return response.data;
  },

  async runSchedulerNow(): Promise<{ message: string; executed_count: number }> {
    const response = await apiClient.post('/social/scheduler/run-now');
    return response.data;
  },

  async cancelPublishJob(jobId: string): Promise<void> {
    await apiClient.delete(`/social/jobs/${jobId}`);
  },

  async getPublishJob(jobId: string): Promise<PublishJob> {
    const response = await apiClient.get<PublishJob>(`/social/jobs/${jobId}`);
    return response.data;
  },

  // TikTok Live Ingestion Endpoints
  async listTikTokLiveSessions(username?: string): Promise<any[]> {
    const response = await apiClient.get('/tiktok-live/sessions', {
      params: username ? { username } : undefined
    });
    return response.data;
  },

  async connectTikTokLive(username: string, autoFetchDelayHours: number = 3.0): Promise<any> {
    const response = await apiClient.post('/tiktok-live/connect', {
      username,
      auto_fetch_delay_hours: autoFetchDelayHours,
      auto_cut_enabled: true
    });
    return response.data;
  },

  async fetchTikTokLiveReplay(username: string, sessionId?: string, streamTitle?: string): Promise<Project> {
    const response = await apiClient.post<Project>('/tiktok-live/fetch-replay', {
      username,
      session_id: sessionId,
      stream_title: streamTitle,
      instant_download: true
    });
    return response.data;
  },
};
