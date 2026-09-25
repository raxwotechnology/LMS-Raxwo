import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Marks from '@/lib/models/Marks';
import Student from '@/lib/models/Student';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { studentId } = await params;
    await connectDB();

    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found with this Student ID' }, { status: 404 });
    }

    const marksRecord = await Marks.findOne({ studentId: student._id })
      .populate('studentId', 'name studentId email')
      .populate('subjects.subjectId', 'name');

    if (!marksRecord) {
      return NextResponse.json({ success: false, message: 'No marks found for this student' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: marksRecord });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
