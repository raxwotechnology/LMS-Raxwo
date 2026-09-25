import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Class from '../models/Class.js';
import Attempt from '../models/Attempt.js';
import Exam from '../models/Exam.js';
import Marks from '../models/Marks.js';
import Subject from '../models/Subject.js';
import Employee from '../models/Employee.js';

// @desc    Get all student activities (fees status, online/physical mode, class & exam attendance per subject)
// @route   GET /api/student-activities
// @access  Private
export const getStudentActivities = async (req, res) => {
  try {
    const { search, classType, paymentStatus, grade, subject } = req.query;

    // 1. Fetch all active students
    const students = await Student.find({ isDeleted: { $ne: true } })
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price')
      .sort({ studentId: 1 });

    // 2. Fetch payments, classes, attempts, exams, marks, subjects, and employees in parallel
    const [allPayments, allClasses, allAttempts, allExams, allMarks, allSubjects, allEmployees] = await Promise.all([
      Payment.find().sort({ paymentDate: -1 }),
      Class.find().populate('subjectId', 'name').populate('teacherId', 'name'),
      Attempt.find().populate({
        path: 'classId',
        populate: [
          { path: 'subjectId', select: 'name' },
          { path: 'teacherId', select: 'name' }
        ]
      }),
      Exam.find().sort({ examDate: -1 }),
      Marks.find().populate('subjects.subjectId', 'name'),
      Subject.find(),
      Employee.find().select('name role')
    ]);

    // Build subject ID to Name map
    const subjectMap = {};
    allSubjects.forEach(s => {
      subjectMap[s._id.toString()] = s.name;
    });

    // Build teacher ID to Name map
    const teacherMap = {};
    allEmployees.forEach(e => {
      teacherMap[e._id.toString()] = e.name;
    });

    // Build class ID to class object map
    const classMap = {};
    allClasses.forEach(c => {
      classMap[c._id.toString()] = c;
    });

    // 3. Process each student's activity data
    const studentActivities = students.map(student => {
      const studentIdNum = student.studentId || '';
      const studentMongoId = student._id.toString();

      // Parse enrolled subjects list
      let rawEnrolledList = [];
      if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
        rawEnrolledList = student.enrolledSubjects.map(es => ({
          _id: es._id,
          subjectId: es.subjectId ? es.subjectId.toString() : null,
          subjectName: es.subjectName || es.subject,
          teacherName: es.teacherName || student.teacherName || '',
          classType: es.classType || student.classType || 'Physical',
          classDay: es.classDay || student.classDay || '',
          classTime: es.classTime || student.classTime || '',
          classLocation: es.classLocation || student.classLocation || '',
          monthlyFee: es.monthlyClassFee !== undefined ? es.monthlyClassFee : (student.monthlyClassFee || 0),
          registrationStatus: es.registrationStatus || student.registrationStatus || 'Active',
          paymentStatus: es.paymentStatus || student.paymentStatus || 'Pending'
        }));
      } else if (student.subject) {
        const subNames = student.subject.split(',').map(s => s.trim()).filter(Boolean);
        rawEnrolledList = subNames.map((sName, idx) => ({
          _id: `enroll-${idx}`,
          subjectId: student.subjects?.[idx]?._id?.toString() || null,
          subjectName: sName,
          teacherName: student.teacherName || '',
          classType: student.classType || 'Physical',
          classDay: student.classDay || '',
          classTime: student.classTime || '',
          classLocation: student.classLocation || '',
          monthlyFee: student.monthlyClassFee || 0,
          registrationStatus: student.registrationStatus || 'Active',
          paymentStatus: student.paymentStatus || 'Pending'
        }));
      }

      // Payments for this student
      const studentPayments = allPayments.filter(p => {
        const matchMongoId = p.studentId && p.studentId.toString() === studentMongoId;
        const matchIdNum = p.studentIdNumber && p.studentIdNumber.toLowerCase() === studentIdNum.toLowerCase();
        return matchMongoId || matchIdNum;
      });

      const totalPaidAmount = studentPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const overallPaidMonths = [...new Set(studentPayments.map(p => p.month).filter(Boolean))];
      const latestPayment = studentPayments[0] || null;

      // Class Attempts for this student
      const studentAttempts = allAttempts.filter(a => {
        const studentNameClean = (student.name || '').trim().toLowerCase();
        const aNameClean = (a.studentName || '').trim().toLowerCase();
        const matchId = Boolean(studentIdNum && a.studentId && a.studentId.trim().toLowerCase() === studentIdNum.trim().toLowerCase());
        const matchName = Boolean(studentNameClean && aNameClean && aNameClean === studentNameClean);

        if (studentNameClean && aNameClean) {
          return matchName;
        }
        return matchId || matchName;
      });

      // Exams for this student
      const studentExams = allExams.filter(e => {
        const studentNameClean = (student.name || '').trim().toLowerCase();
        const eNameClean = (e.studentName || '').trim().toLowerCase();
        const matchMongo = e.studentId && e.studentId.toString() === studentMongoId;
        const matchId = Boolean(studentIdNum && e.studentIdNumber && e.studentIdNumber.trim().toLowerCase() === studentIdNum.trim().toLowerCase());
        const matchName = Boolean(studentNameClean && eNameClean && eNameClean === studentNameClean);

        if (matchMongo) return true;
        if (studentNameClean && eNameClean) {
          return matchName;
        }
        return matchId || matchName;
      });

      // Marks for this student
      const studentMarks = allMarks.filter(m => {
        return m.studentId && m.studentId.toString() === studentMongoId;
      });

      // 4. Calculate per-subject breakdown for Fee, Class Attendance, and Exam Attendance
      const enrolledSubjects = rawEnrolledList.map(item => {
        const subIdStr = item.subjectId ? item.subjectId.toString() : '';
        const subNameLower = (item.subjectName || '').trim().toLowerCase();
        const teacherLower = (item.teacherName || '').trim().toLowerCase();

        // --- Subject Payment Status ---
        const subPayments = studentPayments.filter(p => {
          if (p.subjects && p.subjects.length > 0) {
            return p.subjects.some(sId => {
              const sIdStr = sId ? sId.toString() : '';
              if (subIdStr && sIdStr === subIdStr) return true;
              const mappedName = subjectMap[sIdStr];
              return mappedName && mappedName.trim().toLowerCase() === subNameLower;
            });
          }
          // If payment doesn't explicitly store subjects array, fallback to single enrolled subject match
          if (rawEnrolledList.length === 1) return true;
          return false;
        });

        const subPaidAmount = subPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const subPaidMonths = [...new Set(subPayments.map(p => p.month).filter(Boolean))];
        const isExplicitPaid = (item.paymentStatus && item.paymentStatus.toLowerCase() === 'paid');
        const isSubPaid = isExplicitPaid || subPaidMonths.length > 0;
        const subFeeStatus = isSubPaid ? 'Paid' : 'Pending';

        // --- Subject Class Attendance ---
        const subAttempts = studentAttempts.filter(a => {
          const c = a.classId || (a.classId ? classMap[a.classId.toString()] : null);
          if (!c) {
            return rawEnrolledList.length === 1;
          }

          const cSubId = c.subjectId?._id ? c.subjectId._id.toString() : (c.subjectId ? c.subjectId.toString() : '');
          if (subIdStr && cSubId && subIdStr === cSubId) return true;

          const cSubName = c.subjectId?.name || subjectMap[cSubId] || c.subject || c.className;
          if (cSubName && cSubName.trim().toLowerCase() === subNameLower) return true;

          const cTeacherId = c.teacherId?._id ? c.teacherId._id.toString() : (c.teacherId ? c.teacherId.toString() : '');
          const cTeacherName = c.teacherId?.name || teacherMap[cTeacherId] || c.teacherName;
          if (teacherLower && cTeacherName && cTeacherName.trim().toLowerCase() === teacherLower) return true;

          if (rawEnrolledList.length === 1) return true;
          return false;
        });

        const totalHeld = 4; // Standard 4 classes per month
        const attended = subAttempts.filter(a => a.attendance === 'attended' || a.attendance === 'late').length;
        const absent = subAttempts.filter(a => a.attendance === 'absent').length;
        const pending = Math.max(0, totalHeld - (attended + absent));
        const classRate = totalHeld > 0 ? Math.round((attended / totalHeld) * 100) : 0;

        // --- Subject Exam Attendance ---
        const subExams = studentExams.filter(e => {
          const eSubName = (e.subject || '').trim().toLowerCase();
          const eSubId = e.subjectId ? e.subjectId.toString() : '';
          if (subIdStr && eSubId && subIdStr === eSubId) return true;
          if (eSubName && eSubName === subNameLower) return true;

          if (e.exams && e.exams.length > 0) {
            const hasMatch = e.exams.some(ex => {
              const exId = ex.subjectId ? ex.subjectId.toString() : '';
              const exName = (ex.subjectName || '').trim().toLowerCase();
              return (subIdStr && exId === subIdStr) || (exName && exName === subNameLower);
            });
            if (hasMatch) return true;
          }

          if (teacherLower && e.teacherName && e.teacherName.trim().toLowerCase() === teacherLower) return true;
          if (rawEnrolledList.length === 1) return true;
          return false;
        });

        const subMarks = studentMarks.filter(m => {
          if (m.subjects && m.subjects.length > 0) {
            return m.subjects.some(s => {
              const mSubId = s.subjectId?._id ? s.subjectId._id.toString() : (s.subjectId ? s.subjectId.toString() : '');
              const mSubName = s.subjectId?.name || subjectMap[mSubId];
              return (subIdStr && mSubId === subIdStr) || (mSubName && mSubName.trim().toLowerCase() === subNameLower);
            });
          }
          return rawEnrolledList.length === 1;
        });

        let totalScheduled = subExams.length;
        let examsAttended = 0;
        let examsAbsent = 0;

        subExams.forEach(e => {
          const isAttendedExplicit = e.attendance === 'Attended' || e.attendance === 'Present' || e.attendance === 'Late';
          const isAbsentExplicit = e.attendance === 'Absent';

          if (isAbsentExplicit) {
            examsAbsent++;
          } else if (isAttendedExplicit) {
            examsAttended++;
          }
        });

        const examRate = totalScheduled > 0 ? Math.round((examsAttended / totalScheduled) * 100) : 0;

        return {
          ...item,
          feeStatus: subFeeStatus,
          paidMonths: subPaidMonths,
          totalPaidAmount: subPaidAmount,
          classAttendance: {
            totalHeld,
            attended,
            absent,
            pending,
            rate: classRate
          },
          examAttendance: {
            totalScheduled,
            attended: examsAttended,
            absent: examsAbsent,
            rate: examRate
          },
          assignedExams: subExams.map(e => ({
            _id: e._id,
            examName: e.examName || '',
            subject: e.subject || '',
            subjectId: e.subjectId || null,
            examDate: e.examDate ? new Date(e.examDate).toISOString().split('T')[0] : '',
            examTime: e.examTime || '',
            examHall: e.examHall || '',
            attendance: e.attendance || 'Pending',
            teacherName: e.teacherName || ''
          }))
        };
      });

      // Overall Student Summaries
      const totalClassesHeld = Math.max(4, enrolledSubjects.length * 4);
      const classesAttended = enrolledSubjects.reduce((sum, s) => sum + (s.classAttendance?.attended || 0), 0);
      const classesAbsent = enrolledSubjects.reduce((sum, s) => sum + (s.classAttendance?.absent || 0), 0);
      const classesPending = Math.max(0, totalClassesHeld - (classesAttended + classesAbsent));
      const classAttendanceRate = totalClassesHeld > 0 ? Math.round((classesAttended / totalClassesHeld) * 100) : 0;

      let totalExamsScheduled = studentExams.length;
      let examsAttended = 0;
      let examsAbsent = 0;

      studentExams.forEach(e => {
        const isAttendedExplicit = e.attendance === 'Attended' || e.attendance === 'Present' || e.attendance === 'Late';
        const isAbsentExplicit = e.attendance === 'Absent';

        if (isAbsentExplicit) {
          examsAbsent++;
        } else if (isAttendedExplicit) {
          examsAttended++;
        }
      });

      const examAttendanceRate = totalExamsScheduled > 0 ? Math.round((examsAttended / totalExamsScheduled) * 100) : 0;

      // Class modes summary
      const hasOnline = enrolledSubjects.some(item => (item.classType || '').toLowerCase() === 'online');
      const hasPhysical = enrolledSubjects.some(item => (item.classType || '').toLowerCase() === 'physical');
      let primaryMode = 'Physical';
      if (hasOnline && hasPhysical) primaryMode = 'Hybrid';
      else if (hasOnline) primaryMode = 'Online';
      else primaryMode = 'Physical';

      // Overall Fee Status: Paid if all enrolled subjects are paid, or overall student marked paid
      const allSubjectsPaid = enrolledSubjects.length > 0 && enrolledSubjects.every(s => s.feeStatus === 'Paid');
      const anySubjectPaid = enrolledSubjects.some(s => s.feeStatus === 'Paid');
      const overallFeeStatus = (student.paymentStatus && student.paymentStatus.toLowerCase() === 'paid') ||
        allSubjectsPaid ||
        (enrolledSubjects.length === 0 && overallPaidMonths.length > 0) ? 'Paid' : (anySubjectPaid ? 'Partial' : 'Pending');

      // Backward-compatible classFeeBreakdown
      const classFeeBreakdown = enrolledSubjects.map(sub => ({
        subjectName: sub.subjectName,
        teacherName: sub.teacherName,
        classType: sub.classType,
        monthlyFee: sub.monthlyFee,
        status: sub.feeStatus,
        paidMonths: sub.paidMonths
      }));

      return {
        _id: student._id,
        studentId: studentIdNum,
        name: student.name,
        grade: student.grade || '-',
        gender: student.gender || '',
        contact: student.guardianTelephone || student.mobile || student.telephone || '-',
        enrolledSubjects: enrolledSubjects,
        classFeeBreakdown: classFeeBreakdown,
        primaryMode: primaryMode, // 'Physical', 'Online', or 'Hybrid'
        feeStatus: overallFeeStatus,
        totalPaidAmount: totalPaidAmount,
        paidMonths: overallPaidMonths,
        latestPayment: latestPayment ? {
          month: latestPayment.month,
          amount: latestPayment.totalAmount,
          date: latestPayment.paymentDate,
          method: latestPayment.paymentMethod
        } : null,
        classAttendance: {
          totalHeld: totalClassesHeld,
          attended: classesAttended,
          absent: classesAbsent,
          pending: classesPending,
          rate: classAttendanceRate
        },
        examAttendance: {
          totalScheduled: totalExamsScheduled,
          attended: examsAttended,
          absent: examsAbsent,
          rate: examAttendanceRate
        },
        assignedExams: studentExams.map(e => ({
          _id: e._id,
          examName: e.examName || '',
          subject: e.subject || '',
          subjectId: e.subjectId || null,
          examDate: e.examDate ? new Date(e.examDate).toISOString().split('T')[0] : '',
          examTime: e.examTime || '',
          examHall: e.examHall || '',
          attendance: e.attendance || 'Pending',
          teacherName: e.teacherName || ''
        }))
      };
    });

    // 5. Apply filters if provided
    let filteredActivities = studentActivities;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredActivities = filteredActivities.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.studentId && item.studentId.toLowerCase().includes(q)) ||
        item.enrolledSubjects.some(s => s.subjectName && s.subjectName.toLowerCase().includes(q))
      );
    }

    if (classType && classType !== 'All') {
      const typeLower = classType.toLowerCase();
      filteredActivities = filteredActivities.filter(item => 
        item.enrolledSubjects.some(s => (s.classType || 'physical').toLowerCase() === typeLower) ||
        item.primaryMode.toLowerCase() === typeLower
      );
    }

    if (paymentStatus && paymentStatus !== 'All') {
      const statusLower = paymentStatus.toLowerCase();
      filteredActivities = filteredActivities.filter(item => {
        if (statusLower === 'paid') {
          return item.feeStatus.toLowerCase() === 'paid' || item.enrolledSubjects.some(s => s.feeStatus.toLowerCase() === 'paid');
        }
        if (statusLower === 'pending') {
          return item.feeStatus.toLowerCase() === 'pending' || item.feeStatus.toLowerCase() === 'partial' || item.enrolledSubjects.some(s => s.feeStatus.toLowerCase() === 'pending');
        }
        return item.feeStatus.toLowerCase() === statusLower;
      });
    }

    if (grade && grade !== 'All') {
      filteredActivities = filteredActivities.filter(item => 
        item.grade.toLowerCase() === grade.toLowerCase()
      );
    }

    if (subject && subject !== 'All') {
      const subLower = subject.trim().toLowerCase();
      filteredActivities = filteredActivities.filter(item =>
        item.enrolledSubjects.some(s => (s.subjectName || '').trim().toLowerCase() === subLower)
      );
    }

    // 6. Global Metrics & Statistics
    const totalStudents = studentActivities.length;
    const paidCount = studentActivities.filter(s => s.feeStatus === 'Paid' || s.enrolledSubjects.some(es => es.feeStatus === 'Paid')).length;
    const pendingCount = totalStudents - studentActivities.filter(s => s.feeStatus === 'Paid').length;
    const onlineCount = studentActivities.filter(s => s.primaryMode === 'Online' || s.primaryMode === 'Hybrid' || s.enrolledSubjects.some(es => es.classType === 'Online')).length;
    const physicalCount = studentActivities.filter(s => s.primaryMode === 'Physical' || s.primaryMode === 'Hybrid' || s.enrolledSubjects.some(es => es.classType === 'Physical')).length;

    const avgClassAttendance = totalStudents > 0 
      ? Math.round(studentActivities.reduce((acc, s) => acc + s.classAttendance.rate, 0) / totalStudents) 
      : 0;

    const avgExamAttendance = totalStudents > 0 
      ? Math.round(studentActivities.reduce((acc, s) => acc + s.examAttendance.rate, 0) / totalStudents) 
      : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        paidCount,
        pendingCount,
        onlineCount,
        physicalCount,
        avgClassAttendance,
        avgExamAttendance
      },
      count: filteredActivities.length,
      data: filteredActivities
    });
  } catch (error) {
    console.error('Error fetching student activities:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve student activities'
    });
  }
};

