import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import { sendPaymentSMS } from '../services/smsService.js';

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const {
      studentId,
      studentIdNumber,
      subjects,
      totalAmount,
      month,
      paymentMethod,
      paymentDate,
      paymentType,
      admissionFee,
      monthlyFee,
      paymentStatus,
      notes
    } = req.body;

    // Validation
    if (!studentId || !studentIdNumber || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and at least one subject are required'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be greater than 0'
      });
    }

    if (!month || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Month, payment method, and payment date are required'
      });
    }

    // Verify student exists and get mobile number
    const student = await Student.findById(studentId).select('name email studentId mobile admissionFee monthlyClassFee');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify all subjects exist
    const subjectsExist = await Subject.find({ _id: { $in: subjects } });
    if (subjectsExist.length !== subjects.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more subjects not found'
      });
    }

    const admFee = admissionFee !== undefined ? Number(admissionFee) : 0;
    const monFee = monthlyFee !== undefined ? Number(monthlyFee) : (admFee > 0 ? (totalAmount - admFee) : totalAmount);
    let resolvedType = paymentType;
    if (!resolvedType) {
      if (admFee > 0 && monFee > 0) resolvedType = 'Admission & Monthly Fee';
      else if (admFee > 0) resolvedType = 'Admission Fee';
      else resolvedType = 'Monthly Fee';
    }

    // Create payment
    const payment = await Payment.create({
      studentId,
      studentIdNumber,
      subjects,
      totalAmount,
      admissionFee: admFee,
      monthlyFee: monFee,
      paymentType: resolvedType,
      paymentStatus: paymentStatus || 'Paid',
      month,
      paymentMethod,
      paymentDate,
      notes: notes || '',
      createdBy: req.user?._id || null
    });

    // Populate the payment with student and subject details
    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email studentId mobile admissionFee monthlyClassFee')
      .populate('subjects', 'name price');

    // Send SMS notification
    try {
      console.log('Sending payment SMS to student:', student.name, 'Mobile:', student.mobile);
      const smsResult = await sendPaymentSMS(student, populatedPayment);
      console.log('Payment SMS result:', smsResult);
    } catch (smsError) {
      // Log SMS error but don't fail the request
      console.error('Failed to send SMS notification:', smsError);
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record payment'
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    // Get month filter from query parameters
    const { month } = req.query;
    let query = {};

    // Parse month filter - use regex to match if the selected month is included in comma-separated month strings
    if (month) {
      const trimmedMonth = month.trim();
      const escapedMonth = trimmedMonth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.month = { $regex: new RegExp(`(^|,\\s*)${escapedMonth}(\\s*,|$)`, 'i') };
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email studentId admissionFee monthlyClassFee totalFee grade')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payments'
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment'
    });
  }
};

// @desc    Get payments by student ID, email, or _id
// @route   GET /api/payments/student/:studentId
// @access  Public
export const getPaymentsByStudent = async (req, res) => {
  console.log('>>> HIT getPaymentsByStudent with param:', req.params.studentId);
  try {
    const rawId = req.params.studentId;
    if (!rawId) {
      return res.status(400).json({
        success: false,
        message: 'Student identifier is required'
      });
    }

    const clean = rawId.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(clean);

    // Find all matching students (by ID, email, or _id)
    const matchingStudents = await Student.find({
      $or: [
        { studentId: { $regex: `^${clean}$`, $options: 'i' } },
        { email: clean.toLowerCase() },
        ...(isObjectId ? [{ _id: clean }] : [])
      ]
    });

    const studentIds = matchingStudents.map((s) => s._id);
    if (isObjectId && !studentIds.some((id) => id.toString() === clean)) {
      studentIds.push(new mongoose.Types.ObjectId(clean));
    }

    const orFilters = [
      { studentIdNumber: { $regex: `^${clean}$`, $options: 'i' } }
    ];
    if (studentIds.length > 0) {
      orFilters.push({ studentId: { $in: studentIds } });
    }

    console.log('[getPaymentsByStudent] studentIds:', studentIds, 'orFilters:', JSON.stringify(orFilters));

    const payments = await Payment.find({ $or: orFilters })
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1 });

    console.log('[getPaymentsByStudent] Found:', payments.length);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student payments'
    });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res) => {
  try {
    const { subjects, totalAmount, month, paymentMethod, paymentDate, paymentType, admissionFee, monthlyFee, paymentStatus } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update fields if provided
    if (subjects) payment.subjects = subjects;
    if (totalAmount !== undefined) payment.totalAmount = totalAmount;
    if (admissionFee !== undefined) payment.admissionFee = admissionFee;
    if (monthlyFee !== undefined) payment.monthlyFee = monthlyFee;
    if (paymentType) payment.paymentType = paymentType;
    if (paymentStatus) payment.paymentStatus = paymentStatus;
    if (month) payment.month = month;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (paymentDate) payment.paymentDate = paymentDate;

    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email studentId admissionFee monthlyClassFee totalFee grade')
      .populate('subjects', 'name price');

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment'
    });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment'
    });
  }
};

