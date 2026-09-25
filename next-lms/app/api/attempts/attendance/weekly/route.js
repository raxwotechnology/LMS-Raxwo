import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';
import Student from '@/lib/models/Student';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const studentName = searchParams.get('studentName');
    const period = searchParams.get('period') || 'weekly';

    if (!studentId && !studentName) {
      return NextResponse.json({
        success: false,
        message: 'Please provide either student ID or student name'
      }, { status: 400 });
    }

    if (period !== 'weekly' && period !== 'monthly') {
      return NextResponse.json({
        success: false,
        message: 'Period must be either "weekly" or "monthly"'
      }, { status: 400 });
    }

    await connectDB();

    let student;
    if (studentId) {
      student = await Student.findOne({ studentId });
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentId}$`, $options: 'i' } 
        });
      }
    } else if (studentName) {
      student = await Student.findOne({ 
        name: { $regex: studentName, $options: 'i' } 
      });
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentName}$`, $options: 'i' } 
        });
      }
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found. Please check the student ID or name and try again.'
      }, { status: 404 });
    }

    const now = new Date();
    let startDate, endDate;

    if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

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
          { path: 'subjectId', select: 'name' },
          { path: 'teacherId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    const attendanceBySubject = {};
    
    attempts.forEach(attempt => {
      const subjectId = attempt.classId?.subjectId?._id?.toString() || 'unknown';
      const subjectName = attempt.classId?.subjectId?.name || 'Unknown Subject';
      
      if (!attendanceBySubject[subjectId]) {
        attendanceBySubject[subjectId] = {
          subjectId,
          subjectName,
          classes: [],
          statistics: { total: 0, attended: 0, absent: 0, pending: 0 }
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

    const subjectsArray = Object.values(attendanceBySubject).sort((a, b) => 
      a.subjectName.localeCompare(b.subjectName)
    );

    const totalClasses = attempts.length;
    const attendedCount = attempts.filter(a => a.attendance === 'attended').length;
    const absentCount = attempts.filter(a => a.attendance === 'absent').length;
    const pendingCount = attempts.filter(a => a.attendance === 'pending' || !a.attendance).length;

    return NextResponse.json({
      success: true,
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email
      },
      period,
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
      data: attempts
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
