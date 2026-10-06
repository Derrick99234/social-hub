import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passkey, role } = body;

    const inputKey = typeof passkey === 'string' ? passkey.trim() : '';

    if (!inputKey) {
      return NextResponse.json(
        { error: 'Please enter your access passkey.' },
        { status: 400 }
      );
    }

    const founderPasskey = (process.env.FOUNDER_PASSKEY || 'founder@hub2026').trim();
    const marketerPasskey = (process.env.MARKETER_PASSKEY || 'marketer@hub2026').trim();
    const legacyPasskey = process.env.DASHBOARD_PASSKEY?.trim();

    let resolvedRole: 'founder' | 'marketer' | null = null;

    if (inputKey === founderPasskey) {
      resolvedRole = 'founder';
    } else if (inputKey === marketerPasskey) {
      resolvedRole = 'marketer';
    } else if (legacyPasskey && inputKey === legacyPasskey) {
      resolvedRole = role === 'founder' ? 'founder' : 'marketer';
    }

    if (!resolvedRole) {
      return NextResponse.json(
        { error: 'Invalid Passkey / PIN. Please check your credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      role: resolvedRole,
    });

    // Set secure cookie
    response.cookies.set('social_hub_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('social_hub_role', resolvedRole, {
      httpOnly: false, // Accessible by client UI for mode switcher
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
