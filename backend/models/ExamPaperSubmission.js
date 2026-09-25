import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionText: { type: String, trim: true },
  questionType: { type: String, trim: true },
  totalMarks: { type: Number, default: 0 },
  studentAnswer: { type: String, trim: true, default: '' },
  correctAnswer: { type: String, trim: true, default: '' },
  isCorrect: { type: Boolean, default: false },
  earnedMarks: { type: Number, default: 0 }
});

const examPaperSubmissionSchema = new mongoose.Schema({
  examPaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamPaper',
    required: true
  },
  paperTitle: { type: String, trim: true },
  subject: { type: String, trim: true },
  grade: { type: String, trim: true },
  examType: { type: String, trim: true },
  teacherName: { type: String, trim: true },

  studentId: { type: String, required: true, trim: true },
  studentName: { type: String, trim: true },
  studentEmail: { type: String, trim: true },

  answers: [answerSchema],

  totalMarks: { type: Number, default: 0 },        // max possible
  earnedMarks: { type: Number, default: 0 },        // student earned
  autoGradedMarks: { type: Number, default: 0 },    // marks from MCQ/TF only
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  passMark: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['Submitted', 'Graded'],
    default: 'Submitted'
  },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

examPaperSubmissionSchema.index({ examPaperId: 1, studentId: 1 });
examPaperSubmissionSchema.index({ studentId: 1 });

const ExamPaperSubmission = mongoose.model('ExamPaperSubmission', examPaperSubmissionSchema);
export default ExamPaperSubmission;
