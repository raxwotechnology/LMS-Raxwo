import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    await connectDB();

    const query = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    const stats = {
      total: await Attempt.countDocuments(query),
      active: await Attempt.countDocuments({ ...query, status: 'active' }),
      left: await Attempt.countDocuments({ ...query, status: 'left' })
    };

    return NextResponse.json({
      success: true,
      count: attempts.length,
      stats,
      data: attempts
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
