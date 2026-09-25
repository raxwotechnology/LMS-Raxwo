import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Employee from '@/lib/models/Employee';

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { permissions } = body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    if (permissions) {
      employee.permissions = permissions;
      await employee.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        permissions: employee.permissions
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
