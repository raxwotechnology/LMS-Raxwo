import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields'
      }, { status: 400 });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return NextResponse.json({
        success: false,
        message: 'Admin already exists with this email'
      }, { status: 400 });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password
    });

    return NextResponse.json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Server error'
    }, { status: 500 });
  }
}
