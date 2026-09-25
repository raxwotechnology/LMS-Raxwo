import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';
import Class from '@/lib/models/Class';
import Student from '@/lib/models/Student';
import { sendClassAttemptSMS } from '@/lib/smsService';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { classId, studentId } = body;

    if (!classId || !studentId || !studentId.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Please provide class ID and student ID or name'
      }, { status: 400 });
    }

    const searchValue = studentId.trim();

    const classInstance = await Class.findById(classId).populate('subjectId', 'name');
    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    let student = await Student.findOne({ studentId: searchValue }).select('name email studentId mobile firstName lastName');

    if (!student) {
      const enteredName = searchValue.toLowerCase();
      const allStudents = await Student.find().select('name email studentId mobile firstName lastName');

      student = allStudents.find(s => {
        const studentNameLower = (s.name || '').trim().toLowerCase();
        const nameParts = studentNameLower.split(/\s+/).filter(part => part.length > 0);
        const firstName = nameParts.length > 0 ? nameParts[0] : '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const fullName = studentNameLower;

        const matchesFirstName = firstName && enteredName === firstName;
        const matchesLastName = lastName && enteredName === lastName;
        const matchesFullName = enteredName === fullName;

        const enteredParts = enteredName.split(/\s+/).filter(part => part.length > 0);
        const matchesReversed = enteredParts.length === nameParts.length && 
          enteredParts.length === 2 &&
          enteredParts[0] === nameParts[1] && 
          enteredParts[1] === nameParts[0];

        return matchesFirstName || matchesLastName || matchesFullName || matchesReversed;
      });
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found. Please check that your Student ID or Name is registered in the system.'
      }, { status: 404 });
    }

    if (classInstance.isDeleted) {
      return NextResponse.json({ success: false, message: 'This class has been deleted' }, { status: 400 });
    }

    const existingAttempt = await Attempt.findOne({ 
      classId: classId, 
      studentId: student.studentId,
      status: 'active'
    });

    if (existingAttempt) {
      return NextResponse.json({
        success: false,
        message: 'You have already attempted this class'
      }, { status: 400 });
    }

    const leftAttempt = await Attempt.findOne({
      classId: classId,
      studentId: student.studentId,
      status: 'left'
    });

    if (leftAttempt && classInstance.status === 'completed') {
      return NextResponse.json({
        success: false,
        message: 'You cannot rejoin this class as it has been closed and your attendance has been recorded'
      }, { status: 400 });
    }

    let attempt;
    if (leftAttempt) {
      leftAttempt.status = 'active';
      leftAttempt.leftAt = null;
      leftAttempt.studentName = student.name;
      leftAttempt.studentEmail = student.email;
      await leftAttempt.save();
      attempt = leftAttempt;
    } else {
      attempt = await Attempt.create({
        classId,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email,
        status: 'active'
      });

      try {
        await sendClassAttemptSMS(student, classInstance);
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Class attempted successfully',
      data: attempt
    }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'You have already attempted this class' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
