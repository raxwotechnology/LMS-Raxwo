import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';

export async function GET(request, { params }) {
  try {
    const { classId, studentId } = await params;
    await connectDB();

    const attempt = await Attempt.findOne({
      classId,
      studentId,
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      attempted: !!attempt,
      isActive: !!attempt,
      data: attempt
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
