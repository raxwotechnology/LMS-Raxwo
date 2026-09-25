import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Role from '@/lib/models/Role';
import Employee from '@/lib/models/Employee';

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    const employeesWithRole = await Employee.findOne({ role: role.name });
    if (employeesWithRole) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete role that is assigned to employees'
      }, { status: 400 });
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
