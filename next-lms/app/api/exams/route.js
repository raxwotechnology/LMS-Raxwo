import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Exam from '@/lib/models/Exam';
import Student from '@/lib/models/Student';
import Subject from '@/lib/models/Subject';

export async function GET() {
  try {
    await connectDB();
    const exams = await Exam.find()
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      studentId,
      studentIdNumber,
      title,
      firstName,
      lastName,
      otherNames,
      familyName,
      email,
      dateOfBirth,
      birthDay,
      birthMonth,
      birthYear,
      gender,
      telephone,
      mobile,
      specialNeeds,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      guardianMobile,
      ukVisa,
      exams,
      candidateIdNumber,
      examDate
    } = body;

    if (!studentId || !studentIdNumber || !firstName || !lastName || !exams || !Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields including first name, last name, and at least one exam'
      }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const processedExams = [];
    for (const examItem of exams) {
      if (!examItem.subjectId) {
        return NextResponse.json({
          success: false,
          message: 'Each exam must have a subjectId'
        }, { status: 400 });
      }

      const subject = await Subject.findById(examItem.subjectId);
      if (!subject) {
        return NextResponse.json({
          success: false,
          message: `Subject with ID ${examItem.subjectId} not found`
        }, { status: 404 });
      }

      processedExams.push({
        subjectId: subject._id,
        subjectName: subject.name
      });
    }

    const existingExam = await Exam.findOne({
      $or: [
        { studentId: studentId },
        { studentIdNumber: studentIdNumber ? studentIdNumber.trim() : undefined }
      ]
    });

    if (existingExam) {
      await existingExam.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
      await existingExam.populate('exams.subjectId', 'name');

      return NextResponse.json({
        success: false,
        message: 'Exam record already exists for this student',
        data: existingExam,
        exists: true
      }, { status: 400 });
    }

    const examRecord = await Exam.create({
      studentId,
      studentIdNumber: studentIdNumber ? studentIdNumber.trim() : undefined,
      title: title ? title.trim() : undefined,
      firstName: firstName ? firstName.trim() : undefined,
      lastName: lastName ? lastName.trim() : undefined,
      otherNames: otherNames ? otherNames.trim() : undefined,
      familyName: familyName ? familyName.trim() : undefined,
      email: email ? email.trim() : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      birthDay: birthDay ? birthDay.trim() : undefined,
      birthMonth: birthMonth ? birthMonth.trim() : undefined,
      birthYear: birthYear ? birthYear.trim() : undefined,
      gender: gender ? gender.trim() : undefined,
      telephone: telephone ? telephone.trim() : undefined,
      mobile: mobile ? mobile.trim() : undefined,
      specialNeeds: specialNeeds ? specialNeeds.trim() : undefined,
      specialNeedsDetails: specialNeedsDetails ? specialNeedsDetails.trim() : undefined,
      guardianFirstName: guardianFirstName ? guardianFirstName.trim() : undefined,
      guardianLastName: guardianLastName ? guardianLastName.trim() : undefined,
      guardianTelephone: guardianTelephone ? guardianTelephone.trim() : undefined,
      guardianMobile: guardianMobile ? guardianMobile.trim() : undefined,
      ukVisa: ukVisa ? ukVisa.trim() : undefined,
      exams: processedExams,
      candidateIdNumber: candidateIdNumber ? candidateIdNumber.trim() : undefined,
      examDate: examDate ? new Date(examDate) : undefined
    });

    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Exam record created successfully',
      data: examRecord
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
