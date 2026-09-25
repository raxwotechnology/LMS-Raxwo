import ExamPaperSubmission from '../models/ExamPaperSubmission.js';
import ExamPaper from '../models/ExamPaper.js';

// @desc   Submit exam paper answers (student)
// @route  POST /api/exam-submissions
// @access Public
export const submitExamPaper = async (req, res) => {
  try {
    const { examPaperId, studentId, studentName, studentEmail, answers } = req.body;

    if (!examPaperId || !studentId || !answers) {
      return res.status(400).json({ success: false, message: 'examPaperId, studentId, and answers are required' });
    }

    const paper = await ExamPaper.findById(examPaperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Exam paper not found' });
    }

    // Build answer details with auto-grading
    let totalMarks = 0;
    let earnedMarks = 0;
    let autoGradedMarks = 0;

    const answerList = Array.isArray(answers)
      ? answers
      : (answers && typeof answers === 'object' ? answers : {});

    const answerDetails = (paper.questions || []).map((q, idx) => {
      const rawAns = answerList[idx];
      const studentAns = (rawAns == null ? '' : String(rawAns)).trim();
      const correctAns = (q.answer || '').trim();
      const isAutoGraded = (q.type === 'MCQ' || q.type === 'True/False') && correctAns;
      const isCorrect = isAutoGraded
        ? studentAns.toLowerCase() === correctAns.toLowerCase()
        : false;
      const earned = isAutoGraded ? (isCorrect ? (q.marks || 0) : 0) : 0;

      totalMarks += q.marks || 0;
      earnedMarks += earned;
      if (isAutoGraded) autoGradedMarks += earned;

      return {
        questionNumber: q.number || idx + 1,
        questionText: q.questionText || '',
        questionType: q.type || 'Short Answer',
        totalMarks: q.marks || 0,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect,
        earnedMarks: earned
      };
    });

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const passed = earnedMarks >= (paper.passMark || 0);

    // Prevent duplicate submission (upsert)
    const submission = await ExamPaperSubmission.findOneAndUpdate(
      { examPaperId, studentId },
      {
        examPaperId,
        paperTitle: paper.title,
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType,
        teacherName: paper.teacherName,
        studentId,
        studentName: studentName || studentId,
        studentEmail: studentEmail || '',
        answers: answerDetails,
        totalMarks,
        earnedMarks,
        autoGradedMarks,
        percentage,
        passed,
        passMark: paper.passMark || 0,
        status: 'Submitted',
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Paper submitted successfully',
      data: {
        earnedMarks,
        totalMarks,
        percentage,
        passed,
        passMark: paper.passMark || 0
      }
    });
  } catch (error) {
    console.error('submitExamPaper error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all submissions (admin)
// @route  GET /api/exam-submissions
// @access Public
export const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await ExamPaperSubmission.find()
      .populate('examPaperId', 'title subject grade examType teacherName totalMarks passMark questions')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get submissions for a specific student
// @route  GET /api/exam-submissions/student/:studentId
// @access Public
export const getStudentSubmissions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const submissions = await ExamPaperSubmission.find({
      studentId: { $regex: `^${studentId}$`, $options: 'i' }
    })
      .populate('examPaperId', 'title subject grade examType teacherName totalMarks passMark questions')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single submission
// @route  GET /api/exam-submissions/:id
// @access Public
export const getSubmission = async (req, res) => {
  try {
    const submission = await ExamPaperSubmission.findById(req.params.id)
      .populate('examPaperId', 'title subject grade examType teacherName totalMarks passMark questions');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete submission
// @route  DELETE /api/exam-submissions/:id
// @access Private
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await ExamPaperSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.status(200).json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
