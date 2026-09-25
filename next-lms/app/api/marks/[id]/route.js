import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Marks from '@/lib/models/Marks';
import Subject from '@/lib/models/Subject';
import Employee from '@/lib/models/Employee';

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { subjects } = body;

    let marksRecord = await Marks.findById(id);
    if (!marksRecord) {
      return NextResponse.json({ success: false, message: 'Marks record not found' }, { status: 404 });
    }

    if (subjects && Array.isArray(subjects)) {
      const processedSubjects = [];
      for (const subject of subjects) {
        if (!subject.subjectId || subject.marks === undefined || !subject.grade) {
          return NextResponse.json({
            success: false,
            message: 'Each subject must have subjectId, marks, and grade'
          }, { status: 400 });
        }

        if (subject.marks < 0 || subject.marks > 100) {
          return NextResponse.json({
            success: false,
            message: 'Marks must be between 0 and 100'
          }, { status: 400 });
        }

        let subjectId = subject.subjectId;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(subjectId);

        if (!isValidObjectId) {
          let subjectDoc = await Subject.findOne({ name: subjectId });
          if (!subjectDoc) {
            const anyEmployee = await Employee.findOne();
            if (!anyEmployee) {
              return NextResponse.json({
                success: false,
                message: 'Cannot create test subjects. No employees found.'
              }, { status: 400 });
            }

            subjectDoc = await Subject.create({
              name: subjectId,
              description: `Temporary test subject: ${subjectId}`,
              image: '/uploads/default-subject.png',
              conductedBy: anyEmployee._id,
              status: 'active'
            });
          }
          subjectId = subjectDoc._id;
        } else {
          const subjectExists = await Subject.findById(subjectId);
          if (!subjectExists) {
            return NextResponse.json({
              success: false,
              message: `Subject with ID ${subjectId} not found`
            }, { status: 404 });
          }
        }

        processedSubjects.push({
          subjectId,
          marks: subject.marks,
          grade: subject.grade
        });
      }

      marksRecord.subjects = processedSubjects;
    }

    await marksRecord.save();
    await marksRecord.populate('studentId', 'name studentId email');
    await marksRecord.populate('subjects.subjectId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Marks updated successfully',
      data: marksRecord
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
    const marksRecord = await Marks.findById(id);

    if (!marksRecord) {
      return NextResponse.json({ success: false, message: 'Marks record not found' }, { status: 404 });
    }

    await marksRecord.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Marks deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
