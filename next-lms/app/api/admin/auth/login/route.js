import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import Admin from '@/lib/models/Admin';
import Employee from '@/lib/models/Employee';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Please provide email and password'
      }, { status: 400 });
    }

    let user = null;
    let userType = null;

    // Try to find as admin first
    const admin = await Admin.findOne({ email }).select('+password');

    if (admin) {
      // Check if admin is active
      if (admin.status !== 'active') {
        return NextResponse.json({
          success: false,
          message: 'Your account has been deactivated'
        }, { status: 401 });
      }

      // Check password
      const isPasswordCorrect = await admin.comparePassword(password);
      if (isPasswordCorrect) {
        user = admin;
        userType = 'admin';
      }
    } else {
      // Try to find as employee
      const employee = await Employee.findOne({ email }).select('+password');

      if (employee) {
        // Check if employee is active
        if (employee.status !== 'active') {
          return NextResponse.json({
            success: false,
            message: 'Your account has been deactivated'
          }, { status: 401 });
        }

        // Check password
        const isPasswordCorrect = await employee.comparePassword(password);
        if (isPasswordCorrect) {
          user = employee;
          userType = 'employee';
        }
      }
    }

    if (!user || !userType) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Generate token
    const token = signToken(user._id);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: userType,
          permissions: user.permissions || {}
        },
        token
      }
    }, { status: 200 });

    // Set HTTP-only cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Server error'
    }, { status: 500 });
  }
}
