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

    if (classInstance.isDeleted) {
      return NextResponse.json({ success: false, message: 'Cannot start a deleted class' }, { status: 400 });
    }

    if (classInstance.status === 'ongoing') {
      return NextResponse.json({ success: false, message: 'Class is already started' }, { status: 400 });
    }

    if (classInstance.status === 'completed' || classInstance.status === 'cancelled') {
      return NextResponse.json({ success: false, message: 'Cannot start a completed or cancelled class' }, { status: 400 });
    }

    classInstance.status = 'ongoing';
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Class started successfully',
      data: classInstance
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
