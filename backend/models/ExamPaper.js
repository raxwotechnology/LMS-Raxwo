import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  questionText: { type: String, required: true, trim: true },
  marks: { type: Number, required: true, min: 0 },
  type: {
    type: String,
    enum: ['MCQ', 'Short Answer', 'Essay', 'True/False', 'Fill in the Blank'],
    default: 'Short Answer'
  },
  // For MCQ: store options A, B, C, D
  options: [{ type: String, trim: true }],
  // Optional: correct answer (for MCQ/TF)
  answer: { type: String, trim: true }
});

const examPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam paper title is required'],
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
  grade: {
    type: String,
    trim: true
  },
  examType: {
    type: String,
    trim: true,
    default: '1st Term Test'
  },
  targetStudentType: {
    type: String,
    enum: ['Online', 'Physical', 'Both'],
    default: 'Online'
  },
  date: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  passMark: {
    type: Number,
    default: 0
  },
  instructions: {
    type: String,
    trim: true
  },
  teacherName: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
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

// Auto-calculate totalMarks from questions before save
examPaperSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

const ExamPaper = mongoose.model('ExamPaper', examPaperSchema);
export default ExamPaper;
