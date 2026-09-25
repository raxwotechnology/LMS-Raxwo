import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Employee from '@/lib/models/Employee';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const employees = await Employee.find().select('-password');

    return NextResponse.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role, basicSalary } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields'
      }, { status: 400 });
    }

    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return NextResponse.json({
        success: false,
        message: 'Employee already exists with this email'
      }, { status: 400 });
    }

    const employee = await Employee.create({
      name,
      email,
      password,
      role,
      basicSalary: basicSalary || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
