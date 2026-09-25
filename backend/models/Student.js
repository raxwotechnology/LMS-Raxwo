import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: false, // Allow duplicate emails for family members (siblings)
    lowercase: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: [true, 'Birthday is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  grade: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: false,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  // 2. Parent / Guardian Details
  guardianName: {
    type: String,
    trim: true
  },
  guardianRelationship: {
    type: String,
    trim: true
  },
  guardianTelephone: {
    type: String,
    trim: true
  },
  guardianEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  guardianAddress: {
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
  // 3. Class Details
  subject: {
    type: String,
    trim: true
  },
  teacherName: {
    type: String,
    trim: true
  },
  classType: {
    type: String,
    enum: ['Physical', 'Online'],
    default: 'Physical'
  },
  classDay: {
    type: String,
    trim: true
  },
  classTime: {
    type: String,
    trim: true
  },
  classLocation: {
    type: String,
    trim: true
  },
  // 4. Login Details (for LMS)
  username: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    select: false
  },
  // 5. Registration Details
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Pending'
  },
  admissionFee: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyClassFee: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFee: {
    type: Number,
    default: 0,
    min: 0
  },
  enrolledSubjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    subjectName: {
      type: String,
      trim: true
    },
    teacherName: {
      type: String,
      trim: true
    },
    classType: {
      type: String,
      enum: ['Physical', 'Online'],
      default: 'Physical'
    },
    classDay: {
      type: String,
      trim: true
    },
    classTime: {
      type: String,
      trim: true
    },
    classLocation: {
      type: String,
      trim: true
    },
    admissionFee: {
      type: Number,
      default: 0
    },
    monthlyClassFee: {
      type: Number,
      default: 0
    },
    totalFee: {
      type: Number,
      default: 0
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    registrationStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Legacy & Compatibility Fields
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  subjectPrices: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  hasSpecialNeeds: {
    type: Boolean,
    default: false
  },
  specialNeed: {
    type: String,
    trim: true
  },
  specialNeedsDetails: {
    type: String,
    trim: true
  },
  paymentType: {
    type: String,
    required: false,
    enum: ['cash', 'card']
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving if modified
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return true; // allow initial login if no password was set yet
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
studentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Student = mongoose.model('Student', studentSchema);

export default Student;

