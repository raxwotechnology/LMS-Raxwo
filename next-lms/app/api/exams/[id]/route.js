import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Exam from '@/lib/models/Exam';
import Subject from '@/lib/models/Subject';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const exam = await Exam.findById(id)
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name');

    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const {
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

    let examRecord = await Exam.findById(id);
    if (!examRecord) {
      return NextResponse.json({ success: false, message: 'Exam record not found' }, { status: 404 });
    }

    if (title !== undefined) examRecord.title = title ? title.trim() : undefined;
    if (firstName !== undefined) {
      if (!firstName || !firstName.trim()) {
        return NextResponse.json({ success: false, message: 'First Name is required' }, { status: 400 });
      }
      examRecord.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (!lastName || !lastName.trim()) {
        return NextResponse.json({ success: false, message: 'Last Name is required' }, { status: 400 });
      }
      examRecord.lastName = lastName.trim();
    }
    if (otherNames !== undefined) examRecord.otherNames = otherNames ? otherNames.trim() : undefined;
    if (familyName !== undefined) examRecord.familyName = familyName ? familyName.trim() : undefined;
    if (email !== undefined) examRecord.email = email ? email.trim() : undefined;
    if (dateOfBirth !== undefined) examRecord.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (birthDay !== undefined) examRecord.birthDay = birthDay ? birthDay.trim() : undefined;
    if (birthMonth !== undefined) examRecord.birthMonth = birthMonth ? birthMonth.trim() : undefined;
    if (birthYear !== undefined) examRecord.birthYear = birthYear ? birthYear.trim() : undefined;
    if (gender !== undefined) examRecord.gender = gender ? gender.trim() : undefined;
    if (telephone !== undefined) examRecord.telephone = telephone ? telephone.trim() : undefined;
    if (mobile !== undefined) examRecord.mobile = mobile ? mobile.trim() : undefined;
    if (specialNeeds !== undefined) examRecord.specialNeeds = specialNeeds ? specialNeeds.trim() : undefined;
    if (specialNeedsDetails !== undefined) examRecord.specialNeedsDetails = specialNeedsDetails ? specialNeedsDetails.trim() : undefined;
    if (guardianFirstName !== undefined) examRecord.guardianFirstName = guardianFirstName ? guardianFirstName.trim() : undefined;
    if (guardianLastName !== undefined) examRecord.guardianLastName = guardianLastName ? guardianLastName.trim() : undefined;
    if (guardianTelephone !== undefined) examRecord.guardianTelephone = guardianTelephone ? guardianTelephone.trim() : undefined;
    if (guardianMobile !== undefined) examRecord.guardianMobile = guardianMobile ? guardianMobile.trim() : undefined;
    if (ukVisa !== undefined) examRecord.ukVisa = ukVisa ? ukVisa.trim() : undefined;
    if (candidateIdNumber !== undefined) examRecord.candidateIdNumber = candidateIdNumber ? candidateIdNumber.trim() : undefined;
    if (examDate !== undefined) examRecord.examDate = examDate ? new Date(examDate) : null;

    if (exams !== undefined && Array.isArray(exams)) {
      if (exams.length === 0) {
        return NextResponse.json({ success: false, message: 'At least one exam must be selected' }, { status: 400 });
      }

      const processedExams = [];
      for (const examItem of exams) {
        if (!examItem.subjectId) {
          return NextResponse.json({ success: false, message: 'Each exam must have a subjectId' }, { status: 400 });
        }

        const subject = await Subject.findById(examItem.subjectId);
        if (!subject) {
          return NextResponse.json({ success: false, message: `Subject with ID ${examItem.subjectId} not found` }, { status: 404 });
        }

        processedExams.push({
          subjectId: subject._id,
          subjectName: subject.name
        });
      }

      examRecord.exams = processedExams;
    }

    examRecord.updatedAt = Date.now();
    await examRecord.save();

    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Exam record updated successfully',
      data: examRecord
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
    const exam = await Exam.findById(id);

    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam record not found' }, { status: 404 });
    }

    await exam.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Exam record deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
