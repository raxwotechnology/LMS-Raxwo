import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import Student from '@/lib/models/Student';
import Subject from '@/lib/models/Subject';
import { sendPaymentSMS } from '@/lib/smsService';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    await connectDB();
    let query = {};

    if (month) {
      const trimmedMonth = month.trim();
      const escapedMonth = trimmedMonth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.month = { $regex: new RegExp(`(^|,\\s*)${escapedMonth}(\\s*,|$)`, 'i') };
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1 });

    return NextResponse.json({
      success: true,
      count: payments.length,
      data: payments
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
    const { studentId, studentIdNumber, subjects, totalAmount, month, paymentMethod, paymentDate } = body;

    if (!studentId || !studentIdNumber || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Student ID and at least one subject are required'
      }, { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Total amount must be greater than 0'
      }, { status: 400 });
    }

    if (!month || !paymentMethod || !paymentDate) {
      return NextResponse.json({
        success: false,
        message: 'Month, payment method, and payment date are required'
      }, { status: 400 });
    }

    const student = await Student.findById(studentId).select('name email studentId mobile');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const subjectsExist = await Subject.find({ _id: { $in: subjects } });
    if (subjectsExist.length !== subjects.length) {
      return NextResponse.json({ success: false, message: 'One or more subjects not found' }, { status: 400 });
    }

    const payment = await Payment.create({
      studentId,
      studentIdNumber,
      subjects,
      totalAmount,
      month,
      paymentMethod,
      paymentDate,
      createdBy: auth.user?._id || null
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email studentId mobile')
      .populate('subjects', 'name price');

    try {
      await sendPaymentSMS(student, populatedPayment);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
