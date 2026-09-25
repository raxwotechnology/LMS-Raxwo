import { NextResponse } from 'next/server';

/**
 * Placeholder login route handler for student authentication.
 * Ready for database and JWT integration.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password, rememberMe } = body;

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email/student ID and password.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // TODO: BACKEND INTEGRATION PLACEHOLDER
    // -------------------------------------------------------------------------
    // 1. Connect to database:
    //    await connectDB();
    //
    // 2. Find student by email or studentId:
    //    const student = await Student.findOne({
    //      $or: [
    //        { email: identifier.toLowerCase().trim() },
    //        { studentId: identifier.trim() }
    //      ]
    //    }).select('+password');
    //
    //    if (!student) {
    //      return NextResponse.json(
    //        { success: false, message: 'Invalid student credentials.' },
    //        { status: 401 }
    //      );
    //    }
    //
    // 3. Compare password with bcrypt:
    //    const isMatch = await bcrypt.compare(password, student.password);
    //    if (!isMatch) {
    //      return NextResponse.json(
    //        { success: false, message: 'Invalid student credentials.' },
    //        { status: 401 }
    //      );
    //    }
    //
    // 4. Generate JWT token and set HTTP-only cookie:
    //    const token = generateToken({ id: student._id, role: 'student' });
    //    cookies().set('student_auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    // =========================================================================

    // Simulate realistic server processing delay (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const studentName = identifier.includes('@')
      ? identifier.split('@')[0].charAt(0).toUpperCase() + identifier.split('@')[0].slice(1)
      : identifier;

    // Set student_token cookie so student route protection recognizes the session
    const response = NextResponse.json({
      success: true,
      message: 'Sign in successful! Redirecting to courses...',
      user: {
        id: 'std_mock_001',
        name: studentName,
        email: identifier.includes('@') ? identifier : `${identifier}@wisdom.lk`,
        role: 'student',
        rememberMe: !!rememberMe,
      },
    });

    response.cookies.set('student_token', 'active_student_session', {
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
