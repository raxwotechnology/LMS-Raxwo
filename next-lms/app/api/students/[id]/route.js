import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Student from '@/lib/models/Student';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const student = await Student.findById(id)
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student });
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

    let student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (studentId && studentId !== student.studentId) {
      const studentIdExists = await Student.findOne({ studentId, _id: { $ne: student._id } });
      if (studentIdExists) {
        return NextResponse.json({ success: false, message: 'Student ID already exists' }, { status: 400 });
      }
    }

    if (name) student.name = name;
    if (studentId) student.studentId = studentId;
    if (email) student.email = email;
    if (birthday) student.birthday = birthday;
    if (gender) student.gender = gender;
    if (mobile) student.mobile = mobile;
    if (subjects !== undefined) student.subjects = subjects;

    if (subjectPrices !== undefined && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      student.subjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      student.totalPrice = student.subjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      student.totalPrice = Number(totalPrice);
    }

    if (hasSpecialNeeds !== undefined) student.hasSpecialNeeds = hasSpecialNeeds;
    if (specialNeed !== undefined) student.specialNeed = specialNeed;
    if (specialNeedsDetails !== undefined) student.specialNeedsDetails = specialNeedsDetails;
    if (guardianFirstName !== undefined) student.guardianFirstName = guardianFirstName;
    if (guardianLastName !== undefined) student.guardianLastName = guardianLastName;
    if (guardianTelephone !== undefined) student.guardianTelephone = guardianTelephone;
    if (paymentType) student.paymentType = paymentType;

    if (registrationDate !== undefined && registrationDate !== null && registrationDate !== '') {
      const dateValue = new Date(registrationDate);
      if (!isNaN(dateValue.getTime())) {
        student.registrationDate = dateValue;
      } else {
        return NextResponse.json({ success: false, message: 'Invalid registration date format' }, { status: 400 });
      }
    } else if (registrationDate === null || registrationDate === '') {
      student.registrationDate = undefined;
    }

    await student.save();
    await student.populate('subjects', 'name price');

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
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

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    await student.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