// @desc    Get detailed individual student activity logs (class attendance history, exam history, payment history)
// @route   GET /api/student-activities/:id
// @access  Private
export const getStudentActivityById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentIdNum = student.studentId;
    const studentMongoId = student._id.toString();

    // 1. Class attendance sessions (Attempts)
    const attempts = await Attempt.find({
      $or: [
        { studentId: studentIdNum },
        { studentName: student.name }
      ]
    })
      .populate({
        path: 'classId',
        populate: [
          { path: 'subjectId', select: 'name' },
          { path: 'teacherId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    // 2. Exam attendance & results
    const exams = await Exam.find({
      $or: [
        { studentId: student._id },
        { studentIdNumber: studentIdNum }
      ]
    }).sort({ examDate: -1 });

    const marks = await Marks.find({ studentId: student._id })
      .populate('subjects.subjectId', 'name')
      .sort({ createdAt: -1 });

    // 3. Payment history
    const payments = await Payment.find({
      $or: [
        { studentId: student._id },
        { studentIdNumber: studentIdNum }
      ]
    })
      .populate('subjects', 'name')
      .sort({ paymentDate: -1 });

    // Map teacher to subject for attempts without explicit subject
    const teacherToSubjectMap = {};
    if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      student.enrolledSubjects.forEach(es => {
        if (es.teacherName && es.subjectName) {
          teacherToSubjectMap[es.teacherName.trim().toLowerCase()] = es.subjectName;
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          studentId: student.studentId,
          name: student.name,
          grade: student.grade,
          gender: student.gender,
          contact: student.guardianTelephone || student.mobile,
          enrolledSubjects: student.enrolledSubjects || [],
          paymentStatus: student.paymentStatus || 'Pending'
        },
        classSessions: attempts.map(a => {
          const teacherName = a.classId?.teacherId?.name || '';
          const teacherLower = teacherName.trim().toLowerCase();
          const mappedSub = teacherToSubjectMap[teacherLower];
          const subName = a.classId?.subjectId?.name || mappedSub || student.subject || 'Class';

          return {
            _id: a._id,
            date: a.classId?.date || a.createdAt,
            time: a.classId?.time || `${a.classId?.startTime || ''} - ${a.classId?.endTime || ''}`,
            subjectName: subName,
            teacherName: teacherName,
            status: a.attendance || 'pending',
            markedAt: a.attendanceMarkedAt || null
          };
        }),
        examSessions: exams.map(e => ({
          _id: e._id,
          examName: e.examName,
          subject: e.subject || (e.exams?.[0]?.subjectName) || 'Assessment',
          examDate: e.examDate,
          examTime: e.examTime,
          examHall: e.examHall,
          attendance: e.attendance || 'Pending'
        })),
        marksHistory: marks,
        paymentHistory: payments.map(p => ({
          _id: p._id,
          month: p.month,
          totalAmount: p.totalAmount,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          subjects: p.subjects?.map(s => s.name).join(', ') || student.subject
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching student activity details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve student activity details'
    });
  }
};

// @desc    Mark individual student class attendance
// @route   POST /api/student-activities/mark-attendance
// @access  Private
export const markStudentAttendance = async (req, res) => {
  try {
    const {
      studentId,
      studentMongoId,
      sessionDate,
      classMode,
      status, // 'Present', 'Late', 'Absent'
      subjectName,
      subjectId
    } = req.body;

    if (!studentId && !studentMongoId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findOne({
      $or: [
        ...(studentMongoId && mongoose.Types.ObjectId.isValid(studentMongoId) ? [{ _id: studentMongoId }] : []),
        ...(studentId ? [{ studentId: studentId }] : [])
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const isReset = !status || status.toLowerCase() === 'reset' || status.toLowerCase() === 'pending';
    const normalizedDate = sessionDate || new Date().toISOString().split('T')[0];
    const targetMode = classMode || student.classType || 'Physical';

    // 1. Locate Subject
    let resolvedSubjectId = subjectId;
    if (!resolvedSubjectId && subjectName) {
      const foundSub = await Subject.findOne({ name: { $regex: new RegExp(`^${subjectName.trim()}$`, 'i') } });
      if (foundSub) resolvedSubjectId = foundSub._id;
    }
    if (!resolvedSubjectId && student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      resolvedSubjectId = student.enrolledSubjects[0].subjectId;
    }

    if (isReset) {
      const studentNameClean = student.name ? student.name.trim() : '';
      const subNameClean = (subjectName || '').trim().toLowerCase();

      // Find attempts matching this student
      const studentAttempts = await Attempt.find({
        $or: [
          { studentName: studentNameClean },
          { studentId: student.studentId }
        ]
      }).populate('classId');

      for (const att of studentAttempts) {
        let matchesSub = false;
        if (att.subjectName && subNameClean && att.subjectName.trim().toLowerCase() === subNameClean) {
          matchesSub = true;
        } else if (att.classId) {
          const cSubId = att.classId.subjectId?.toString();
          if (resolvedSubjectId && cSubId && cSubId === resolvedSubjectId.toString()) {
            matchesSub = true;
          }
        } else if (!subjectName) {
          matchesSub = true;
        }

        if (matchesSub) {
          att.attendance = 'pending';
          att.attendanceMarkedAt = null;
          await att.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: `Attendance reset to Pending (0 marked) for ${student.name}`,
        data: {
          studentId: student.studentId,
          studentName: student.name,
          subject: subjectName,
          status: 'Pending'
        }
      });
    }

    const normalizedStatus = status.toLowerCase();
    const mappedAttendance = normalizedStatus === 'present' ? 'attended' : (normalizedStatus === 'late' ? 'late' : 'absent');

    // 2. Locate or create a Class session for this date & subject
    let targetClass = null;
    if (resolvedSubjectId) {
      targetClass = await Class.findOne({
        subjectId: resolvedSubjectId,
        date: normalizedDate,
        isDeleted: { $ne: true }
      });

      if (!targetClass) {
        const baseClass = await Class.findOne({ subjectId: resolvedSubjectId });
        let resolvedTeacherId = baseClass?.teacherId;
        if (!resolvedTeacherId) {
          const emp = await Employee.findOne();
          resolvedTeacherId = emp?._id;
        }

        targetClass = new Class({
          subjectId: resolvedSubjectId,
          teacherId: resolvedTeacherId,
          date: normalizedDate,
          time: '08:30 AM',
          startTime: '08:30',
          endTime: '10:30',
          status: 'completed',
          isDeleted: false
        });
        await targetClass.save();
      }
    } else {
      targetClass = await Class.findOne({ isDeleted: { $ne: true } });
    }

    if (!targetClass) {
      return res.status(400).json({
        success: false,
        message: 'Could not associate attendance with a class session'
      });
    }

    // 3. Find or create Attempt
    let attempt = await Attempt.findOne({
      classId: targetClass._id,
      $or: [
        { studentId: student.studentId },
        { studentName: student.name }
      ]
    });

    if (!attempt) {
      attempt = new Attempt({
        classId: targetClass._id,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email || '',
        status: mappedAttendance === 'absent' ? 'left' : 'active',
        attendance: mappedAttendance,
        attendanceMarkedAt: new Date(),
        sessionDate: normalizedDate,
        classMode: targetMode,
        subjectName: subjectName || student.subject || 'Class'
      });
    } else {
      attempt.attendance = mappedAttendance;
      attempt.attendanceMarkedAt = new Date();
      attempt.status = mappedAttendance === 'absent' ? 'left' : 'active';
      attempt.sessionDate = normalizedDate;
      attempt.classMode = targetMode;
      attempt.subjectName = subjectName || attempt.subjectName;
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status || 'Present'} for ${student.name}`,
      data: {
        attemptId: attempt._id,
        studentId: student.studentId,
        studentName: student.name,
        subject: subjectName,
        sessionDate: normalizedDate,
        status: status || 'Present',
        classMode: targetMode
      }
    });
  } catch (error) {
    console.error('Error marking student attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance'
    });
  }
};

// @desc    Mark student exam attendance
// @route   POST /api/student-activities/mark-exam-attendance
// @access  Private
export const markStudentExamAttendance = async (req, res) => {
  try {
    const {
      studentId,
      studentMongoId,
      examName,
      subjectName,
      subjectId,
      examDate,
      examHall,
      status // 'Present', 'Late', 'Absent', 'Reset', 'Pending'
    } = req.body;

    if (!studentId && !studentMongoId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findOne({
      $or: [
        ...(studentMongoId && mongoose.Types.ObjectId.isValid(studentMongoId) ? [{ _id: studentMongoId }] : []),
        ...(studentId ? [{ studentId: studentId }] : [])
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const isReset = !status || status.toLowerCase() === 'reset' || status.toLowerCase() === 'pending';
    const normalizedDate = examDate ? new Date(examDate) : new Date();
    const resolvedExamName = (examName || 'Monthly Test').trim();
    const resolvedSubject = (subjectName || student.subject || 'General Assessment').trim();

    // Find existing exam record for this student and subject
    let exam = await Exam.findOne({
      $and: [
        {
          $or: [
            { studentId: student._id },
            { studentIdNumber: student.studentId },
            { studentName: student.name }
          ]
        },
        {
          $or: [
            { subject: { $regex: new RegExp(`^${resolvedSubject}$`, 'i') } },
            { examName: { $regex: new RegExp(`^${resolvedExamName}$`, 'i') } }
          ]
        }
      ]
    });

    if (isReset) {
      if (exam) {
        exam.attendance = 'Pending';
        await exam.save();
      }
      return res.status(200).json({
        success: true,
        message: `Exam attendance reset to Pending for ${student.name}`,
        data: {
          studentId: student.studentId,
          studentName: student.name,
          subject: resolvedSubject,
          status: 'Pending'
        }
      });
    }

    const normalizedStatus = status === 'Absent' ? 'Absent' : (status === 'Late' ? 'Late' : 'Attended');

    if (exam) {
      exam.examName = resolvedExamName;
      exam.subject = resolvedSubject;
      exam.examDate = normalizedDate;
      exam.examHall = examHall || exam.examHall || 'Main Hall';
      exam.attendance = normalizedStatus;
      await exam.save();
    } else {
      exam = new Exam({
        studentId: student._id,
        studentIdNumber: student.studentId,
        studentName: student.name,
        grade: student.grade || 'Grade 9',
        subject: resolvedSubject,
        subjectId: subjectId || null,
        examName: resolvedExamName,
        examDate: normalizedDate,
        examTime: '09:00 - 11:00',
        examHall: examHall || 'Main Hall',
        teacherName: student.teacherName || '',
        attendance: normalizedStatus
      });
      await exam.save();
    }

    res.status(200).json({
      success: true,
      message: `Exam attendance marked as ${status || 'Present'} for ${student.name}`,
      data: {
        examId: exam._id,
        studentId: student.studentId,
        studentName: student.name,
        subject: resolvedSubject,
        examName: resolvedExamName,
        examDate: normalizedDate,
        attendance: normalizedStatus
      }
    });
  } catch (error) {
    console.error('Error marking student exam attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark exam attendance'
    });
  }
};
