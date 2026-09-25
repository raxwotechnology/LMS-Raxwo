import { NextResponse } from 'next/server';

/**
 * Placeholder registration route handler for student sign up.
 * Ready for database insertion and password hashing integration.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, studentId, password } = body;

    // Basic server-side validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required fields.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // TODO: BACKEND INTEGRATION PLACEHOLDER
    // -------------------------------------------------------------------------
    // 1. Connect to database:
    //    await connectDB();
    //
    // 2. Check if student already exists:
    //    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    //    if (existingStudent) {
    //      return NextResponse.json(
    //        { success: false, message: 'An account with this email address already exists.' },
    //        { status: 400 }
    //      );
    //    }
    //
    // 3. Hash password:
    //    const hashedPassword = await bcrypt.hash(password, 10);
    //
    // 4. Create new student document in MongoDB:
    //    const newStudent = await Student.create({
    //      firstName: firstName.trim(),
    //      lastName: lastName.trim(),
    //      name: `${firstName.trim()} ${lastName.trim()}`,
    //      email: email.toLowerCase().trim(),
    //      studentId: studentId ? studentId.trim() : undefined,
    //      password: hashedPassword,
    //      status: 'active'
    //    });
    //
    // 5. Generate token / session cookie if auto-login is desired.
    // =========================================================================

    // Simulate realistic server processing delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock successful response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Welcome to Wisdom Institute.',
        user: {
          id: 'std_' + Math.floor(1000 + Math.random() * 9000),
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase().trim(),
          studentId: studentId || 'Pending assignment',
          role: 'student',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
