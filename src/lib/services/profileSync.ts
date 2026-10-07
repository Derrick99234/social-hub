import { SocialProfile } from '@/types';
import { getAppSettings } from './settingsService';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Global cache in server memory
declare global {
  // eslint-disable-next-line no-var
  var __cachedProfiles: SocialProfile[] | undefined;
  // eslint-disable-next-line no-var
  var __channelTokenMap: Record<string, string> | undefined;
}

export async function fetchLiveSocialProfiles(customKeys?: {
  typefullyKeys?: string[];
  bufferTokens?: string[];
}): Promise<SocialProfile[]> {
  const settings = await getAppSettings();

  let typefullyKeys: string[] = [];
  if (customKeys?.typefullyKeys && customKeys.typefullyKeys.length > 0) {
    typefullyKeys = customKeys.typefullyKeys;
  } else if (settings.typefullyApiKeys && settings.typefullyApiKeys.length > 0) {
    typefullyKeys = settings.typefullyApiKeys;
  }

  let bufferTokens: string[] = [];
  if (customKeys?.bufferTokens && customKeys.bufferTokens.length > 0) {
    bufferTokens = customKeys.bufferTokens;
  } else if (settings.bufferAccessTokens && settings.bufferAccessTokens.length > 0) {
    bufferTokens = settings.bufferAccessTokens;
  }

  const discoveredProfiles: SocialProfile[] = [];

  // 1. Fetch from Typefully v2
  for (const key of typefullyKeys) {
    if (!key || key.includes('your_')) continue;

    try {
      const tfRes = await fetch('https://api.typefully.com/v2/social-sets', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
        cache: 'no-store',
      });

      if (tfRes.ok) {
        const tfData = await tfRes.json();
        if (tfData.results && Array.isArray(tfData.results)) {
          for (const s of tfData.results) {
            const rawUsername = s.username ? (s.username.startsWith('@') ? s.username : `@${s.username}`) : '@account';
            const name = s.name || s.username || 'Typefully Account';

            // X / Twitter
            discoveredProfiles.push({
              id: `tf_twitter_${s.id}`,
              name,
              handle: rawUsername,
              network: 'twitter',
              service: 'typefully',
              avatarUrl: s.profile_image_url || undefined,
              profileType: 'personal',
              isConnected: true,
            });

            // Threads
            discoveredProfiles.push({
              id: `tf_threads_${s.id}`,
              name,
              handle: rawUsername,
              network: 'threads',
              service: 'typefully',
              avatarUrl: s.profile_image_url || undefined,
              profileType: 'personal',
              isConnected: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Typefully profile sync error:', err);
    }
  }

  // 2. Fetch from Buffer GraphQL API
  for (const token of bufferTokens) {
    if (!token || token.includes('your_')) continue;

    try {
      // Step A: Get account organizations
      const orgRes = await fetch('https://api.buffer.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ account { id email organizations { id name } } }',
        }),
        cache: 'no-store',
      });

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        const account = orgData.data?.account;
        const orgs = account?.organizations || [];

        for (const org of orgs) {
          if (!org.id) continue;

          // Step B: Get channels for this org
          const channelsRes = await fetch('https://api.buffer.com/graphql', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `query { channels(input: { organizationId: "${org.id}" }) { id name service serviceId avatar } }`,
            }),
            cache: 'no-store',
          });

          if (channelsRes.ok) {
            const channelsData = await channelsRes.json();
            const channels = channelsData.data?.channels || [];

            for (const ch of channels) {
              const srv = ch.service?.toLowerCase();
              let network: 'twitter' | 'threads' | 'linkedin' | 'instagram' | null = null;

              if (srv === 'instagram') {
                network = 'instagram';
              } else if (srv === 'linkedin') {
                network = 'linkedin';
              } else if (srv === 'twitter') {
                network = 'twitter';
              } else if (srv === 'threads') {
                network = 'threads';
              } else {
                continue;
              }

              // Cache token mapping for this channel ID
              if (!global.__channelTokenMap) global.__channelTokenMap = {};
              global.__channelTokenMap[ch.id] = token;

              // Check if already in list
              if (!discoveredProfiles.some((p) => p.id === ch.id)) {
                const isOrg = ch.serviceId?.includes('organization') || ch.serviceId?.includes('page') || ch.name === 'onerepai';
                let displayName = ch.name || `${ch.service} Profile`;
                if (network === 'linkedin') {
                  if (isOrg) {
                    displayName = 'OneRep AI (Company Page)';
                  } else if (ch.name?.includes('olatunbosun')) {
                    displayName = 'Olatunbosun Olashubomi';
                  }
                }

                const handle = ch.name ? (ch.name.startsWith('@') ? ch.name : `@${ch.name}`) : `@${ch.service}`;

                discoveredProfiles.push({
                  id: ch.id,
                  name: displayName,
                  handle,
                  network,
                  service: 'buffer',
                  avatarUrl: ch.avatar || undefined,
                  profileType: isOrg ? 'page' : 'personal',
                  isConnected: true,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Buffer profile sync error:', err);
    }
  }

  // Update memory store
  global.__cachedProfiles = discoveredProfiles;

  // Persist to Supabase Storage in 'media' bucket
  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.storage
        .from('media')
        .upload('config/connected_profiles.json', Buffer.from(JSON.stringify(discoveredProfiles, null, 2)), {
          contentType: 'application/json',
          upsert: true,
        });
    } catch (err) {
      console.warn('Supabase storage profile upload warning:', err);
    }
  }

  // Persist to local JSON if possible
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const profilesPath = path.join(dataDir, 'connected_profiles.json');
    fs.writeFileSync(profilesPath, JSON.stringify(discoveredProfiles, null, 2), 'utf8');
  } catch {
    // Ignore in read-only environment
  }

  return discoveredProfiles;
}

export function getCachedProfiles(): SocialProfile[] | null {
  if (global.__cachedProfiles && global.__cachedProfiles.length > 0) {
    return global.__cachedProfiles;
  }

  try {
    const cachePath = path.join(process.cwd(), 'data', 'connected_profiles.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        global.__cachedProfiles = data;
        return data;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}
