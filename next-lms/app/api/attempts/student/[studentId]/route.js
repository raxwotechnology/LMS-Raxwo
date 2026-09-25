import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';

export async function GET(request, { params }) {
  try {
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    await connectDB();

    const query = { studentId };
    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: attempts.length,
      activeCount: await Attempt.countDocuments({ studentId, status: 'active' }),
      leftCount: await Attempt.countDocuments({ studentId, status: 'left' }),
      totalCount: await Attempt.countDocuments({ studentId }),
      data: attempts
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
