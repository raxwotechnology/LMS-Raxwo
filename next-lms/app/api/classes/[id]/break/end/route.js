import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Class from '@/lib/models/Class';

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const classInstance = await Class.findById(id);

    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    if (!classInstance.breakStartTime) {
      return NextResponse.json({
        success: false,
        message: 'No active break to end'
      }, { status: 400 });
    }

    const breakEndTime = new Date();
    const breakDuration = breakEndTime - classInstance.breakStartTime;

    classInstance.breakStatus = 'class_starting';

    if (classInstance.breaks && classInstance.breaks.length > 0) {
      const lastBreak = classInstance.breaks[classInstance.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = breakEndTime;
        lastBreak.duration = breakDuration;
        classInstance.totalBreakDuration = (classInstance.totalBreakDuration || 0) + breakDuration;
      }
    }

    classInstance.breakStartTime = null;
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Break ended',
      data: classInstance
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
