import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveSocialProfiles } from '@/lib/services/profileSync';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    let typefullyKeys: string[] | undefined;
    if (Array.isArray(body.typefullyApiKeys)) {
      typefullyKeys = body.typefullyApiKeys.map((k: string) => k.trim()).filter(Boolean);
    }

    let bufferTokens: string[] | undefined;
    if (Array.isArray(body.bufferAccessTokens)) {
      bufferTokens = body.bufferAccessTokens.map((t: string) => t.trim()).filter(Boolean);
    }

    const discoveredProfiles = await fetchLiveSocialProfiles({
      typefullyKeys,
      bufferTokens,
    });

    // Also auto-detect primary IDs
    let detectedLinkedinId = '';
    let detectedInstagramId = '';
    let detectedTypefullySocialSetId = '';

    for (const p of discoveredProfiles) {
      if (p.service === 'typefully' && !detectedTypefullySocialSetId) {
        const idMatch = p.id.replace('tf_twitter_', '').replace('tf_threads_', '');
        if (idMatch) detectedTypefullySocialSetId = idMatch;
      }
      if (p.service === 'buffer' && p.network === 'linkedin' && !detectedLinkedinId) {
        detectedLinkedinId = p.id;
      }
      if (p.service === 'buffer' && p.network === 'instagram' && !detectedInstagramId) {
        detectedInstagramId = p.id;
      }
    }

    // Persist discovered IDs into .env.local if present
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
      message: `Discovered ${discoveredProfiles.length} live connected profile(s)!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync profiles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

