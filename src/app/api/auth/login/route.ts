import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passkey, role } = body;

    const configuredPasskey = process.env.DASHBOARD_PASSKEY || 'marketer123';

    // Allow empty during initial dev or if matching configured passkey
    const isValid = passkey && passkey.trim() === configuredPasskey.trim();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Passkey / PIN. Please check your credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      role: role || 'marketer',
    });

    // Set secure cookie
    response.cookies.set('social_hub_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('social_hub_role', role || 'marketer', {
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
