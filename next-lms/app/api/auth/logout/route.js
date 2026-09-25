import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully.',
  });

  // Clear student session cookie
  response.cookies.set('student_token', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
