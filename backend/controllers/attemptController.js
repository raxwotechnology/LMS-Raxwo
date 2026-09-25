import mongoose from 'mongoose';
import Attempt from '../models/Attempt.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import { sendClassAttemptSMS } from '../services/smsService.js';

// @desc    Attempt a class (student joins)
// @route   POST /api/attempts
// @access  Public
export const attemptClass = async (req, res) => {
  try {
    const { classId, studentId, studentName, studentEmail } = req.body;

    // Validate classId
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid class ID is required'
      });
    }

    // Accept studentId, studentEmail, email, or studentName
    const searchValue = (studentId || studentEmail || req.body.email || studentName || '').toString().trim();
    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: 'Please provide class ID and student ID or email'
      });
    }

    // Verify class exists and populate subject
    const classInstance = await Class.findById(classId).populate('subjectId', 'name');
    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class is deleted
    if (classInstance.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'This class has been deleted'
      });
    }

    // Flexible student lookup
    // 1. Try exact or case-insensitive match by studentId
    let student = await Student.findOne({ 
      studentId: { $regex: new RegExp(`^${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    }).select('name email studentId mobile firstName lastName');

    // 2. If not found, try by email
    if (!student && (searchValue.includes('@') || studentEmail || req.body.email)) {
      const emailTarget = (studentEmail || req.body.email || searchValue).trim().toLowerCase();
      student = await Student.findOne({ 
        email: { $regex: new RegExp(`^${emailTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      }).select('name email studentId mobile firstName lastName');
    }

    // 3. If not found, try by MongoDB _id
    if (!student && mongoose.Types.ObjectId.isValid(searchValue)) {
      student = await Student.findById(searchValue).select('name email studentId mobile firstName lastName');
    }

    // 4. If not found, try by studentName or name parts
    if (!student) {
      const targetName = (studentName || searchValue).trim().toLowerCase();
      const allStudents = await Student.find().select('name email studentId mobile firstName lastName');
      student = allStudents.find(s => {
        const studentNameLower = (s.name || '').trim().toLowerCase();
        const fName = (s.firstName || '').trim().toLowerCase();
        const lName = (s.lastName || '').trim().toLowerCase();
        return (
          studentNameLower === targetName ||
          (fName && targetName === fName) ||
          (lName && targetName === lName) ||
          (fName && targetName.includes(fName)) ||
          (studentNameLower && targetName.includes(studentNameLower))
        );
      });
    }

    // Resolved student details (fallback gracefully so attempt is always recorded)
    const resolvedStudentId = student?.studentId || searchValue;
    const resolvedStudentName = student?.name || studentName || searchValue;
    const resolvedStudentEmail = student?.email || studentEmail || req.body.email || (searchValue.includes('@') ? searchValue : '');

    // Check if student already has an active attempt for this class
    const existingAttempt = await Attempt.findOne({ 
      classId: classId, 
      $or: [
        { studentId: resolvedStudentId },
        ...(resolvedStudentEmail ? [{ studentEmail: resolvedStudentEmail }] : [])
      ],
      status: 'active'
    });
    
    if (existingAttempt) {
      // Ensure attendance is marked attended
      if (existingAttempt.attendance !== 'attended') {
        existingAttempt.attendance = 'attended';
        existingAttempt.attendanceMarkedAt = new Date();
        await existingAttempt.save();
      }
      return res.status(200).json({
        success: true,
        message: 'You have already joined this class',
        data: existingAttempt
      });
    }

    // Check if student previously left this class
    const leftAttempt = await Attempt.findOne({
      classId: classId,
      $or: [
        { studentId: resolvedStudentId },
        ...(resolvedStudentEmail ? [{ studentEmail: resolvedStudentEmail }] : [])
      ],
      status: 'left'
    });

    // If student left and class is closed, they cannot rejoin
    if (leftAttempt && classInstance.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You cannot rejoin this class as it has been closed and your attendance has been recorded'
      });
    }

    let attempt;
    if (leftAttempt) {
      // Reactivate the previous attempt
      leftAttempt.status = 'active';
      leftAttempt.leftAt = null;
      leftAttempt.studentName = resolvedStudentName;
      leftAttempt.studentEmail = resolvedStudentEmail;
      leftAttempt.attendance = 'attended';
      leftAttempt.attendanceMarkedAt = new Date();
      await leftAttempt.save();
      attempt = leftAttempt;
    } else {
      // Create new attempt with attended status immediately
      attempt = await Attempt.create({
        classId,
        studentId: resolvedStudentId,
        studentName: resolvedStudentName,
        studentEmail: resolvedStudentEmail,
        status: 'active',
        attendance: 'attended',
        attendanceMarkedAt: new Date()
      });

      // Send SMS notification if student has mobile
      if (student && student.mobile && student.mobile.trim()) {
        try {
          sendClassAttemptSMS(student, classInstance).catch(err => {
            console.error('SMS notification error (non-fatal):', err);
          });
        } catch (smsError) {
          console.error('Failed to trigger SMS notification:', smsError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Class joined and attendance recorded successfully',
      data: attempt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'You have already attempted this class'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave a class (student leaves) - marks as left instead of deleting
// @route   PUT /api/attempts/:classId/:studentId/leave
// @access  Public
export const leaveClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Find and update the attempt status to 'left'
    const attempt = await Attempt.findOne({
      classId: classId,
      studentId: studentId,
      status: 'active'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Active attempt not found'
      });
    }

    // Check if class is closed - if so, mark attendance as absent
    const Class = (await import('../models/Class.js')).default;
    const classInstance = await Class.findById(classId);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Mark as left
    attempt.status = 'left';
    attempt.leftAt = new Date();

    // If class is already closed, mark attendance as absent
    if (classInstance.status === 'completed') {
      attempt.attendance = 'absent';
      attempt.attendanceMarkedAt = new Date();
    }
    // If class is not closed, attendance remains pending (student can rejoin)

    await attempt.save();

    res.status(200).json({
      success: true,
      message: classInstance.status === 'completed' 
        ? 'Left class successfully. Your attendance has been marked as absent.'
        : 'Left class successfully. You can rejoin if the class is still ongoing.',
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attempts for a class
// @route   GET /api/attempts/class/:classId
// @access  Public
export const getClassAttempts = async (req, res) => {
  try {
    const { classId } = req.params;
    const { status } = req.query; // Optional filter by status

    const query = { classId };
    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query)
      .sort({ createdAt: -1 });

    const activeCount = await Attempt.countDocuments({ classId, status: 'active' });
    const attendedCount = await Attempt.countDocuments({ classId, attendance: 'attended' });
    const attendedOrActiveCount = await Attempt.countDocuments({
      classId,
      $or: [{ status: 'active' }, { attendance: 'attended' }]
    });

    res.status(200).json({
      success: true,
      count: status ? attempts.length : attendedOrActiveCount,
      activeCount,
      attendedCount,
      leftCount: await Attempt.countDocuments({ classId, status: 'left' }),
      totalCount: await Attempt.countDocuments({ classId }),
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if student attempted a class (checks for active attempts)
// @route   GET /api/attempts/check/:classId/:studentId
// @access  Public
export const checkAttempt = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const attempt = await Attempt.findOne({
      classId: classId,
      studentId: studentId,
      status: 'active' // Only check for active attempts
    });

    res.status(200).json({
      success: true,
      attempted: !!attempt,
      isActive: !!attempt,
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attempts by student ID
// @route   GET /api/attempts/student/:studentId
// @access  Public
export const getStudentAttempts = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query; // Optional filter by status

    const param = (studentId || '').trim();

    // Check if student exists in Student collection to grab both studentId & email
    let student = null;
    if (mongoose.Types.ObjectId.isValid(param)) {
      student = await Student.findById(param);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { email: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });
    }

    const query = {
      $or: [
        { studentId: param },
        ...(student?.studentId ? [{ studentId: student.studentId }] : []),
        ...(student?.email ? [{ studentEmail: student.email }] : []),
        ...(param.includes('@') ? [{ studentEmail: param.toLowerCase() }] : [])
      ]
    };

    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      activeCount: await Attempt.countDocuments({ ...query, status: 'active' }),
      leftCount: await Attempt.countDocuments({ ...query, status: 'left' }),
      totalCount: await Attempt.countDocuments(query),
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attempts for reporting (all statuses)
// @route   GET /api/attempts/report
// @access  Public
export const getAllAttemptsReport = async (req, res) => {
  try {
    const { classId, studentId, status } = req.query;

    const query = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    const stats = {
      total: await Attempt.countDocuments(query),
      active: await Attempt.countDocuments({ ...query, status: 'active' }),
      left: await Attempt.countDocuments({ ...query, status: 'left' })
    };

    res.status(200).json({
      success: true,
      count: attempts.length,
      stats,
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student weekly or monthly attendance by student ID or name, grouped by subject
// @route   GET /api/attempts/attendance/weekly
// @access  Public
export const getStudentWeeklyAttendance = async (req, res) => {
  try {
    const { studentId, studentName, period = 'weekly' } = req.query;

    // Validate input
    if (!studentId && !studentName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either student ID or student name'
      });
    }

    // Validate period
    if (period !== 'weekly' && period !== 'monthly') {
      return res.status(400).json({
        success: false,
        message: 'Period must be either "weekly" or "monthly"'
      });
    }

    // Find student by ID or name - try both if needed
    let student;
    if (studentId) {
      // First try exact match by studentId
      student = await Student.findOne({ studentId: studentId });
      // If not found, try case-insensitive search
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentId}$`, $options: 'i' } 
        });
      }
    } else if (studentName) {
      // Try searching by name first
      student = await Student.findOne({ 
        name: { $regex: studentName, $options: 'i' } 
      });
      // If not found by name, also try searching by studentId (in case user entered ID as name)
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentName}$`, $options: 'i' } 
        });
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please check the student ID or name and try again.'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    if (period === 'weekly') {
      // Calculate start and end of current week (Monday to Sunday)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Calculate start and end of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get all attempts for this student in the date range
    const attempts = await Attempt.find({
      studentId: student.studentId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate({
        path: 'classId',
        select: 'subjectId teacherId date time status',
        populate: [
          {
            path: 'subjectId',
            select: 'name'
          },
          {
            path: 'teacherId',
            select: 'name'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Group attempts by subject
    const attendanceBySubject = {};
    
    attempts.forEach(attempt => {
      const subjectId = attempt.classId?.subjectId?._id?.toString() || 'unknown';
      const subjectName = attempt.classId?.subjectId?.name || 'Unknown Subject';
      
      if (!attendanceBySubject[subjectId]) {
        attendanceBySubject[subjectId] = {
          subjectId: subjectId,
          subjectName: subjectName,
          classes: [],
          statistics: {
            total: 0,
            attended: 0,
            absent: 0,
            pending: 0
          }
        };
      }
      
      attendanceBySubject[subjectId].classes.push(attempt);
      attendanceBySubject[subjectId].statistics.total++;
      
      if (attempt.attendance === 'attended') {
        attendanceBySubject[subjectId].statistics.attended++;
      } else if (attempt.attendance === 'absent') {
        attendanceBySubject[subjectId].statistics.absent++;
      } else {
        attendanceBySubject[subjectId].statistics.pending++;
      }
    });

    // Convert to array and sort by subject name
    const subjectsArray = Object.values(attendanceBySubject).sort((a, b) => 
      a.subjectName.localeCompare(b.subjectName)
    );

    // Calculate overall statistics
    const totalClasses = attempts.length;
    const attendedCount = attempts.filter(a => a.attendance === 'attended').length;
    const absentCount = attempts.filter(a => a.attendance === 'absent').length;
    const pendingCount = attempts.filter(a => a.attendance === 'pending' || !a.attendance).length;

    res.status(200).json({
      success: true,
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email
      },
      period: period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      overallStatistics: {
        totalClasses,
        attended: attendedCount,
        absent: absentCount,
        pending: pendingCount
      },
      attendanceBySubject: subjectsArray,
      data: attempts // Keep for backward compatibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

