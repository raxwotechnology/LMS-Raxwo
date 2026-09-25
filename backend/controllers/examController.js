import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name')
      .populate('subjectId', 'name conductedBy')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
export const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name')
      .populate('subjectId', 'name conductedBy');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create exam
// @route   POST /api/exams
// @access  Private
export const createExam = async (req, res) => {
  try {
    const {
      studentId,
      studentIdNumber,
      studentName,
      grade,
      subject,
      subjectId,
      examName,
      examDate,
      examTime,
      startTime,
      endTime,
      examHall,
      teacherName,
      guardianContact,
      // Optional legacy fields
      title,
      firstName,
      lastName,
      otherNames,
      familyName,
      email,
      mobile,
      telephone,
      specialNeeds,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      guardianMobile,
      ukVisa,
      candidateIdNumber,
      exams
    } = req.body;

    const resolvedStartTime = startTime ? startTime.trim() : (examTime ? examTime.split('-')[0]?.trim() : '');
    const resolvedEndTime = endTime ? endTime.trim() : (examTime ? examTime.split('-')[1]?.trim() : '');
    const resolvedExamTime = (examTime && examTime.trim()) 
      ? examTime.trim() 
      : (resolvedStartTime && resolvedEndTime ? `${resolvedStartTime} - ${resolvedEndTime}` : (resolvedStartTime || ''));

    // Validate required fields
    if (!studentId || !studentIdNumber || !studentName || !subject || !examName || !examDate || !resolvedExamTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Student, Subject, Exam Name, Exam Date, Exam Start & End Time)'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Resolve subject if subjectId not provided
    let resolvedSubjectId = subjectId;
    let resolvedSubjectName = subject.trim();
    if (resolvedSubjectId && mongoose.Types.ObjectId.isValid(resolvedSubjectId)) {
      const subDoc = await Subject.findById(resolvedSubjectId);
      if (subDoc) {
        resolvedSubjectName = subDoc.name;
      }
    } else {
      const subDoc = await Subject.findOne({
        name: { $regex: new RegExp(`^${resolvedSubjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (subDoc) {
        resolvedSubjectId = subDoc._id;
      }
    }

    // Check duplicate: Only reject if the same student is already registered for the same subject & exam name on the same date
    const parsedExamDate = new Date(examDate);
    const startOfDay = new Date(parsedExamDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedExamDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingExam = await Exam.findOne({
      $or: [
        { studentId: student._id },
        { studentIdNumber: studentIdNumber.trim() }
      ],
      $and: [
        {
          $or: [
            { subject: { $regex: new RegExp(`^${resolvedSubjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { 'exams.subjectName': { $regex: new RegExp(`^${resolvedSubjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        },
        { examName: { $regex: new RegExp(`^${examName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { examDate: { $gte: startOfDay, $lte: endOfDay } }
      ]
    });

    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: `This student is already registered for "${examName}" (${resolvedSubjectName}) on this date.`,
        data: existingExam,
        exists: true
      });
    }

    // Prepare legacy fields for backward compatibility
    const nameParts = (studentName || student.name || '').trim().split(/\s+/);
    const derivedFirstName = firstName ? firstName.trim() : (nameParts[0] || '');
    const derivedLastName = lastName ? lastName.trim() : (nameParts.slice(1).join(' ') || derivedFirstName);

    const processedExams = resolvedSubjectId
      ? [{ subjectId: resolvedSubjectId, subjectName: resolvedSubjectName }]
      : [{ subjectName: resolvedSubjectName }];

    // Create exam
    const examRecord = await Exam.create({
      studentId: student._id,
      studentIdNumber: studentIdNumber.trim(),
      studentName: studentName.trim(),
      grade: grade ? grade.trim() : undefined,
      subject: resolvedSubjectName,
      subjectId: (resolvedSubjectId && mongoose.Types.ObjectId.isValid(resolvedSubjectId)) ? resolvedSubjectId : undefined,
      examName: examName.trim(),
      examDate: parsedExamDate,
      examTime: resolvedExamTime,
      startTime: resolvedStartTime || undefined,
      endTime: resolvedEndTime || undefined,
      examHall: examHall ? examHall.trim() : undefined,
      teacherName: teacherName ? teacherName.trim() : undefined,
      guardianContact: guardianContact ? guardianContact.trim() : (student.guardianTelephone || student.mobile || undefined),

      // Legacy fields
      title: title ? title.trim() : undefined,
      firstName: derivedFirstName,
      lastName: derivedLastName,
      otherNames: otherNames ? otherNames.trim() : derivedFirstName,
      familyName: familyName ? familyName.trim() : derivedLastName,
      email: email ? email.trim() : (student.email || undefined),
      mobile: mobile ? mobile.trim() : (student.mobile || undefined),
      telephone: telephone ? telephone.trim() : undefined,
      specialNeeds: specialNeeds ? specialNeeds.trim() : (student.hasSpecialNeeds ? 'Yes' : undefined),
      specialNeedsDetails: specialNeedsDetails ? specialNeedsDetails.trim() : (student.specialNeedsDetails || undefined),
      guardianFirstName: guardianFirstName ? guardianFirstName.trim() : (student.guardianFirstName || undefined),
      guardianLastName: guardianLastName ? guardianLastName.trim() : (student.guardianLastName || undefined),
      guardianTelephone: guardianTelephone ? guardianTelephone.trim() : (student.guardianTelephone || undefined),
      guardianMobile: guardianMobile ? guardianMobile.trim() : undefined,
      ukVisa: ukVisa ? ukVisa.trim() : undefined,
      exams: (exams && Array.isArray(exams) && exams.length > 0) ? exams : processedExams,
      candidateIdNumber: candidateIdNumber ? candidateIdNumber.trim() : undefined
    });

    // Populate student data and exam subjects before sending response
    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    res.status(201).json({
      success: true,
      message: 'Exam record created successfully',
      data: examRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private
export const updateExam = async (req, res) => {
  try {
    const {
      studentName,
      grade,
      subject,
      subjectId,
      examName,
      examDate,
      examTime,
      startTime,
      endTime,
      examHall,
      teacherName,
      guardianContact,
      candidateIdNumber,
      // Legacy fields if sent
      title,
      firstName,
      lastName,
      email,
      mobile,
      telephone,
      specialNeeds,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      ukVisa,
      exams
    } = req.body;

    let examRecord = await Exam.findById(req.params.id);

    if (!examRecord) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }

    // Update 10 primary fields
    if (studentName !== undefined) {
      examRecord.studentName = studentName.trim();
      const parts = studentName.trim().split(/\s+/);
      examRecord.firstName = parts[0] || '';
      examRecord.lastName = parts.slice(1).join(' ') || parts[0] || '-';
      examRecord.otherNames = examRecord.firstName;
      examRecord.familyName = examRecord.lastName;
    }
    if (grade !== undefined) examRecord.grade = grade ? grade.trim() : undefined;
    if (subject !== undefined) {
      examRecord.subject = subject.trim();
      let resolvedSubId = subjectId;
      if (!resolvedSubId || !mongoose.Types.ObjectId.isValid(resolvedSubId)) {
        const subDoc = await Subject.findOne({ name: { $regex: new RegExp(`^${subject.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (subDoc) resolvedSubId = subDoc._id;
      }
      if (resolvedSubId && mongoose.Types.ObjectId.isValid(resolvedSubId)) {
        examRecord.subjectId = resolvedSubId;
        examRecord.exams = [{ subjectId: resolvedSubId, subjectName: subject.trim() }];
      } else {
        examRecord.exams = [{ subjectName: subject.trim() }];
      }
    }
    if (subjectId !== undefined && mongoose.Types.ObjectId.isValid(subjectId)) {
      examRecord.subjectId = subjectId;
    }
    if (examName !== undefined) examRecord.examName = examName.trim();
    if (examDate !== undefined) examRecord.examDate = new Date(examDate);
    if (startTime !== undefined) examRecord.startTime = startTime ? startTime.trim() : undefined;
    if (endTime !== undefined) examRecord.endTime = endTime ? endTime.trim() : undefined;
    if (examTime !== undefined) {
      examRecord.examTime = examTime.trim();
    } else if (startTime !== undefined || endTime !== undefined) {
      const s = (startTime !== undefined ? startTime : (examRecord.startTime || '')).trim();
      const e = (endTime !== undefined ? endTime : (examRecord.endTime || '')).trim();
      if (s && e) examRecord.examTime = `${s} - ${e}`;
      else if (s) examRecord.examTime = s;
    }
    if (examHall !== undefined) examRecord.examHall = examHall ? examHall.trim() : undefined;
    if (teacherName !== undefined) examRecord.teacherName = teacherName ? teacherName.trim() : undefined;
    if (guardianContact !== undefined) examRecord.guardianContact = guardianContact ? guardianContact.trim() : undefined;

    // Legacy fields update
    if (title !== undefined) examRecord.title = title ? title.trim() : undefined;
    if (firstName !== undefined && firstName.trim()) examRecord.firstName = firstName.trim();
    if (lastName !== undefined && lastName.trim()) examRecord.lastName = lastName.trim();
    if (email !== undefined) examRecord.email = email ? email.trim() : undefined;
    if (mobile !== undefined) examRecord.mobile = mobile ? mobile.trim() : undefined;
    if (telephone !== undefined) examRecord.telephone = telephone ? telephone.trim() : undefined;
    if (specialNeeds !== undefined) examRecord.specialNeeds = specialNeeds ? specialNeeds.trim() : undefined;
    if (specialNeedsDetails !== undefined) examRecord.specialNeedsDetails = specialNeedsDetails ? specialNeedsDetails.trim() : undefined;
    if (guardianFirstName !== undefined) examRecord.guardianFirstName = guardianFirstName ? guardianFirstName.trim() : undefined;
    if (guardianLastName !== undefined) examRecord.guardianLastName = guardianLastName ? guardianLastName.trim() : undefined;
    if (guardianTelephone !== undefined) examRecord.guardianTelephone = guardianTelephone ? guardianTelephone.trim() : undefined;
    if (ukVisa !== undefined) examRecord.ukVisa = ukVisa ? ukVisa.trim() : undefined;
    if (candidateIdNumber !== undefined) examRecord.candidateIdNumber = candidateIdNumber ? candidateIdNumber.trim() : undefined;
    if (exams !== undefined && Array.isArray(exams) && exams.length > 0) {
      examRecord.exams = exams;
    }
    
    examRecord.updatedAt = Date.now();

    await examRecord.save();

    // Populate student data and exam subjects before sending response
    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    res.status(200).json({
      success: true,
      message: 'Exam record updated successfully',
      data: examRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exam record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all exam records for a student
// @route   GET /api/exams/student/:studentId
// @access  Public (both admin and client can check)
export const checkExamByStudent = async (req, res) => {
  try {
    const rawParam = (req.params.studentId || '').trim();
    const { studentIdNumber } = req.query;

    const searchValue = (rawParam !== 'undefined' && rawParam !== 'null' ? rawParam : (studentIdNumber || '')).trim();

    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a student ID, student ID number, or email'
      });
    }

    // 1. Look up student in Student collection by studentId, email, or _id
    let student = null;
    if (mongoose.Types.ObjectId.isValid(searchValue)) {
      student = await Student.findById(searchValue);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: { $regex: new RegExp(`^${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { email: { $regex: new RegExp(`^${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });
    }

    // 2. Build query conditions for Exam collection
    const orConditions = [
      { studentIdNumber: searchValue },
      ...(student ? [{ studentId: student._id }, { studentIdNumber: student.studentId }] : []),
      ...(student?.email ? [{ email: student.email }] : []),
      ...(searchValue.includes('@') ? [{ email: searchValue.toLowerCase() }] : []),
      ...(mongoose.Types.ObjectId.isValid(searchValue) ? [{ studentId: searchValue }] : [])
    ];

    const exams = await Exam.find({ $or: orConditions })
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name')
      .populate('subjectId', 'name conductedBy')
      .sort({ examDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      exists: exams.length > 0,
      count: exams.length,
      data: exams,
      exam: exams[0] || null // For backward compatibility with callers expecting single object
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


