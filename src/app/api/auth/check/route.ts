import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('social_hub_session');
  const role = request.cookies.get('social_hub_role')?.value || 'marketer';

  const isAuthenticated = session?.value === 'authenticated';

  return NextResponse.json({
    authenticated: isAuthenticated,
    role: isAuthenticated ? role : null,
    hasConfiguredPasskey: Boolean(
      process.env.FOUNDER_PASSKEY || process.env.MARKETER_PASSKEY || process.env.DASHBOARD_PASSKEY
    ),
  });
}
