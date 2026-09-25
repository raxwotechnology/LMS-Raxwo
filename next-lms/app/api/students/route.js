import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Student from '@/lib/models/Student';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const students = await Student.find()
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      subjects,
      subjectPrices,
      totalPrice,
      hasSpecialNeeds,
      specialNeed,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      paymentType,
      registrationDate
    } = body;

    if (!name || !email || !birthday || !gender || !mobile) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields'
      }, { status: 400 });
    }

    let finalRegistrationDate = undefined;
    if (registrationDate) {
      if (typeof registrationDate === 'string' && registrationDate.trim()) {
        const dateValue = new Date(registrationDate);
        if (isNaN(dateValue.getTime())) {
          return NextResponse.json({
            success: false,
            message: 'Invalid registration date format'
          }, { status: 400 });
        }
        finalRegistrationDate = dateValue;
      } else if (registrationDate instanceof Date) {
        finalRegistrationDate = registrationDate;
      }
    }

    let finalStudentId = studentId;
    if (!finalStudentId || finalStudentId.trim() === '') {
      const existingStudents = await Student.find({
        studentId: { $regex: /^ID\d{4}$/ }
      }).sort({ studentId: -1 }).limit(1);

      let nextNumber = 1;
      if (existingStudents.length > 0) {
        const lastId = existingStudents[0].studentId;
        const lastNumber = parseInt(lastId.replace('ID', ''), 10);
        nextNumber = lastNumber + 1;
      }
      finalStudentId = `ID${String(nextNumber).padStart(4, '0')}`;
    }

    const studentExists = await Student.findOne({ studentId: finalStudentId });
    if (studentExists) {
      return NextResponse.json({
        success: false,
        message: 'Student already exists with this Student ID'
      }, { status: 400 });
    }

    let finalSubjectPrices = [];
    let finalTotalPrice = 0;

    if (subjectPrices && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      finalSubjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      finalTotalPrice = finalSubjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      finalTotalPrice = Number(totalPrice) || 0;
    }

    let student;
    try {
      student = await Student.create({
        name,
        studentId: finalStudentId,
        email,
        birthday,
        gender,
        mobile,
        subjects: subjects || [],
        subjectPrices: finalSubjectPrices,
        hasSpecialNeeds: hasSpecialNeeds || false,
        specialNeed: hasSpecialNeeds ? specialNeed : undefined,
        specialNeedsDetails: hasSpecialNeeds ? specialNeedsDetails : undefined,
        guardianFirstName: hasSpecialNeeds ? guardianFirstName : undefined,
        guardianLastName: hasSpecialNeeds ? guardianLastName : undefined,
        guardianTelephone: hasSpecialNeeds ? guardianTelephone : undefined,
        paymentType: paymentType || undefined,
        totalPrice: finalTotalPrice,
        registrationDate: finalRegistrationDate
      });
    } catch (createError) {
      if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.email) {
        return NextResponse.json({
          success: false,
          message: 'The database still has a unique constraint on email.'
        }, { status: 400 });
      }
      throw createError;
    }

    await student.populate('subjects', 'name price');

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      data: student
    }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json({
        success: false,
        message: field === 'studentId' ? 'This Student ID already exists' : `${field} already exists`
      }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
