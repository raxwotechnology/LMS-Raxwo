import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Subject from '@/lib/models/Subject';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { teacherId } = await params;
    await connectDB();

    const subjects = await Subject.find({ conductedBy: teacherId })
      .populate('conductedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
