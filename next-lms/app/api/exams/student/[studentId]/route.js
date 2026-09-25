import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Exam from '@/lib/models/Exam';

export async function GET(request, { params }) {
  try {
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const studentIdNumber = searchParams.get('studentIdNumber');

    await connectDB();
    let exam = null;

    if (studentId && studentId !== 'undefined') {
      exam = await Exam.findOne({ studentId })
        .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
        .populate('exams.subjectId', 'name');
    }

    if (!exam && studentIdNumber) {
      exam = await Exam.findOne({ studentIdNumber: studentIdNumber.trim() })
        .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
        .populate('exams.subjectId', 'name');
    }

    if (exam) {
      return NextResponse.json({
        success: true,
        exists: true,
        data: exam
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      data: null
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
