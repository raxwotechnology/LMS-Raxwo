import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  studentIdNumber: {
    type: String,
    required: [true, 'Student ID number is required'],
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  month: {
    type: String,
    required: [true, 'Payment month is required']
  },
  paymentType: {
    type: String,
    enum: ['Admission Fee', 'Monthly Fee', 'Admission & Monthly Fee', 'Registration Fee'],
    default: 'Monthly Fee'
  },
  admissionFee: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Paid'
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Card', 'Bank Transfer', 'Online'],
    default: 'Cash'
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  }
}, { timestamps: true });

// Index for better query performance
paymentSchema.index({ studentId: 1, month: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

