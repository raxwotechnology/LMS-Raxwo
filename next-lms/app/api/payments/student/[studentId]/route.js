import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Payment from '@/lib/models/Payment';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { studentId } = await params;
    await connectDB();

    const payments = await Payment.find({ studentId })
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1 });

    return NextResponse.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
