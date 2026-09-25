import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Subject from '@/lib/models/Subject';
import Class from '@/lib/models/Class';

export async function POST(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id: subjectId } = await params;
    const currentUserId = auth.user._id;
    const userType = auth.userType || 'employee';

    await connectDB();
    const subject = await Subject.findById(subjectId).populate('conductedBy', 'name email');

    if (!subject) {
      return NextResponse.json({ success: false, message: 'Subject not found' }, { status: 404 });
    }

    const isAdmin = userType === 'admin';
    const teacherId = subject.conductedBy?._id || subject.conductedBy;
    const isAssignedTeacher = teacherId?.toString() === currentUserId.toString();

    if (!isAdmin && !isAssignedTeacher) {
      return NextResponse.json({
        success: false,
        message: 'You are not authorized to start this class. Only the assigned teacher can start this class.'
      }, { status: 403 });
    }

    const body = await request.json();
    const { date, time } = body;

    if (!date || !time) {
      return NextResponse.json({
        success: false,
        message: 'Date and time are required'
      }, { status: 400 });
    }

    const newClass = await Class.create({
      subjectId,
      teacherId,
      date,
      time,
      status: 'ongoing'
    });

    await newClass.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: `Class "${subject.name}" started successfully and is now live`,
      data: newClass
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
