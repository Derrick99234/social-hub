import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { ServiceHealthStatus } from '@/types';

export async function GET() {
  const typefullyKey = process.env.TYPEFULLY_API_KEY;
  const isTypefullyConfigured = Boolean(
    typefullyKey && !typefullyKey.includes('your_') && typefullyKey.trim() !== ''
  );

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  const bufferLinkedin = process.env.BUFFER_LINKEDIN_PROFILE_ID;
  const bufferInstagram = process.env.BUFFER_INSTAGRAM_PROFILE_ID;

  const isBufferTokenConfigured = Boolean(
    bufferToken && !bufferToken.includes('your_') && bufferToken.trim() !== ''
  );
  const isLinkedinConfigured = Boolean(
    bufferLinkedin && !bufferLinkedin.includes('your_') && bufferLinkedin.trim() !== ''
  );
  const isInstagramConfigured = Boolean(
    bufferInstagram && !bufferInstagram.includes('your_') && bufferInstagram.trim() !== ''
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseReady = isSupabaseConfigured();

  const status: ServiceHealthStatus = {
    supabase: {
      configured: isSupabaseReady,
      url: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, 'https://$1***$2') : undefined,
      bucket: process.env.SUPABASE_STORAGE_BUCKET || 'media',
    },
    typefully: {
      configured: isTypefullyConfigured,
      channels: ['twitter', 'threads'],
    },
    buffer: {
      configured: isBufferTokenConfigured,
      linkedinProfileConfigured: isLinkedinConfigured,
      instagramProfileConfigured: isInstagramConfigured,
      channels: ['linkedin', 'instagram'],
    },
    auth: {
      passkeyConfigured: Boolean(process.env.DASHBOARD_PASSKEY),
    },
  };

  return NextResponse.json(status);
}
