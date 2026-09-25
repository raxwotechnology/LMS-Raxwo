import { NextResponse } from 'next/server';
import { getAuthFromRequest, clearAuthCookie } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);

    if (!auth || !auth.user) {
      return NextResponse.json({
        success: false,
        message: 'Not authorized'
      }, { status: 401 });
    }

    const { user, userType } = auth;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: userType,
          status: user.status,
          permissions: user.permissions || {}
        },
        admin: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Server error'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });

    clearAuthCookie(response);

    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Server error'
    }, { status: 500 });
  }
}
