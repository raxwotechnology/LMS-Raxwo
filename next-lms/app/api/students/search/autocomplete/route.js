import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    await connectDB();
    const searchTerm = query.trim().toLowerCase();

    const students = await Student.find({
      $or: [
        { studentId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name studentId email')
    .limit(10)
    .sort({ studentId: 1 });

    const suggestions = students.map(student => ({
      _id: student._id,
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      displayText: `${student.name} (ID: ${student.studentId})`
    }));

    return NextResponse.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
