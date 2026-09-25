import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Class from '@/lib/models/Class';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const classInstance = await Class.findById(id)
      .populate('subjectId', 'name description image')
      .populate('teacherId', 'name email');

    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: classInstance });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { date, time, status } = body;

    let classInstance = await Class.findById(id);
    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    if (date) classInstance.date = date;
    if (time) classInstance.time = time;
    if (status) classInstance.status = status;

    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
      data: classInstance
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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
      return NextResponse.json({ success: false, message: 'Class is already deleted' }, { status: 400 });
    }

    classInstance.isDeleted = true;
    classInstance.deletedAt = new Date();
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully. It will still appear in "View My Classes" until removed.',
      data: classInstance
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
