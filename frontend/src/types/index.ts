export interface Clip {
  id: string;
  project_id: string;
  title: string;
  hook_title?: string;
  thematic_topic?: string;
  virality_score?: number;
  subtitle_style?: 'mrbeast' | 'cyber_glow' | 'tiktok_modern' | 'gold_energy';
  description: string;
  hashtags: string;
  start_time: number;
  end_time: number;
  duration: number;
  file_path_9x16: string | null;
  thumbnail_path: string | null;
  status: 'DRAFT' | 'READY' | 'EXPORTING';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  filename: string;
  file_path: string;
  duration: number;
  width: number;
  height: number;
  source_type?: 'FILE_UPLOAD' | 'TIKTOK_LIVE' | 'ONLINE_URL';
  source_metadata?: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  current_stage?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  clips: Clip[];
}

export interface ProcessVideoOptions {
  project_id: string;
  silence_db: number;
  min_silence_duration: number;
  whisper_model: string;
  min_clip_duration: number;
  max_clip_duration: number;
}

export interface TikTokLiveSession {
  session_id: string;
  username: string;
  title: string;
  status: 'LIVE' | 'ENDED' | 'READY';
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  viewer_peak: number;
  replay_ready: boolean;
  download_url?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'youtube' | 'tiktok';
  account_id: string;
  account_name: string;
  avatar_url?: string;
  is_active: boolean;
  token_expires_at?: string;
  created_at: string;
}

export interface PublishJob {
  id: string;
  clip_id: string;
  social_account_id: string;
  platform: string;
  status: 'PENDING' | 'SCHEDULED' | 'UPLOADING' | 'PUBLISHED' | 'FAILED';
  scheduled_at?: string;
  frequency_interval?: string;
  custom_title?: string;
  custom_description?: string;
  external_video_id?: string;
  external_url?: string;
  error_message?: string;
  published_at?: string;
  created_at: string;
}

export interface ScheduleOptions {
  clip_id: string;
  platforms: string[];
  scheduled_at?: string;
  frequency_interval?: string; // '1h' | '2h' | '5h' | '1_day' | '3_day'
  custom_title?: string;
  custom_description?: string;
}
