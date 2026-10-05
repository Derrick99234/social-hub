export type PlatformId = 'twitter' | 'threads' | 'linkedin' | 'instagram';

export type PostStatus = 'idea' | 'draft' | 'scheduled' | 'published' | 'failed';

export type UserRole = 'founder' | 'marketer' | 'admin';

export interface SocialProfile {
  id: string;
  name: string;
  handle: string;
  network: PlatformId;
  service: 'typefully' | 'buffer';
  avatarUrl?: string;
  profileType?: 'personal' | 'page' | 'business';
  isConnected?: boolean;
}

export interface DispatchLog {
  id: string;
  post_id: string;
  channel: PlatformId;
  service: 'typefully' | 'buffer';
  status: 'success' | 'failed' | 'simulated';
  external_id?: string;
  external_url?: string;
  response_payload?: Record<string, unknown> | null;
  error_message?: string;
  dispatched_at: string;
}

export interface Post {
  id: string;
  title?: string;
  content: string;
  channels: PlatformId[];
  status: PostStatus;
  scheduled_at?: string | null;
  published_at?: string | null;
  media_urls: string[];
  author_role: UserRole;
  author_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  dispatch_logs?: DispatchLog[];
}

export interface Idea {
  id: string;
  raw_text: string;
  author: string;
  tags: string[];
  status: 'inbox' | 'in_progress' | 'converted' | 'archived';
  converted_post_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceHealthStatus {
  supabase: {
    configured: boolean;
    url?: string;
    bucket: string;
  };
  typefully: {
    configured: boolean;
    channels: PlatformId[];
  };
  buffer: {
    configured: boolean;
    linkedinProfileConfigured: boolean;
    instagramProfileConfigured: boolean;
    channels: PlatformId[];
  };
  auth: {
    passkeyConfigured: boolean;
  };
}

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  service: 'typefully' | 'buffer';
  charLimit: number;
  icon: string;
  color: string;
  accentBg: string;
  borderActive: string;
}
