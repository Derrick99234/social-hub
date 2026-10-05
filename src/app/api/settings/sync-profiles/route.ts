import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SocialProfile } from '@/types';

export async function POST(request: NextRequest) {
  // Allow passing keys directly in request body or reading from env
  const body = await request.json().catch(() => ({}));

  let typefullyKeys: string[] = [];
  if (Array.isArray(body.typefullyApiKeys)) {
    typefullyKeys = body.typefullyApiKeys.map((k: string) => k.trim()).filter(Boolean);
  } else if (process.env.TYPEFULLY_API_KEYS) {
    typefullyKeys = process.env.TYPEFULLY_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
  } else if (process.env.TYPEFULLY_API_KEY) {
    typefullyKeys = [process.env.TYPEFULLY_API_KEY.trim()];
  }

  let bufferTokens: string[] = [];
  if (Array.isArray(body.bufferAccessTokens)) {
    bufferTokens = body.bufferAccessTokens.map((t: string) => t.trim()).filter(Boolean);
  } else if (process.env.BUFFER_ACCESS_TOKENS) {
    bufferTokens = process.env.BUFFER_ACCESS_TOKENS.split(',').map((t) => t.trim()).filter(Boolean);
  } else if (process.env.BUFFER_ACCESS_TOKEN) {
    bufferTokens = [process.env.BUFFER_ACCESS_TOKEN.trim()];
  }

  const discoveredProfiles: SocialProfile[] = [];
  let detectedLinkedinId = '';
  let detectedInstagramId = '';
  let detectedTypefullySocialSetId = '';
  let typefullyUser = null;
  let bufferUser = null;

  // 1. Fetch from Typefully v2 across all provided keys
  for (const key of typefullyKeys) {
    if (!key || key.includes('your_')) continue;

    try {
      const tfRes = await fetch('https://api.typefully.com/v2/social-sets', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (tfRes.ok) {
        const tfData = await tfRes.json();
        if (tfData.results && Array.isArray(tfData.results)) {
          for (const s of tfData.results) {
            if (!typefullyUser) typefullyUser = s.name || s.username;
            if (!detectedTypefullySocialSetId && s.id) {
              detectedTypefullySocialSetId = String(s.id);
            }

            // X / Twitter
            discoveredProfiles.push({
              id: `tf_twitter_${s.id}`,
              name: s.name || s.username || 'X Account',
              handle: `@${s.username}`,
              network: 'twitter',
              service: 'typefully',
              avatarUrl: s.profile_image_url,
              profileType: 'personal',
              isConnected: true,
            });

            // Threads
            discoveredProfiles.push({
              id: `tf_threads_${s.id}`,
              name: s.name || s.username || 'Threads Account',
              handle: `@${s.username}`,
              network: 'threads',
              service: 'typefully',
              avatarUrl: s.profile_image_url,
              profileType: 'personal',
              isConnected: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Typefully sync error for key:', err);
    }
  }

  // 2. Fetch from Buffer GraphQL API across all provided tokens
  for (const token of bufferTokens) {
    if (!token || token.includes('your_')) continue;

    try {
      // Step A: Get org ID
      const orgRes = await fetch('https://api.buffer.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ account { id email organizations { id name } } }',
        }),
      });

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        const account = orgData.data?.account;
        if (!bufferUser) bufferUser = account?.email;
        const orgId = account?.organizations?.[0]?.id;

        if (orgId) {
          // Step B: Get channels
          const channelsRes = await fetch('https://api.buffer.com/graphql', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `query { channels(input: { organizationId: "${orgId}" }) { id name service serviceId avatar } }`,
            }),
          });

          if (channelsRes.ok) {
            const channelsData = await channelsRes.json();
            const channels = channelsData.data?.channels || [];

            for (const ch of channels) {
              const isInsta = ch.service?.toLowerCase() === 'instagram';
              const network = isInsta ? 'instagram' : 'linkedin';

              if (network === 'linkedin' && !detectedLinkedinId) {
                detectedLinkedinId = ch.id;
              }
              if (network === 'instagram' && !detectedInstagramId) {
                detectedInstagramId = ch.id;
              }

              // Avoid duplicate channel IDs
              if (!discoveredProfiles.some((p) => p.id === ch.id)) {
                discoveredProfiles.push({
                  id: ch.id,
                  name: ch.name || `${ch.service} Account`,
                  handle: `@${ch.name}`,
                  network,
                  service: 'buffer',
                  avatarUrl: ch.avatar,
                  profileType: ch.serviceId?.includes('organization') ? 'page' : 'personal',
                  isConnected: true,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Buffer sync error for token:', err);
    }
  }

  // Save discovered profiles to data cache
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const profilesPath = path.join(dataDir, 'connected_profiles.json');
    fs.writeFileSync(profilesPath, JSON.stringify(discoveredProfiles, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not cache discovered profiles to file:', err);
  }

  // Update .env.local with detected IDs if found and not set
  if (detectedLinkedinId || detectedInstagramId || detectedTypefullySocialSetId) {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');

        if (detectedTypefullySocialSetId && !process.env.TYPEFULLY_SOCIAL_SET_ID) {
          process.env.TYPEFULLY_SOCIAL_SET_ID = detectedTypefullySocialSetId;
          const reg = /^TYPEFULLY_SOCIAL_SET_ID=.*$/m;
          if (reg.test(envContent)) {
            envContent = envContent.replace(reg, `TYPEFULLY_SOCIAL_SET_ID=${detectedTypefullySocialSetId}`);
          } else {
            envContent += `\nTYPEFULLY_SOCIAL_SET_ID=${detectedTypefullySocialSetId}`;
          }
        }

        if (detectedLinkedinId && !process.env.BUFFER_LINKEDIN_PROFILE_ID) {
          process.env.BUFFER_LINKEDIN_PROFILE_ID = detectedLinkedinId;
          const reg = /^BUFFER_LINKEDIN_PROFILE_ID=.*$/m;
          if (reg.test(envContent)) {
            envContent = envContent.replace(reg, `BUFFER_LINKEDIN_PROFILE_ID=${detectedLinkedinId}`);
          } else {
            envContent += `\nBUFFER_LINKEDIN_PROFILE_ID=${detectedLinkedinId}`;
          }
        }

        if (detectedInstagramId && !process.env.BUFFER_INSTAGRAM_PROFILE_ID) {
          process.env.BUFFER_INSTAGRAM_PROFILE_ID = detectedInstagramId;
          const reg = /^BUFFER_INSTAGRAM_PROFILE_ID=.*$/m;
          if (reg.test(envContent)) {
            envContent = envContent.replace(reg, `BUFFER_INSTAGRAM_PROFILE_ID=${detectedInstagramId}`);
          } else {
            envContent += `\nBUFFER_INSTAGRAM_PROFILE_ID=${detectedInstagramId}`;
          }
        }

        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
      }
    } catch (e) {
      console.warn('Could not auto-write detected IDs to .env.local', e);
    }
  }

  return NextResponse.json({
    success: true,
    profiles: discoveredProfiles,
    detectedLinkedinId,
    detectedInstagramId,
    detectedTypefullySocialSetId,
    typefullyUser,
    bufferUser,
    message: `Discovered ${discoveredProfiles.length} live connected profile(s)!`,
  });
}
