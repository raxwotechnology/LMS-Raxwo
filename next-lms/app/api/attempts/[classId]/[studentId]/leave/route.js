import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';
import Class from '@/lib/models/Class';

export async function PUT(request, { params }) {
  try {
    const { classId, studentId } = await params;
    await connectDB();

    const attempt = await Attempt.findOne({
      classId,
      studentId,
      status: 'active'
    });

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'Active attempt not found' }, { status: 404 });
    }

    const classInstance = await Class.findById(classId);
    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    attempt.status = 'left';
    attempt.leftAt = new Date();

    if (classInstance.status === 'completed') {
      attempt.attendance = 'absent';
      attempt.attendanceMarkedAt = new Date();
    }

    await attempt.save();

    return NextResponse.json({
      success: true,
      message: classInstance.status === 'completed' 
        ? 'Left class successfully. Your attendance has been marked as absent.'
        : 'Left class successfully. You can rejoin if the class is still ongoing.',
      data: attempt
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
