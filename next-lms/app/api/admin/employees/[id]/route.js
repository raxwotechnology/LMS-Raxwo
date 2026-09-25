import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Employee from '@/lib/models/Employee';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const employee = await Employee.findById(id).select('-password');

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { name, email, password, role, status, basicSalary, commission, monthlyCommissions } = body;

    let employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (status) employee.status = status;
    if (basicSalary !== undefined) employee.basicSalary = basicSalary;
    if (commission !== undefined) employee.commission = commission;
    if (monthlyCommissions !== undefined) {
      employee.monthlyCommissions = monthlyCommissions;
      const totalCommission = monthlyCommissions.reduce(
        (sum, mc) => sum + (mc.amount || 0), 0
      );
      employee.commission = totalCommission;
    }
    if (password) {
      employee.password = password;
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const employee = await Employee.findById(id);

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    await employee.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
