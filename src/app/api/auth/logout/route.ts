import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('social_hub_session');
  response.cookies.delete('social_hub_role');
  return response;
}
