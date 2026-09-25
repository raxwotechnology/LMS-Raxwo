import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Class from '@/lib/models/Class';
import Subject from '@/lib/models/Subject';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted');

    const query = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };

    const classes = await Class.find(query)
      .populate('subjectId', 'name description image')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { subjectId, teacherId, date, time } = body;

    if (!subjectId || !teacherId || !date || !time) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields'
      }, { status: 400 });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json({
        success: false,
        message: 'Subject not found'
      }, { status: 404 });
    }

    const newClass = await Class.create({
      subjectId,
      teacherId,
      date,
      time
    });

    await newClass.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
