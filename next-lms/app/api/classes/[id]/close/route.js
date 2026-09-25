import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Class from '@/lib/models/Class';
import Attempt from '@/lib/models/Attempt';

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

    if (classInstance.status === 'completed' || classInstance.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'Class is already closed or cancelled'
      }, { status: 400 });
    }

    // Mark all ACTIVE attempts as attended
    const attendedResult = await Attempt.updateMany(
      { 
        classId: id,
        status: 'active'
      },
      { 
        attendance: 'attended',
        attendanceMarkedAt: new Date()
      }
    );

    // Mark all LEFT attempts as absent
    const absentResult = await Attempt.updateMany(
      { 
        classId: id,
        status: 'left'
      },
      { 
        attendance: 'absent',
        attendanceMarkedAt: new Date()
      }
    );

    classInstance.status = 'completed';
    
    if (classInstance.breakStatus === 'on_break' && classInstance.breakStartTime) {
      const breakEndTime = new Date();
      const breakDuration = breakEndTime - classInstance.breakStartTime;

      if (classInstance.breaks && classInstance.breaks.length > 0) {
        const lastBreak = classInstance.breaks[classInstance.breaks.length - 1];
        if (!lastBreak.endTime) {
          lastBreak.endTime = breakEndTime;
          lastBreak.duration = breakDuration;
          classInstance.totalBreakDuration = (classInstance.totalBreakDuration || 0) + breakDuration;
        }
      }
      classInstance.breakStatus = 'none';
      classInstance.breakStartTime = null;
    }

    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Class closed successfully. Attendance marked for active students.',
      data: classInstance,
      attendance: {
        attended: attendedResult.modifiedCount,
        absent: absentResult.modifiedCount,
        message: `${attendedResult.modifiedCount} student(s) marked as attended, ${absentResult.modifiedCount} student(s) marked as absent`
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
