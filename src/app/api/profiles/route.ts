import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_PROFILES } from '@/lib/constants/profiles';
import { SocialProfile } from '@/types';

export async function GET() {
  const cachePath = path.join(process.cwd(), 'data', 'connected_profiles.json');

  // 1. If cache file exists and has profiles, return them
  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          profiles: data,
        });
      }
    } catch (e) {
      console.warn('Could not read cached profiles:', e);
    }
  }

  // 2. Fallback to default mock profiles
  return NextResponse.json({
    success: true,
    source: 'defaults',
    profiles: DEFAULT_PROFILES,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profiles: SocialProfile[] = body.profiles;

    if (!Array.isArray(profiles)) {
      return NextResponse.json({ error: 'Profiles must be an array' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const cachePath = path.join(dataDir, 'connected_profiles.json');
    fs.writeFileSync(cachePath, JSON.stringify(profiles, null, 2), 'utf8');

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
