import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings } from '@/lib/services/settingsService';
import { fetchLiveSocialProfiles } from '@/lib/services/profileSync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getAppSettings();

    return NextResponse.json({
      typefullyApiKeys: settings.typefullyApiKeys.length > 0 ? settings.typefullyApiKeys : [''],
      bufferAccessTokens: settings.bufferAccessTokens.length > 0 ? settings.bufferAccessTokens : [''],
      typefullyApiKey: settings.typefullyApiKeys[0] || '',
      bufferAccessToken: settings.bufferAccessTokens[0] || '',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'media',
      founderPasskey: settings.founderPasskey || 'founder@hub2026',
      marketerPasskey: settings.marketerPasskey || 'marketer@hub2026',
      dashboardPasskey: settings.dashboardPasskey || 'marketer@hub2026',
      updatedAt: settings.updatedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Process Typefully Keys
    let typefullyKeys: string[] = [];
    if (Array.isArray(body.typefullyApiKeys)) {
      typefullyKeys = body.typefullyApiKeys.map((k: string) => k.trim()).filter(Boolean);
    } else if (body.typefullyApiKey) {
      typefullyKeys = [body.typefullyApiKey.trim()];
    }

    // 2. Process Buffer Tokens
    let bufferTokens: string[] = [];
    if (Array.isArray(body.bufferAccessTokens)) {
      bufferTokens = body.bufferAccessTokens.map((k: string) => k.trim()).filter(Boolean);
    } else if (body.bufferAccessToken) {
      bufferTokens = [body.bufferAccessToken.trim()];
    }

    // 3. Save directly to Supabase Database & Storage
    const saved = await saveAppSettings({
      typefullyApiKeys: typefullyKeys,
      bufferAccessTokens: bufferTokens,
      founderPasskey: body.founderPasskey,
      marketerPasskey: body.marketerPasskey,
      dashboardPasskey: body.dashboardPasskey,
    });

    // 4. Immediately sync live profiles using the newly saved keys
    try {
      await fetchLiveSocialProfiles({
        typefullyKeys: saved.typefullyApiKeys,
        bufferTokens: saved.bufferAccessTokens,
      });
    } catch (syncErr) {
      console.warn('Post-save profile sync warning:', syncErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved to database successfully.',
      settings: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings to database';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
