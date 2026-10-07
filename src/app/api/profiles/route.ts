import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveSocialProfiles, getCachedProfiles } from '@/lib/services/profileSync';
import { SocialProfile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Return cached profiles if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedProfiles();
      if (cached && cached.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          profiles: cached,
        });
      }
    }

    // 2. Fetch live profiles from Typefully and Buffer APIs
    const liveProfiles = await fetchLiveSocialProfiles();

    return NextResponse.json({
      success: true,
      source: 'live_api',
      profiles: liveProfiles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profiles';
    return NextResponse.json({ error: message, profiles: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profiles: SocialProfile[] = body.profiles;

    if (!Array.isArray(profiles)) {
      return NextResponse.json({ error: 'Profiles must be an array' }, { status: 400 });
    }

    // Store in global memory and sync
    global.__cachedProfiles = profiles;

    return NextResponse.json({
      success: true,
      message: 'Profiles saved successfully',
      profiles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save profiles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

