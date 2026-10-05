import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const typefullyKeys = process.env.TYPEFULLY_API_KEYS
    ? process.env.TYPEFULLY_API_KEYS.split(',').map((s) => s.trim()).filter(Boolean)
    : process.env.TYPEFULLY_API_KEY
    ? [process.env.TYPEFULLY_API_KEY]
    : [''];

  const bufferTokens = process.env.BUFFER_ACCESS_TOKENS
    ? process.env.BUFFER_ACCESS_TOKENS.split(',').map((s) => s.trim()).filter(Boolean)
    : process.env.BUFFER_ACCESS_TOKEN
    ? [process.env.BUFFER_ACCESS_TOKEN]
    : [''];

  return NextResponse.json({
    typefullyApiKeys: typefullyKeys.length > 0 ? typefullyKeys : [''],
    bufferAccessTokens: bufferTokens.length > 0 ? bufferTokens : [''],
    // Backward compatibility fields
    typefullyApiKey: process.env.TYPEFULLY_API_KEY || '',
    bufferAccessToken: process.env.BUFFER_ACCESS_TOKEN || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'media',
    dashboardPasskey: process.env.DASHBOARD_PASSKEY || 'marketer123',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const envPath = path.join(process.cwd(), '.env.local');

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updateOrAppend = (key: string, value?: string) => {
      if (value === undefined) return;
      process.env[key] = value;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    // Process Typefully Keys
    let typefullyKeys: string[] = [];
    if (Array.isArray(body.typefullyApiKeys)) {
      typefullyKeys = body.typefullyApiKeys.map((k: string) => k.trim()).filter(Boolean);
    } else if (body.typefullyApiKey) {
      typefullyKeys = [body.typefullyApiKey.trim()];
    }

    // Process Buffer Tokens
    let bufferTokens: string[] = [];
    if (Array.isArray(body.bufferAccessTokens)) {
      bufferTokens = body.bufferAccessTokens.map((k: string) => k.trim()).filter(Boolean);
    } else if (body.bufferAccessToken) {
      bufferTokens = [body.bufferAccessToken.trim()];
    }

    updateOrAppend('TYPEFULLY_API_KEY', typefullyKeys[0] || '');
    updateOrAppend('TYPEFULLY_API_KEYS', typefullyKeys.join(','));

    updateOrAppend('BUFFER_ACCESS_TOKEN', bufferTokens[0] || '');
    updateOrAppend('BUFFER_ACCESS_TOKENS', bufferTokens.join(','));

    updateOrAppend('DASHBOARD_PASSKEY', body.dashboardPasskey);
    updateOrAppend('NEXT_PUBLIC_SUPABASE_URL', body.supabaseUrl);
    updateOrAppend('NEXT_PUBLIC_SUPABASE_ANON_KEY', body.supabaseAnonKey);
    updateOrAppend('SUPABASE_SERVICE_ROLE_KEY', body.supabaseServiceKey);
    updateOrAppend('SUPABASE_STORAGE_BUCKET', body.supabaseBucket || 'media');

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
