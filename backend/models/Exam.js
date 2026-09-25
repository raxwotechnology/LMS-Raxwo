import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  studentIdNumber: {
    type: String,
    required: [true, 'Student ID Number is required'],
    trim: true
  },
  studentName: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  examName: {
    type: String,
    required: [true, 'Exam/Test Name is required'],
    trim: true
  },
  examDate: {
    type: Date,
    required: [true, 'Exam Date is required']
  },
  examTime: {
    type: String,
    required: [true, 'Exam Time is required'],
    trim: true
  },
  startTime: {
    type: String,
    trim: true
  },
  endTime: {
    type: String,
    trim: true
  },
  examHall: {
    type: String,
    trim: true
  },
  attendance: {
    type: String,
    enum: ['Attended', 'Present', 'Late', 'Absent', 'Pending'],
    default: 'Attended'
  },
  teacherName: {
    type: String,
    trim: true
  },
  guardianContact: {
    type: String,
    trim: true
  },
  // Legacy fields kept optional for backward compatibility
  title: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  otherNames: {
    type: String,
    trim: true
  },
  familyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  birthDay: {
    type: String,
    trim: true
  },
  birthMonth: {
    type: String,
    trim: true
  },
  birthYear: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  specialNeeds: {
    type: String,
    trim: true
  },
  specialNeedsDetails: {
    type: String,
    trim: true
  },
  guardianFirstName: {
    type: String,
    trim: true
  },
  guardianLastName: {
    type: String,
    trim: true
  },
  guardianTelephone: {
    type: String,
    trim: true
  },
  guardianMobile: {
    type: String,
    trim: true
  },
  ukVisa: {
    type: String,
    required: false,
    trim: true
  },
  exams: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    subjectName: {
      type: String
    }
  }],
  candidateIdNumber: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
examSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Exam = mongoose.model('Exam', examSchema);

export default Exam;

