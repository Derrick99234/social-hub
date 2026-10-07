import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export interface AppSettings {
  typefullyApiKeys: string[];
  bufferAccessTokens: string[];
  founderPasskey?: string;
  marketerPasskey?: string;
  dashboardPasskey?: string;
  updatedAt?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __cachedAppSettings: AppSettings | undefined;
}

const SETTINGS_STORAGE_PATH = 'config/settings.json';
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'data', 'settings.json');

/**
 * Loads App Settings with priority:
 * 1. Server in-memory cache
 * 2. Supabase Database ('app_settings' table if present)
 * 3. Supabase Storage ('config/settings.json' in 'media' bucket)
 * 4. Local disk 'data/settings.json'
 * 5. Environment variables (initial bootstrap only)
 */
export async function getAppSettings(): Promise<AppSettings> {
  if (global.__cachedAppSettings) {
    return global.__cachedAppSettings;
  }

  const supabase = getSupabaseServerClient();

  // Step 1: Check Supabase table
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'app_settings')
        .maybeSingle();

      if (!error && data) {
        const loaded: AppSettings = {
          typefullyApiKeys: Array.isArray(data.typefully_api_keys)
            ? data.typefully_api_keys
            : (data.typefully_api_keys ? [data.typefully_api_keys] : []),
          bufferAccessTokens: Array.isArray(data.buffer_access_tokens)
            ? data.buffer_access_tokens
            : (data.buffer_access_tokens ? [data.buffer_access_tokens] : []),
          founderPasskey: data.founder_passkey,
          marketerPasskey: data.marketer_passkey,
          dashboardPasskey: data.dashboard_passkey,
          updatedAt: data.updated_at,
        };
        global.__cachedAppSettings = loaded;
        return loaded;
      }
    } catch {
      // Table doesn't exist yet, proceed to Supabase storage
    }

    // Step 2: Check Supabase Storage
    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('media')
        .download(SETTINGS_STORAGE_PATH);

      if (!fileError && fileData) {
        const text = await fileData.text();
        const parsed = JSON.parse(text);
        if (parsed && (parsed.typefullyApiKeys || parsed.bufferAccessTokens)) {
          global.__cachedAppSettings = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Step 3: Check local disk storage
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed) {
        global.__cachedAppSettings = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // Step 4: Bootstrap from environment variables
  const initialTypefully = (process.env.TYPEFULLY_API_KEYS || process.env.TYPEFULLY_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const initialBuffer = (process.env.BUFFER_ACCESS_TOKENS || process.env.BUFFER_ACCESS_TOKEN || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const initialSettings: AppSettings = {
    typefullyApiKeys: initialTypefully.length > 0 ? initialTypefully : [],
    bufferAccessTokens: initialBuffer.length > 0 ? initialBuffer : [],
    founderPasskey: process.env.FOUNDER_PASSKEY || 'founder@hub2026',
    marketerPasskey: process.env.MARKETER_PASSKEY || 'marketer@hub2026',
    dashboardPasskey: process.env.DASHBOARD_PASSKEY || 'marketer@hub2026',
    updatedAt: new Date().toISOString(),
  };

  global.__cachedAppSettings = initialSettings;

  // Persist the bootstrapped settings to Supabase asynchronously so it lives in DB
  if (supabase && isSupabaseConfigured() && (initialTypefully.length > 0 || initialBuffer.length > 0)) {
    saveAppSettings(initialSettings).catch(() => {});
  }

  return initialSettings;
}

/**
 * Persists App Settings directly to Supabase Database & Storage
 */
export async function saveAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();

  const merged: AppSettings = {
    ...current,
    ...newSettings,
    typefullyApiKeys: (newSettings.typefullyApiKeys ?? current.typefullyApiKeys)
      .map((k) => k.trim())
      .filter(Boolean),
    bufferAccessTokens: (newSettings.bufferAccessTokens ?? current.bufferAccessTokens)
      .map((t) => t.trim())
      .filter(Boolean),
    updatedAt: new Date().toISOString(),
  };

  global.__cachedAppSettings = merged;

  // 1. Save to Supabase Storage in 'media' bucket
  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.storage
        .from('media')
        .upload(SETTINGS_STORAGE_PATH, Buffer.from(JSON.stringify(merged, null, 2)), {
          contentType: 'application/json',
          upsert: true,
        });
    } catch (err) {
      console.warn('Failed to upload settings to Supabase storage:', err);
    }

    // 2. Try saving to 'app_settings' table if created
    try {
      await supabase
        .from('app_settings')
        .upsert({
          id: 'app_settings',
          typefully_api_keys: merged.typefullyApiKeys,
          buffer_access_tokens: merged.bufferAccessTokens,
          founder_passkey: merged.founderPasskey,
          marketer_passkey: merged.marketerPasskey,
          dashboard_passkey: merged.dashboardPasskey,
          updated_at: merged.updatedAt,
        });
    } catch {
      // Table doesn't exist yet, stored in Supabase storage successfully
    }
  }

  // 3. Save to local disk backup
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch {
    // Ignore in read-only environment
  }

  return merged;
}

export async function getTypefullyKeys(): Promise<string[]> {
  const settings = await getAppSettings();
  return settings.typefullyApiKeys || [];
}

export async function getBufferTokens(): Promise<string[]> {
  const settings = await getAppSettings();
  return settings.bufferAccessTokens || [];
}
