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
    const { commission, month } = body;

    if (commission === undefined || commission < 0) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid commission amount (>= 0)'
      }, { status: 400 });
    }

    if (!month) {
      return NextResponse.json({
        success: false,
        message: 'Month is required'
      }, { status: 400 });
    }

    const validMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    if (!validMonths.includes(month)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid month. Please provide a valid month name.'
      }, { status: 400 });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    if (!employee.monthlyCommissions) {
      employee.monthlyCommissions = [];
    }

    const existingCommissionIndex = employee.monthlyCommissions.findIndex(
      mc => mc.month === month
    );

    if (existingCommissionIndex !== -1) {
      employee.monthlyCommissions[existingCommissionIndex].amount = commission;
      employee.monthlyCommissions[existingCommissionIndex].createdAt = new Date();
    } else {
      employee.monthlyCommissions.push({
        month,
        amount: commission
      });
    }

    const totalCommission = employee.monthlyCommissions.reduce(
      (sum, mc) => sum + (mc.amount || 0), 0
    );
    employee.commission = totalCommission;

    await employee.save();

    return NextResponse.json({
      success: true,
      message: `Commission for ${month} updated successfully`,
      data: {
        id: employee._id,
        name: employee.name,
        commission: employee.commission,
        monthlyCommissions: employee.monthlyCommissions
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
