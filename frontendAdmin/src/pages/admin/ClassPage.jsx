import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './ClassPage.css';

const ClassPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'subjects'
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const navigate = useNavigate();
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);
  const [classFormData, setClassFormData] = useState({
    date: '',
    time: '',
    startTime: '',
    endTime: '',
    classType: 'Physical'
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendancePeriod, setAttendancePeriod] = useState('weekly'); // 'weekly' or 'monthly'

  const showSuccessModal = (title, message) => {
    showSuccess(title, message);
  };

  const showErrorModal = (title, message) => {
    showError(title, message);
  };

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUserInfo();
    fetchSubjects();
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (currentUserId && userType) {
      fetchAllClasses();
    }
  }, [currentUserId, userType]);

  const fetchUserInfo = () => {
    // Get current user ID and type from localStorage
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      setUserType(user.type || userTypeData);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to fetch subjects');
      setLoading(false);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        const userData = localStorage.getItem('user');
        const userTypeData = localStorage.getItem('userType');
        let parsedUser = null;
        if (userData) {
          try { parsedUser = JSON.parse(userData); } catch (e) {}
        }
        const uType = parsedUser?.type || userTypeData || userType;
        const uId = parsedUser?.id || parsedUser?._id || currentUserId;

        // Filter by teacher if not admin
        if (uType !== 'admin' && uId) {
          const filtered = data.data.filter(classItem => {
            const teacherId = classItem.teacherId?._id || classItem.teacherId;
            return teacherId?.toString() === uId?.toString();
          });
          setClasses(filtered);
        } else {
          setClasses(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const formatTimeDisplay = (startTime, endTime, rawTime) => {
    const to12h = (t) => {
      if (!t) return '';
      const parts = t.split(':');
      if (parts.length < 2) return t;
      let hour = parseInt(parts[0], 10);
      const min = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${min} ${ampm}`;
    };

    if (startTime && endTime) {
      return `${to12h(startTime)} - ${to12h(endTime)}`;
    }
    if (startTime) {
      return to12h(startTime);
    }
    if (rawTime && rawTime.includes('-')) {
      const [s, e] = rawTime.split('-');
      return `${to12h(s.trim())} - ${to12h(e.trim())}`;
    }
    return rawTime || 'N/A';
  };

  const filteredClassesList = useMemo(() => {
    const term = classSearchTerm.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter(cls => {
      const subjectName = cls.subjectId?.name || '';
      const teacherName = cls.teacherId?.name || cls.subjectId?.conductedBy?.name || '';
      const date = cls.date || '';
      const time = cls.time || '';
      const status = cls.status || '';
      return (
        subjectName.toLowerCase().includes(term) ||
        teacherName.toLowerCase().includes(term) ||
        date.toLowerCase().includes(term) ||
        time.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term)
      );
    });
  }, [classes, classSearchTerm]);

  const handleCloseClass = (classId) => {
    showConfirm({
      title: 'End Class Session?',
      message: 'Are you sure you want to end this live class? Attendance will be marked for all attending students.',
      confirmText: 'End Class',
      confirmBtnColor: '#dc2626',
      onConfirm: async () => {
        try {
          const currentToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
          const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}/close`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            }
          });

          const data = await response.json();

          if (response.ok && data.success) {
            showSuccessModal(
              'Class Ended Successfully',
              data.attendance?.message || data.message || 'Class ended and attendance recorded.'
            );
            await fetchAllClasses();
            await fetchSubjects();
          } else {
            showErrorModal('Failed to End Class', data.message || 'Failed to end class');
          }
        } catch (err) {
          console.error('Error ending class:', err);
          showErrorModal('Network Error', 'Network error. Please try again.');
        }
      }
    });
  };

  const handleStartScheduledClass = (classItem) => {
    showConfirm({
      title: 'Start Live Class?',
      message: `Are you sure you want to start the live class for "${classItem.subjectId?.name || 'Class'}"? The class will become ONGOING and students can immediately join.`,
      confirmText: 'Start Class',
      confirmBtnColor: '#16a34a',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_CONFIG.API_URL}/classes/${classItem._id}/start`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();

          if (response.ok && data.success) {
            showSuccessModal(
              'Class Started Live!',
              `The class "${classItem.subjectId?.name || 'Class'}" is now live (Ongoing). Students can now view and join this class.`
            );
            await fetchAllClasses();
            await fetchSubjects();
          } else {
            showErrorModal('Failed to Start', data.message || 'Could not start class.');
          }
        } catch (err) {
          console.error('Error starting class:', err);
          showErrorModal('Network Error', 'Network error. Please try again.');
        }
      }
    });
  };

  const handleStartClassClick = (subject) => {
    setSelectedSubject(subject);
    setShowClassModal(true);
    // Set default date to today, start time to current hour, and end time to 2 hours later
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const endNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endTimeStr = endNow.toTimeString().slice(0, 5);
    setClassFormData({
      date: dateStr,
      time: `${timeStr} - ${endTimeStr}`,
      startTime: timeStr,
      endTime: endTimeStr,
      classType: 'Physical'
    });
  };

  const handleAddNewClassClick = () => {
    const eligibleSubjects = userType === 'admin'
      ? subjects
      : subjects.filter(s => (s.conductedBy?._id || s.conductedBy)?.toString() === currentUserId?.toString());
    const initialSubject = eligibleSubjects.length > 0 ? eligibleSubjects[0] : null;

    setSelectedSubject(initialSubject);
    setShowClassModal(true);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const endNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endTimeStr = endNow.toTimeString().slice(0, 5);

    setClassFormData({
      date: dateStr,
      time: `${timeStr} - ${endTimeStr}`,
      startTime: timeStr,
      endTime: endTimeStr,
      classType: 'Physical'
    });
  };

  const handleCloseModal = () => {
    setShowClassModal(false);
    setSelectedSubject(null);
    setClassFormData({ date: '', time: '', startTime: '', endTime: '', classType: 'Physical' });
  };

  const handleStartClass = async () => {
    if (!selectedSubject || !selectedSubject._id) {
      showErrorModal('Selection Required', 'Please select a subject for the class');
      return;
    }
    if (!classFormData.date || !classFormData.startTime || !classFormData.endTime) {
      showErrorModal('Missing Information', 'Please select class date, start time, and end time');
      return;
    }

    const formattedTime = `${classFormData.startTime} - ${classFormData.endTime}`;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects/${selectedSubject._id}/start-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: classFormData.date,
          time: formattedTime,
          startTime: classFormData.startTime,
          endTime: classFormData.endTime,
          classType: classFormData.classType || 'Physical',
          status: 'scheduled'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowClassModal(false);
        setSelectedSubject(null);
        await fetchAllClasses();
        await fetchSubjects();
        setActiveTab('classes');
        showSuccessModal(
          'Class Scheduled Successfully',
          `The class for "${selectedSubject.name}" (${classFormData.classType || 'Physical'}) has been scheduled for ${classFormData.date} (${formattedTime}). It will remain as "SCHEDULED" until you click "Start Class" to make it live for students.`
        );
      } else {
        showErrorModal('Failed to Schedule', data.message || 'Failed to schedule class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      showErrorModal('Network Error', 'Network error. Please try again.');
    }
  };

  const handleViewClassesClick = () => {
    navigate('/admin/classes/view');
  };

  const handleEditClassClick = (classItem) => {
    setSelectedClassForEdit(classItem);
    const sTime = classItem.startTime || (classItem.time ? classItem.time.split('-')[0]?.trim() : '');
    const eTime = classItem.endTime || (classItem.time && classItem.time.includes('-') ? classItem.time.split('-')[1]?.trim() : '');
    setClassFormData({
      date: classItem.date,
      time: classItem.time,
      startTime: sTime,
      endTime: eTime,
      classType: classItem.classType || 'Physical'
    });
    setShowEditClassModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditClassModal(false);
    setSelectedClassForEdit(null);
    setClassFormData({ date: '', time: '', startTime: '', endTime: '', classType: 'Physical' });
  };

  const handleUpdateClass = async () => {
    if (!classFormData.date || !classFormData.startTime || !classFormData.endTime) {
      showErrorModal('Missing Information', 'Please select both date, start time, and end time');
      return;
    }

    const formattedTime = `${classFormData.startTime} - ${classFormData.endTime}`;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${selectedClassForEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: classFormData.date,
          time: formattedTime,
          startTime: classFormData.startTime,
          endTime: classFormData.endTime,
          classType: classFormData.classType || 'Physical'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowEditClassModal(false);
        setSelectedClassForEdit(null);
        await fetchAllClasses();
        await fetchSubjects();
        showSuccessModal('Class Updated', 'Class date and times updated successfully.');
      } else {
        showErrorModal('Failed to Update', data.message || 'Failed to update class');
      }
    } catch (err) {
      console.error('Error updating class:', err);
      showErrorModal('Network Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteClass = (classId) => {
    showConfirm({
      title: 'Delete Class?',
      message: 'Are you sure you want to delete this class? It will be removed from the active class list.',
      confirmText: 'Delete',
      confirmBtnColor: '#dc2626',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setClasses(prev => prev.filter(cls => cls._id !== classId));
            await fetchAllClasses();
            await fetchSubjects();
            showSuccessModal('Class Deleted', data.message || 'Class removed from list successfully.');
          } else {
            showErrorModal('Failed to Delete', data.message || 'Failed to delete class');
          }
        } catch (err) {
          console.error('Error deleting class:', err);
          showErrorModal('Network Error', 'Network error. Please try again.');
        }
      }
    });
  };

  // Check if current user can start a class for a subject
  const canStartClass = (subject) => {
    // Admins can start any class
    if (userType === 'admin') {
      return true;
    }
    
    // Teachers can only start their own classes
    const teacherId = subject.conductedBy?._id || subject.conductedBy;
    return teacherId?.toString() === currentUserId?.toString();
  };

  // Find if an active/scheduled class exists for the given subject
  const findClassForSubject = (subjectId) => {
    return classes.find(cls => 
      (cls.subjectId?._id || cls.subjectId)?.toString() === subjectId?.toString() &&
      !cls.isDeleted &&
      cls.status !== 'completed' &&
      cls.status !== 'cancelled'
    );
  };

  // Search for student weekly attendance
  const handleSearchStudentAttendance = async () => {
    if (!studentSearchTerm.trim()) {
      showErrorModal('Required Field', 'Please enter a student ID or name');
      return;
    }

    setLoadingAttendance(true);
    setStudentAttendance(null);

    try {
      const searchTerm = studentSearchTerm.trim();
      const isLikelyId = /^[A-Za-z]*\d+$/.test(searchTerm) && searchTerm.length <= 20 && !searchTerm.includes(' ');
      const queryParam = isLikelyId ? 'studentId' : 'studentName';
      
      const response = await fetch(
        `${API_CONFIG.API_URL}/attempts/attendance/weekly?${queryParam}=${encodeURIComponent(searchTerm)}&period=${attendancePeriod}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStudentAttendance(data);
        setShowAttendanceModal(true);
      } else {
        showErrorModal('No Records Found', data.message || 'Student not found or no attendance records for this period');
      }
    } catch (err) {
      console.error('Error fetching student attendance:', err);
      showErrorModal('Network Error', 'Network error. Please try again.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const refreshStudentAttendanceSilent = async () => {
    if (!studentAttendance?.student) return;
    try {
      const searchTerm = studentAttendance.student.studentId || studentAttendance.student.name;
      const queryParam = studentAttendance.student.studentId ? 'studentId' : 'studentName';
      const response = await fetch(
        `${API_CONFIG.API_URL}/attempts/attendance/weekly?${queryParam}=${encodeURIComponent(searchTerm)}&period=${attendancePeriod}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setStudentAttendance(data);
      }
    } catch {
      // silent background refresh
    }
  };

  // Live auto-refresh student attendance modal every 2 seconds
  useEffect(() => {
    if (!showAttendanceModal || !studentAttendance) return;
    const interval = setInterval(refreshStudentAttendanceSilent, 2000);
    return () => clearInterval(interval);
  }, [showAttendanceModal, studentAttendance?.student?.studentId, attendancePeriod]);

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setStudentAttendance(null);
    setStudentSearchTerm('');
  };

  // Generate attendance report (PDF)
  const handleGenerateAttendanceReport = () => {
    if (!studentAttendance) return;

    const period = attendancePeriod === 'weekly' ? 'Weekly' : 'Monthly';
    const studentName = studentAttendance.student.name;
    const studentId = studentAttendance.student.studentId;
    const dateRange = `${formatDate(studentAttendance.dateRange.start)} - ${formatDate(studentAttendance.dateRange.end)}`;

    const rows = [];
    if (studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length > 0) {
      studentAttendance.attendanceBySubject.forEach((subject) => {
        if (subject.classes && subject.classes.length > 0) {
          subject.classes.forEach((attempt) => {
            const teacher = attempt.classId?.teacherId?.name || 'N/A';
            const date = attempt.classId?.date || 'N/A';
            const time = attempt.classId?.time || 'N/A';
            const classStatus = attempt.classId?.status || 'N/A';
            const attendance = attempt.attendance === 'attended' ? 'Attended' : 
                              attempt.attendance === 'absent' ? 'Absent' : 'Pending';
            rows.push([
              subject.subjectName,
              teacher,
              date,
              time,
              classStatus,
              attendance
            ]);
          });
        }
      });
    }

    const sanitizedBase = `${period}_Attendance_${studentName}_${studentId}_${new Date().toISOString().slice(0, 10)}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    generatePdfReport({
      title: `Student ${period} Attendance Transcript`,
      subtitle: `Wisdom Institute of Higher Education • Attendance Report for ${studentName}`,
      filename: `${sanitizedBase}.pdf`,
      headers: ['Subject', 'Teacher', 'Date', 'Time', 'Class Status', 'Attendance'],
      rows,
      filterInfo: [
        { label: 'Student', value: `${studentName} (${studentId})` },
        { label: 'Period', value: `${period} (${dateRange})` }
      ],
      summaryCards: [
        { label: 'Total Scheduled', value: studentAttendance.overallStatistics.totalClasses },
        { label: 'Attended', value: studentAttendance.overallStatistics.attended, color: 'green' },
        { label: 'Absent', value: studentAttendance.overallStatistics.absent, color: 'red' },
        { label: 'Pending', value: studentAttendance.overallStatistics.pending }
      ]
    });
    toastSuccess('Student attendance PDF report downloaded successfully');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isTeacherUser = ['teacher', 'employee'].includes(userType);

  return (
    <div className="class-page">
      <Sidebar />
      <div className="class-main-content">
        <Topbar userName="Wisdom Admin" />
        
        <div className="class-content">
          <div className="class-header">
            <div>
              <h1>Class Management</h1>
              <p className="class-subtitle">
                {userType === 'admin' 
                  ? 'View all class details and manage classes' 
                  : 'View all subjects and start your assigned classes'}
              </p>
            </div>
            <div className="header-actions">
              {(userType === 'admin' || isTeacherUser) && (
                <button
                  type="button"
                  className="add-class-btn"
                  onClick={handleAddNewClassClick}
                  title="Add / Schedule a new class"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Add Class</span>
                </button>
              )}
              {(userType === 'admin' || isTeacherUser) && (
                <button className="view-classes-btn" onClick={handleViewClassesClick}>
                  View My Classes
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Student Attendance Search Section - Admin Only */}
          {userType === 'admin' && (
            <div className="student-attendance-search-section">
              <div className="attendance-search-header">
                <h2>Student Attendance</h2>
                <p className="attendance-search-subtitle">Search by student ID or name to view attendance</p>
              </div>
              <div className="attendance-search-box">
                <input
                  type="text"
                  placeholder="Enter student ID or name"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchStudentAttendance();
                    }
                  }}
                  className="attendance-search-input"
                />
                <div className="attendance-period-toggle">
                  <button
                    className={`period-btn ${attendancePeriod === 'weekly' ? 'active' : ''}`}
                    onClick={() => setAttendancePeriod('weekly')}
                  >
                    Weekly
                  </button>
                  <button
                    className={`period-btn ${attendancePeriod === 'monthly' ? 'active' : ''}`}
                    onClick={() => setAttendancePeriod('monthly')}
                  >
                    Monthly
                  </button>
                </div>
                <button
                  className="attendance-search-btn"
                  onClick={handleSearchStudentAttendance}
                  disabled={loadingAttendance || !studentSearchTerm.trim()}
                >
                  {loadingAttendance ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {/* Class Tabs: All Classes & Subjects Overview */}
          <div className="class-page-tabs">
            <button
              type="button"
              className={`class-tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              <span>All Classes</span>
              <span className="class-tab-badge">{classes.length}</span>
            </button>
            <button
              type="button"
              className={`class-tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
              onClick={() => setActiveTab('subjects')}
            >
              <span>Subjects Overview</span>
              <span className="class-tab-badge">{subjects.length}</span>
            </button>
          </div>

          {activeTab === 'classes' ? (
            <div>
              <div className="classes-toolbar">
                <input
                  type="text"
                  placeholder="Search classes by subject, teacher, date..."
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                  className="classes-search-input"
                />
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                  Showing {filteredClassesList.length} of {classes.length} classes
                </div>
              </div>

              <div className="class-table-container">
                {loading ? (
                  <div className="empty-state">
                    <p>Loading classes...</p>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                    <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      No classes added yet.
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                      Click the "+ Add Class" button above to schedule your first class.
                    </p>
                    <button
                      type="button"
                      className="add-class-btn"
                      onClick={handleAddNewClassClick}
                    >
                      + Add Class
                    </button>
                  </div>
                ) : filteredClassesList.length === 0 ? (
                  <div className="empty-state">
                    <p>No classes match your search query "{classSearchTerm}".</p>
                  </div>
                ) : (
                  <table className="class-table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Conducted By</th>
                        <th>Class Mode</th>
                        <th>Class Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassesList.map((classItem) => {
                        const teacherName = classItem.teacherId?.name || classItem.subjectId?.conductedBy?.name || 'N/A';
                        const isTeacherForThisClass = (classItem.teacherId?._id || classItem.teacherId)?.toString() === currentUserId?.toString();
                        const canEdit = userType === 'admin' || isTeacherForThisClass;

                        return (
                          <tr key={classItem._id}>
                            <td className="class-name">
                              <strong>{classItem.subjectId?.name || 'N/A'}</strong>
                            </td>
                            <td className="conducted-by">{teacherName}</td>
                            <td>
                              <span className={`mode-badge ${(classItem.classType || 'Physical').toLowerCase()}`}>
                                {classItem.classType === 'Online' ? '🌐 Online' : '🏫 Physical'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500 }}>{classItem.date || 'N/A'}</td>
                            <td style={{ fontWeight: 500, color: '#1f2937' }}>
                              {formatTimeDisplay(classItem.startTime, classItem.endTime, classItem.time)}
                            </td>
                            <td>
                              <span className={`status-badge ${classItem.status || 'scheduled'}`}>
                                {classItem.status || 'scheduled'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              {canEdit ? (
                                <>
                                  {classItem.status === 'scheduled' && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartScheduledClass(classItem)}
                                      title="Start live class now"
                                      style={{
                                        padding: '0.4rem 0.8rem',
                                        backgroundColor: '#16a34a',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                      </svg>
                                      <span>Start Class</span>
                                    </button>
                                  )}
                                  <button
                                    className="edit-class-btn-small"
                                    onClick={() => handleEditClassClick(classItem)}
                                    title="Update Class Date & Time"
                                  >
                                    Update
                                  </button>
                                  {classItem.status === 'ongoing' && (
                                    <button
                                      type="button"
                                      className="delete-class-btn-small"
                                      onClick={() => handleCloseClass(classItem._id)}
                                      title="End this live class"
                                    >
                                      End Class
                                    </button>
                                  )}
                                  <button
                                    style={{
                                      padding: '0.4rem 0.75rem',
                                      backgroundColor: '#ef4444',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleDeleteClass(classItem._id)}
                                    title="Delete class from list"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <span className="no-access-message">View Only</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="class-table-container">
              {loading ? (
                <div className="empty-state">
                  <p>Loading subjects...</p>
                </div>
              ) : subjects.length === 0 ? (
                <div className="empty-state">
                  <p>No subjects added yet.</p>
                </div>
              ) : (
                <table className="class-table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Conducted By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => {
                      const canStart = canStartClass(subject);
                      const isTeacherForThisClass = (subject.conductedBy?._id || subject.conductedBy)?.toString() === currentUserId?.toString();
                      const existingClass = findClassForSubject(subject._id);
                      const canEdit = userType === 'admin' || isTeacherForThisClass;
                      
                      return (
                        <tr key={subject._id}>
                          <td className="class-name">{subject.name}</td>
                          <td className="conducted-by">{subject.conductedBy?.name || 'N/A'}</td>
                          <td className="actions-cell">
                            {existingClass ? (
                              <>
                                <span className="class-started-label">Class Started</span>
                                {canEdit && existingClass && (
                                  <>
                                    <button 
                                      className="edit-class-btn-small"
                                      onClick={() => handleEditClassClick(existingClass)}
                                      title="Update Class"
                                    >
                                      Update
                                    </button>
                                    <button 
                                      type="button"
                                      className="delete-class-btn-small"
                                      onClick={() => handleCloseClass(existingClass._id)}
                                      title="End Class"
                                    >
                                      End Class
                                    </button>
                                  </>
                                )}
                                {canStart && (
                                  <button
                                    type="button"
                                    className="start-class-btn"
                                    onClick={() => handleStartClassClick(subject)}
                                    title="Add another session for this subject"
                                    style={{ marginLeft: '4px', padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    + Add Class
                                  </button>
                                )}
                              </>
                            ) : canStart ? (
                              <button 
                                className="start-class-btn"
                                onClick={() => handleStartClassClick(subject)}
                                title={userType === 'admin' ? 'Admin can add and start any class' : 'Add and start this class'}
                              >
                                + Add Class
                              </button>
                            ) : userType === 'admin' ? (
                              <span className="no-access-message">Not Assigned Teacher</span>
                            ) : (
                              <span className="no-access-message">Not Your Class</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Class Schedule Modal */}
      {showClassModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add & Schedule Class</h2>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="select-subject">Select Subject *</label>
                <select
                  id="select-subject"
                  value={selectedSubject?._id || ''}
                  onChange={(e) => {
                    const found = subjects.find(s => s._id === e.target.value);
                    setSelectedSubject(found || null);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">-- Choose Subject --</option>
                  {(userType === 'admin'
                    ? subjects
                    : subjects.filter(s => (s.conductedBy?._id || s.conductedBy)?.toString() === currentUserId?.toString())
                  ).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.conductedBy?.name ? `(${s.conductedBy.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Conducted By</label>
                <input 
                  type="text" 
                  value={selectedSubject?.conductedBy?.name || 'N/A'} 
                  disabled 
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Class Mode *</label>
                <div className="class-mode-toggle-group">
                  <button
                    type="button"
                    className={`class-mode-toggle-btn ${classFormData.classType === 'Physical' ? 'active' : ''}`}
                    onClick={() => setClassFormData({ ...classFormData, classType: 'Physical' })}
                  >
                    <span className="mode-toggle-icon">🏫</span>
                    <span>Physical Class</span>
                  </button>
                  <button
                    type="button"
                    className={`class-mode-toggle-btn ${classFormData.classType === 'Online' ? 'active' : ''}`}
                    onClick={() => setClassFormData({ ...classFormData, classType: 'Online' })}
                  >
                    <span className="mode-toggle-icon">🌐</span>
                    <span>Online Class</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="date">Class Date *</label>
                <input
                  type="date"
                  id="date"
                  value={classFormData.date}
                  onChange={(e) => setClassFormData({ ...classFormData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Class Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    value={classFormData.startTime || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">Class End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    value={classFormData.endTime || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleStartClass}>
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClassForEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Class</h2>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject Name</label>
                <input 
                  type="text" 
                  value={selectedClassForEdit.subjectId?.name || 'N/A'} 
                  disabled 
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Class Mode *</label>
                <div className="class-mode-toggle-group">
                  <button
                    type="button"
                    className={`class-mode-toggle-btn ${classFormData.classType === 'Physical' ? 'active' : ''}`}
                    onClick={() => setClassFormData({ ...classFormData, classType: 'Physical' })}
                  >
                    <span className="mode-toggle-icon">🏫</span>
                    <span>Physical Class</span>
                  </button>
                  <button
                    type="button"
                    className={`class-mode-toggle-btn ${classFormData.classType === 'Online' ? 'active' : ''}`}
                    onClick={() => setClassFormData({ ...classFormData, classType: 'Online' })}
                  >
                    <span className="mode-toggle-icon">🌐</span>
                    <span>Online Class</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-date">Class Date *</label>
                <input
                  type="date"
                  id="edit-date"
                  value={classFormData.date}
                  onChange={(e) => setClassFormData({ ...classFormData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-startTime">Class Start Time *</label>
                  <input
                    type="time"
                    id="edit-startTime"
                    value={classFormData.startTime || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-endTime">Class End Time *</label>
                  <input
                    type="time"
                    id="edit-endTime"
                    value={classFormData.endTime || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseEditModal}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleUpdateClass}>
                Update Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Attendance Modal */}
      {showAttendanceModal && studentAttendance && (
        <div className="modal-overlay" onClick={handleCloseAttendanceModal}>
          <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{attendancePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Attendance - {studentAttendance.student.name}</h2>
            <div className="attendance-student-info">
              <p><strong>Student ID:</strong> {studentAttendance.student.studentId}</p>
              <p><strong>Email:</strong> {studentAttendance.student.email}</p>
              <p><strong>Period:</strong> {formatDate(studentAttendance.dateRange.start)} - {formatDate(studentAttendance.dateRange.end)}</p>
            </div>
            
            <div className="attendance-statistics">
              <div className="stat-card">
                <div className="stat-value">{studentAttendance.overallStatistics.totalClasses}</div>
                <div className="stat-label">Total Classes</div>
              </div>
              <div className="stat-card stat-attended">
                <div className="stat-value">{studentAttendance.overallStatistics.attended}</div>
                <div className="stat-label">Attended</div>
              </div>
              <div className="stat-card stat-absent">
                <div className="stat-value">{studentAttendance.overallStatistics.absent}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card stat-pending">
                <div className="stat-value">{studentAttendance.overallStatistics.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div className="attendance-list-container">
              {studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length === 0 ? (
                <div className="empty-state">
                  <p>No attendance records for this {attendancePeriod}.</p>
                </div>
              ) : (
                <div className="attendance-by-subject">
                  {studentAttendance.attendanceBySubject.map((subject) => (
                    <div key={subject.subjectId} className="subject-attendance-group">
                      <div className="subject-header">
                        <h3 className="subject-name">{subject.subjectName}</h3>
                        <div className="subject-stats">
                          <span className="subject-stat-item">
                            <strong>Total:</strong> {subject.statistics.total}
                          </span>
                          <span className="subject-stat-item stat-attended">
                            <strong>Attended:</strong> {subject.statistics.attended}
                          </span>
                          <span className="subject-stat-item stat-absent">
                            <strong>Absent:</strong> {subject.statistics.absent}
                          </span>
                          <span className="subject-stat-item stat-pending">
                            <strong>Pending:</strong> {subject.statistics.pending}
                          </span>
                        </div>
                      </div>
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.classes.map((attempt) => (
                            <tr key={attempt._id}>
                              <td>{attempt.classId?.teacherId?.name || 'N/A'}</td>
                              <td>{attempt.classId?.date || 'N/A'}</td>
                              <td>{attempt.classId?.time || 'N/A'}</td>
                              <td>
                                <span className={`class-status-badge status-${attempt.classId?.status || 'unknown'}`}>
                                  {attempt.classId?.status || 'N/A'}
                                </span>
                              </td>
                              <td>
                                {attempt.attendance ? (
                                  <span className={`attendance-badge attendance-${attempt.attendance}`}>
                                    {attempt.attendance === 'attended' ? 'Attended' : 
                                     attempt.attendance === 'absent' ? 'Absent' : 'Pending'}
                                  </span>
                                ) : (
                                  <span className="attendance-badge attendance-pending">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="generate-report-btn" 
                onClick={handleGenerateAttendanceReport}
                disabled={!studentAttendance || (studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length === 0)}
              >
                Generate Report
              </button>
              <button className="cancel-btn" onClick={handleCloseAttendanceModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassPage;

