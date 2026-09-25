'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  INITIAL_COURSES,
  INITIAL_CLASSES,
  INITIAL_RESULTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS,
} from '@/lib/data';

const StudentContext = createContext(null);

// Initial state with 2 courses already enrolled (English Communication [2] and ICT Basics [3])
const initialState = {
  courses: INITIAL_COURSES,
  classes: INITIAL_CLASSES,
  enrolledCourseIds: ['2', '3'],
  // Completed lessons per course: e.g. { '2': ['e1', 'e2', 'e3', 'e4'], '3': ['i1'] }
  completedLessons: {
    '2': ['e1', 'e2', 'e3', 'e4'], // English is 100% complete (4/4)
    '3': ['i1'], // ICT is 20% complete (1/5)
  },
  attendedClassIds: ['cls-102'],
  submissions: {},
  results: INITIAL_RESULTS,
  payments: INITIAL_PAYMENTS,
  notifications: INITIAL_NOTIFICATIONS,
  toast: null,
  studentUser: {
    name: 'Kasun Perera',
    email: 'kasun.student@wisdom.lk',
    studentId: 'WIS-2026-089',
  },
};

function studentReducer(state, action) {
  switch (action.type) {
    case 'SET_STUDENT_USER':
      return { ...state, studentUser: action.payload };

    case 'ENROLL_COURSE': {
      const { courseId } = action.payload;
      if (state.enrolledCourseIds.includes(courseId)) {
        return state;
      }
      const course = state.courses.find((c) => c.id === courseId);
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Enrolled in ' + (course?.title || 'Course'),
        message: `You are now enrolled in ${course?.title || 'this course'}. Start your learning journey!`,
        date: 'Just now',
        timestamp: 'Just now',
        read: false,
        type: 'class',
      };
      return {
        ...state,
        enrolledCourseIds: [...state.enrolledCourseIds, courseId],
        notifications: [newNotif, ...state.notifications],
      };
    }

    case 'ADD_PAYMENT_AND_ENROLL': {
      const { courseId, receipt } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Payment Confirmed (' + receipt.id + ')',
        message: `Payment of Rs. ${receipt.amount.toLocaleString()} received for ${course?.title || 'course'}. Receipt generated.`,
        date: 'Just now',
        timestamp: 'Just now',
        read: false,
        type: 'payment',
      };
      const updatedEnrolled = state.enrolledCourseIds.includes(courseId)
        ? state.enrolledCourseIds
        : [...state.enrolledCourseIds, courseId];

      return {
        ...state,
        enrolledCourseIds: updatedEnrolled,
        payments: [receipt, ...state.payments],
        notifications: [newNotif, ...state.notifications],
      };
    }

    case 'TOGGLE_LESSON_COMPLETE': {
      const { courseId, lessonId } = action.payload;
      const currentCompleted = state.completedLessons[courseId] || [];
      const isAlreadyComplete = currentCompleted.includes(lessonId);

      const updatedCompleted = isAlreadyComplete
        ? currentCompleted.filter((id) => id !== lessonId)
        : [...currentCompleted, lessonId];

      const newCompletedLessons = {
        ...state.completedLessons,
        [courseId]: updatedCompleted,
      };

      // Check if course just reached 100%
      const course = state.courses.find((c) => c.id === courseId);
      let newNotifications = state.notifications;
      if (
        !isAlreadyComplete &&
        course &&
        updatedCompleted.length === (course.lessons?.length || 0)
      ) {
        newNotifications = [
          {
            id: `notif-cert-${Date.now()}`,
            title: 'Certificate Unlocked! 🎓',
            message: `Congratulations! You have completed 100% of ${course.title}. Your verified certificate is now ready for download.`,
            date: 'Just now',
            timestamp: 'Just now',
            read: false,
            type: 'result',
          },
          ...state.notifications,
        ];
      }

      return {
        ...state,
        completedLessons: newCompletedLessons,
        notifications: newNotifications,
      };
    }

    case 'RECORD_ATTENDANCE': {
      const { classId } = action.payload;
      if (state.attendedClassIds.includes(classId)) return state;

      const cls = state.classes.find((c) => c.id === classId);
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Attendance Marked',
        message: `Your attendance has been recorded for "${cls?.title || 'Live Class'}".`,
        date: 'Just now',
        timestamp: 'Just now',
        read: false,
        type: 'class',
      };

      return {
        ...state,
        attendedClassIds: [...state.attendedClassIds, classId],
        notifications: [newNotif, ...state.notifications],
      };
    }

    case 'SUBMIT_QUIZ_RESULT': {
      const { courseTitle, quizTitle, score, total } = action.payload;
      const newResult = {
        id: `res-${Date.now()}`,
        courseTitle,
        title: quizTitle,
        score,
        maxScore: total,
        mark: Math.round((score / total) * 100),
        grade: score / total >= 0.75 ? 'Distinction' : score / total >= 0.5 ? 'Credit' : 'Pass',
        date: new Date().toISOString().split('T')[0],
        type: 'Quiz',
      };

      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Quiz Scored: ' + quizTitle,
        message: `You scored ${score}/${total} (${Math.round((score / total) * 100)}%) on ${quizTitle}.`,
        date: 'Just now',
        timestamp: 'Just now',
        read: false,
        type: 'result',
      };

      return {
        ...state,
        results: [newResult, ...state.results],
        notifications: [newNotif, ...state.notifications],
      };
    }

    case 'SUBMIT_ASSIGNMENT': {
      const { courseId, assignmentDetails } = action.payload;
      return {
        ...state,
        submissions: {
          ...state.submissions,
          [courseId]: {
            ...assignmentDetails,
            submittedAt: new Date().toISOString(),
            status: 'Submitted',
          },
        },
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      const { id } = action.payload;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    }

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

export function StudentProvider({ children }) {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  // Sync user from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('student') || localStorage.getItem('studentUser');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            dispatch({ type: 'SET_STUDENT_USER', payload: parsed });
          }
        }
      } catch {
        // ignore JSON errors
      }
    }
  }, []);

  // Toast Helper
  const showToast = (message, type = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => {
      dispatch({ type: 'CLEAR_TOAST' });
    }, 3500);
  };

  // Helper: Course progress calculation
  const getCourseProgress = (courseId) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course || !course.lessons || course.lessons.length === 0) return 0;
    const completed = state.completedLessons[courseId] || [];
    return Math.min(100, Math.round((completed.length / course.lessons.length) * 100));
  };

  const isLessonCompleted = (courseId, lessonId) => {
    const completed = state.completedLessons[courseId] || [];
    return completed.includes(lessonId);
  };

  const isEnrolled = (courseId) => state.enrolledCourseIds.includes(courseId);

  const isClassAttended = (classId) => state.attendedClassIds.includes(classId);

  // Enroll for Free
  const enrollCourse = (courseId) => {
    const course = state.courses.find((c) => c.id === courseId);
    dispatch({ type: 'ENROLL_COURSE', payload: { courseId } });
    showToast(`Enrolled successfully in ${course?.title || 'course'}!`, 'success');
  };

  // Process Paid Enrollment
  const processPayment = (course, paymentDetails) => {
    if (!course) return;
    const last4 = paymentDetails?.cardNumber ? paymentDetails.cardNumber.replace(/\s+/g, '').slice(-4) : '4242';
    const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const receipt = {
      id: invoiceNum,
      courseTitle: course.title,
      amount: course.price,
      method: `Card •••• ${last4}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
    };

    dispatch({
      type: 'ADD_PAYMENT_AND_ENROLL',
      payload: { courseId: course.id, receipt },
    });

    showToast(`Payment of Rs. ${course.price.toLocaleString()} confirmed! You are now enrolled.`, 'success');
  };

  // Toggle lesson complete
  const toggleLessonComplete = (courseId, lessonId) => {
    dispatch({ type: 'TOGGLE_LESSON_COMPLETE', payload: { courseId, lessonId } });
  };

  // Attendance
  const recordAttendance = (classId) => {
    const cls = state.classes.find((c) => c.id === classId);
    dispatch({ type: 'RECORD_ATTENDANCE', payload: { classId } });
    showToast(`Attendance marked for ${cls?.title || 'Live Class'}!`, 'success');
  };

  // Quiz submission
  const submitQuiz = (courseId, courseTitle, quizTitle, score, total) => {
    dispatch({
      type: 'SUBMIT_QUIZ_RESULT',
      payload: { courseTitle, quizTitle, score, total },
    });
    showToast(`Quiz completed! Score: ${score}/${total}`, 'info');
  };

  // Assignment submission
  const submitAssignment = (courseId, assignmentId, assignmentDetails) => {
    dispatch({
      type: 'SUBMIT_ASSIGNMENT',
      payload: { courseId, assignmentDetails },
    });
  };

  // Notifications
  const markNotificationRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id } });
  };

  const markAllNotificationsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
    showToast('All notifications marked as read', 'info');
  };

  // Materials & Quiz Getters
  const getCourseMaterials = (courseId) => {
    const course = state.courses.find((c) => c.id === courseId);
    return (course?.materials || []).map((m) => ({
      ...m,
      type: m.fileType || 'PDF',
      size: m.fileSize || '2.0 MB',
    }));
  };

  const getCourseQuiz = (courseId) => {
    const course = state.courses.find((c) => c.id === courseId);
    return course?.quiz || null;
  };

  const getCourseAssignment = (courseId) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course?.assignment) return null;
    const sub = state.submissions[courseId];
    return {
      ...course.assignment,
      status: sub ? sub.status : 'Pending',
      submission: sub || null,
    };
  };

  // Enriched Courses with progress
  const coursesWithProgress = state.courses.map((course) => ({
    ...course,
    instructor: course.teacher?.name || 'Wisdom Faculty',
    lessonCount: course.lessons?.length || 0,
    progress: getCourseProgress(course.id),
  }));

  // Enrolled courses list
  const enrolledCourses = coursesWithProgress.filter((c) =>
    state.enrolledCourseIds.includes(c.id)
  );

  // Classes enriched with attended status
  const classesWithStatus = state.classes.map((c) => ({
    ...c,
    attended: state.attendedClassIds.includes(c.id),
  }));

  // Certificates list (courses completed 100%)
  const certificates = enrolledCourses
    .filter((c) => c.progress === 100)
    .map((c) => ({
      id: `CERT-WIS-${c.id}-2026`,
      courseId: c.id,
      courseTitle: c.title,
      issueDate: 'September 2026',
      instructor: c.instructor,
    }));

  // Stats
  const totalCompletedLessons = Object.values(state.completedLessons).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );
  const attendanceRate = state.classes.length > 0
    ? Math.round((state.attendedClassIds.length / state.classes.length) * 100)
    : 0;

  const stats = {
    enrolledCount: enrolledCourses.length,
    completedLessonsCount: totalCompletedLessons,
    attendanceRate,
    certificatesEarned: certificates.length,
    classesAttended: state.attendedClassIds.length,
  };

  const unreadNotificationsCount = state.notifications.filter((n) => !n.read).length;

  return (
    <StudentContext.Provider
      value={{
        studentUser: state.studentUser,
        courses: coursesWithProgress,
        enrolledCourses,
        classes: classesWithStatus,
        certificates,
        stats,
        results: state.results,
        payments: state.payments,
        notifications: state.notifications,
        unreadNotificationsCount,
        toast: state.toast,
        // Actions & Helpers
        enrollCourse,
        enrollFree: enrollCourse,
        processPayment,
        processPaymentAndEnroll: processPayment,
        toggleLessonComplete,
        isLessonCompleted,
        isEnrolled,
        recordAttendance,
        isClassAttended,
        submitQuiz,
        submitAssignment,
        markNotificationRead,
        markAllNotificationsRead,
        showToast,
        getCourseProgress,
        getCourseMaterials,
        getCourseQuiz,
        getCourseAssignment,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
