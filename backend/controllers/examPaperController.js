import ExamPaper from '../models/ExamPaper.js';
import Student from '../models/Student.js';

// @desc   Get all exam papers
// @route  GET /api/exam-papers
// @access Public
export const getExamPapers = async (req, res) => {
  try {
    const papers = await ExamPaper.find()
      .populate('subjectId', 'name conductedBy')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: papers.length, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single exam paper
// @route  GET /api/exam-papers/:id
// @access Public
export const getExamPaper = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id).populate('subjectId', 'name conductedBy');
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Exam paper not found' });
    }
    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get exam papers for a specific student (based on grade, subject, classType)
// @route  GET /api/exam-papers/for-student/:identifier
// @access Public
export const getExamPapersForStudent = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Safe ObjectId check without dynamic import
    const isObjId = /^[a-f\d]{24}$/i.test(identifier);

    // Find the student by studentId, email, or _id
    const orClauses = [
      { studentId: { $regex: `^${identifier}$`, $options: 'i' } },
      { email: identifier.toLowerCase() }
    ];
    if (isObjId) orClauses.push({ _id: identifier });

    const student = await Student.findOne({ $or: orClauses })
      .populate('subjects', 'name')
      .select('+enrolledSubjects');

    if (!student) {
      // Student not found — return empty rather than error
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const studentGrade = (student.grade || '').toLowerCase().trim();
    const studentClassType = student.classType || 'Physical'; // 'Online' | 'Physical'

    // Collect all subject names for this student from all possible fields
    const subjectNameSet = new Set();

    // From subjects array (populated Subject documents)
    (student.subjects || []).forEach(s => {
      const name = (typeof s === 'object' ? s.name : s) || '';
      if (name) subjectNameSet.add(name.toLowerCase().trim());
    });

    // From free-text subject field (class details)
    if (student.subject) subjectNameSet.add(student.subject.toLowerCase().trim());

    // From enrolledSubjects array
    (student.enrolledSubjects || []).forEach(es => {
      if (es.subjectName) subjectNameSet.add(es.subjectName.toLowerCase().trim());
    });

    const studentSubjectNames = [...subjectNameSet];

    // Fetch all Published papers targeting this student type (or Both)
    const allPublished = await ExamPaper.find({
      status: 'Published',
      targetStudentType: { $in: [studentClassType, 'Both'] }
    })
      .populate('subjectId', 'name conductedBy')
      .sort({ createdAt: -1 });

    // Further filter by grade and subject — lenient: if paper has no grade/subject, show to all
    const filtered = allPublished.filter(paper => {
      // Grade: only restrict if BOTH the paper and student have a grade set
      if (paper.grade && studentGrade) {
        if (paper.grade.toLowerCase().trim() !== studentGrade) return false;
      }
      // Subject: only restrict if paper has a subject AND student has subjects registered
      if (paper.subject && studentSubjectNames.length > 0) {
        const ps = paper.subject.toLowerCase().trim();
        const match = studentSubjectNames.some(sn => sn === ps);
        if (!match) return false;
      }
      return true;
    });

    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error('getExamPapersForStudent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create exam paper
// @route  POST /api/exam-papers
// @access Private
export const createExamPaper = async (req, res) => {
  try {
    const {
      title, subject, subjectId, grade, examType, targetStudentType,
      date, duration, passMark, instructions, teacherName, questions, status
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: 'Title and Subject are required' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required' });
    }

    const numberedQuestions = questions.map((q, i) => ({
      ...q,
      number: q.number || i + 1,
      options: q.options || []
    }));

    const totalMarks = numberedQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

    const paper = await ExamPaper.create({
      title, subject,
      subjectId: subjectId || undefined,
      grade,
      examType: examType || '1st Term Test',
      targetStudentType: targetStudentType || 'Online',
      date: date || undefined,
      duration: duration || 60,
      totalMarks,
      passMark: passMark || 0,
      instructions,
      teacherName,
      questions: numberedQuestions,
      status: status || 'Draft'
    });

    res.status(201).json({ success: true, message: 'Exam paper created successfully', data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update exam paper
// @route  PUT /api/exam-papers/:id
// @access Private
export const updateExamPaper = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Exam paper not found' });
    }

    const {
      title, subject, subjectId, grade, examType, targetStudentType,
      date, duration, passMark, instructions, teacherName, questions, status
    } = req.body;

    if (title !== undefined) paper.title = title;
    if (subject !== undefined) paper.subject = subject;
    if (subjectId !== undefined) paper.subjectId = subjectId;
    if (grade !== undefined) paper.grade = grade;
    if (examType !== undefined) paper.examType = examType;
    if (targetStudentType !== undefined) paper.targetStudentType = targetStudentType;
    if (date !== undefined) paper.date = date;
    if (duration !== undefined) paper.duration = duration;
    if (passMark !== undefined) paper.passMark = passMark;
    if (instructions !== undefined) paper.instructions = instructions;
    if (teacherName !== undefined) paper.teacherName = teacherName;
    if (status !== undefined) paper.status = status;

    if (questions && Array.isArray(questions)) {
      paper.questions = questions.map((q, i) => ({
        ...q,
        number: q.number || i + 1,
        options: q.options || []
      }));
    }

    await paper.save();
    res.status(200).json({ success: true, message: 'Exam paper updated successfully', data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete exam paper
// @route  DELETE /api/exam-papers/:id
// @access Private
export const deleteExamPaper = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Exam paper not found' });
    }
    await paper.deleteOne();
    res.status(200).json({ success: true, message: 'Exam paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
