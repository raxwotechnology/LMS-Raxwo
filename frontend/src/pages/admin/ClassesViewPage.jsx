import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './ClassesViewPage.css';

const ClassesViewPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);
  const [classFormData, setClassFormData] = useState({
    date: '',
    time: '',
    startTime: '',
    endTime: '',
    classType: 'Physical'
  });
  const [attemptCounts, setAttemptCounts] = useState({});
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [activeClassIdForModal, setActiveClassIdForModal] = useState(null);
  const [selectedClassAttempts, setSelectedClassAttempts] = useState([]);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = () => {
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      setUserType(user.type || userTypeData);
    }
  };

  const fetchTeacherClasses = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Include deleted classes in view my classes
      const response = await fetch(`${API_CONFIG.API_URL}/classes?includeDeleted=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // If admin, show all classes; if teacher, filter by teacher ID
        let classList = [];
        if (userType === 'admin') {
          classList = data.data;
        } else if (currentUserId) {
          classList = data.data.filter(classItem => {
            const teacherId = classItem.teacherId?._id || classItem.teacherId;
            return teacherId?.toString() === currentUserId?.toString();
          });
        }
        setClasses(classList);
        
        // Fetch attempt counts for each class
        fetchAttemptCounts(classList);
      }
      if (!silent) setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      if (!silent) setLoading(false);
    }
  };

  const fetchAttemptCounts = async (classList) => {
    if (!classList || classList.length === 0) return;
    try {
      const results = await Promise.all(
        classList.map(async (classItem) => {
          try {
            const response = await fetch(`${API_CONFIG.API_URL}/attempts/class/${classItem._id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            if (data.success) {
              return { id: classItem._id, count: data.count || 0 };
            }
          } catch {
            // ignore network error
          }
          return { id: classItem._id, count: null };
        })
      );

      setAttemptCounts((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.count !== null) {
            next[r.id] = r.count;
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error fetching attempt counts:', err);
    }
  };

  useEffect(() => {
    if (currentUserId && userType) {
      fetchTeacherClasses();
    }
  }, [currentUserId, userType]);

  // Fast live polling for student attempt counts every 1.5 seconds
  useEffect(() => {
    if (!classes || classes.length === 0) return;
    const interval = setInterval(() => {
      fetchAttemptCounts(classes);
    }, 1500);
    return () => clearInterval(interval);
  }, [classes]);

  // Periodic silent refresh of class list every 5 seconds
  useEffect(() => {
    if (!currentUserId || !userType) return;
    const interval = setInterval(() => {
      fetchTeacherClasses(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, userType]);

  // Real-time update for break duration display
  useEffect(() => {
    const hasActiveBreak = classes.some(classItem => classItem.breakStatus === 'on_break');
    
    if (hasActiveBreak) {
      const interval = setInterval(() => {
        setCurrentTime(new Date()); // Update time every second for real-time break duration
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [classes]);

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
      showWarning('Missing Information', 'Please select date, start time, and end time.');
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
        showSuccess('Class Updated', 'Class schedule has been updated successfully.');
        setShowEditClassModal(false);
        setSelectedClassForEdit(null);
        fetchTeacherClasses(); // Refresh the list
      } else {
        showError('Update Failed', data.message || 'Failed to update class');
      }
    } catch (err) {
      console.error('Error updating class:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleStartBreak = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${selectedClassForEdit._id}/break/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedClassForEdit(data.data);
        fetchTeacherClasses(); // Refresh the list
        toastSuccess('Class break started');
      } else {
        showError('Break Error', data.message || 'Failed to start break');
      }
    } catch (err) {
      console.error('Error starting break:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleEndBreak = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${selectedClassForEdit._id}/break/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedClassForEdit(data.data);
        fetchTeacherClasses(); // Refresh the list
        toastSuccess('Class break ended');
      } else {
        showError('Break Error', data.message || 'Failed to end break');
      }
    } catch (err) {
      console.error('Error ending break:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteClass = async (classId) => {
    const confirmed = await showConfirm({
      title: 'Delete Class?',
      message: 'Are you sure you want to delete this class? It will be removed from the class list but will still appear in "View My Classes" until you remove it permanently.',
      confirmText: 'Delete',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) {
      return;
    }

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
        showSuccess('Class Deleted', data.message || 'Class deleted successfully. It will still appear in "View My Classes" until removed.');
        fetchTeacherClasses(); // Refresh the list
      } else {
        showError('Delete Failed', data.message || 'Failed to delete class');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleRemoveClass = async (classId) => {
    const confirmed = await showConfirm({
      title: 'Permanently Remove Class?',
      message: 'Are you sure you want to permanently remove this class? This action cannot be undone and all class data will be lost.',
      confirmText: 'Permanently Remove',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Class Removed', 'Class removed permanently.');
        fetchTeacherClasses(); // Refresh the list
      } else {
        showError('Remove Failed', data.message || 'Failed to remove class');
      }
    } catch (err) {
      console.error('Error removing class:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleStartClass = async (classId) => {
    const confirmed = await showConfirm({
      title: 'Start Live Class?',
      message: 'Are you sure you want to start this class? Students will now be able to see and join this class live.',
      confirmText: 'Start Class',
      confirmBtnColor: '#16a34a',
      icon: '▶'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Class Started', 'Class is now LIVE! Students can now view and join this class.');
        fetchTeacherClasses(); // Refresh the list
      } else {
        showError('Start Failed', data.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const handleCloseClass = async (classId) => {
    const confirmed = await showConfirm({
      title: 'End Class & Finalize Attendance?',
      message: 'Are you sure you want to close this class? Attendance will be marked for all active students. Students who left will be marked as absent.',
      confirmText: 'End Class',
      confirmBtnColor: '#dc2626',
      icon: '!'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Class Closed', data.attendance?.message || 'Class closed successfully. Attendance has been marked.');
        fetchTeacherClasses(); // Refresh the list
        if (showEditClassModal) {
          setShowEditClassModal(false);
        }
      } else {
        showError('Close Failed', data.message || 'Failed to close class');
      }
    } catch (err) {
      console.error('Error closing class:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to format duration
  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds === 0) return '0 min';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  // Calculate current break duration if on break
  const getCurrentBreakDuration = (classItem) => {
    if (classItem.breakStatus === 'on_break' && classItem.breakStartTime) {
      const startTime = new Date(classItem.breakStartTime);
      return formatDuration(currentTime - startTime);
    }
    return null;
  };

  // Get total break duration
  const getTotalBreakDuration = (classItem) => {
    if (classItem.totalBreakDuration) {
      return formatDuration(classItem.totalBreakDuration);
    }
    return '0 min';
  };

  // Helper to fetch and refresh attempts for a class
  const refreshClassAttempts = async (classId, silent = false) => {
    if (!silent) setLoadingAttempts(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/attempts/class/${classId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const sortedAttempts = [...data.data].sort((a, b) => {
          if (a.attendance === 'attended' && b.attendance !== 'attended') return -1;
          if (a.attendance !== 'attended' && b.attendance === 'attended') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setSelectedClassAttempts(sortedAttempts);
      } else if (!silent) {
        showError('Fetch Failed', data.message || 'Failed to fetch attempts');
      }
    } catch (err) {
      if (!silent) {
        console.error('Error fetching attempts:', err);
        showError('Network Error', 'Network error. Please try again.');
      }
    } finally {
      if (!silent) setLoadingAttempts(false);
    }
  };

  // View student attempts for a class
  const handleViewAttempts = async (classId) => {
    setActiveClassIdForModal(classId);
    setShowAttemptsModal(true);
    setSelectedClassAttempts([]);
    setSelectedClassInfo(null);

    const classInfo = classes.find(c => (c._id?.toString() === classId?.toString()));
    if (classInfo) {
      setSelectedClassInfo(classInfo);
    }

    await refreshClassAttempts(classId, false);
  };

  const handleCloseAttemptsModal = () => {
    setShowAttemptsModal(false);
    setActiveClassIdForModal(null);
    setSelectedClassAttempts([]);
    setSelectedClassInfo(null);
  };

  // Live polling for attempts modal when opened - refreshes every 1.5 seconds
  useEffect(() => {
    if (!showAttemptsModal || !activeClassIdForModal) return;
    const interval = setInterval(() => {
      refreshClassAttempts(activeClassIdForModal, true);
    }, 1500);
    return () => clearInterval(interval);
  }, [showAttemptsModal, activeClassIdForModal]);

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

  // Generate class attendance report (PDF)
  const handleGenerateClassAttendanceReport = () => {
    if (!selectedClassAttempts || selectedClassAttempts.length === 0 || !selectedClassInfo) {
      showWarning('No Attendance Data', 'No attendance data available to generate report.');
      return;
    }

    const subjectName = selectedClassInfo.subjectId?.name || 'Unknown Subject';
    const teacherName = selectedClassInfo.teacherId?.name || 'Unknown Teacher';
    const classDate = selectedClassInfo.date || 'N/A';
    const classTime = selectedClassInfo.time || 'N/A';
    const classStatus = selectedClassInfo.status || 'N/A';

    // Calculate statistics
    const totalStudents = selectedClassAttempts.length;
    const attendedCount = selectedClassAttempts.filter(a => a.attendance === 'attended').length;
    const absentCount = selectedClassAttempts.filter(a => a.attendance === 'absent').length;
    const pendingCount = selectedClassAttempts.filter(a => a.attendance === 'pending' || !a.attendance).length;

    const rows = selectedClassAttempts.map((attempt) => [
      attempt.studentId || 'N/A',
      attempt.studentName || 'N/A',
      attempt.studentEmail || 'N/A',
      formatDateTime(attempt.createdAt),
      attempt.attendance ? (attempt.attendance.charAt(0).toUpperCase() + attempt.attendance.slice(1)) : 'Attended'
    ]);

    const sanitizedBase = `Class_Attendance_${subjectName}_${classDate}_${new Date().toISOString().slice(0, 10)}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    generatePdfReport({
      title: 'Class Attendance & Participation Report',
      subtitle: `${subjectName} • ${teacherName} • ${classDate} (${classTime})`,
      filename: `${sanitizedBase}.pdf`,
      headers: ['Student ID', 'Student Name', 'Email Address', 'Attempted Time', 'Attendance Status'],
      rows,
      filterInfo: [
        { label: 'Subject', value: subjectName },
        { label: 'Teacher', value: teacherName },
        { label: 'Schedule', value: `${classDate} at ${classTime}` },
        { label: 'Class Status', value: classStatus }
      ],
      summaryCards: [
        { label: 'Total Enrolled', value: totalStudents },
        { label: 'Attended', value: attendedCount, color: 'green' },
        { label: 'Absent', value: absentCount, color: 'red' },
        { label: 'Pending', value: pendingCount }
      ]
    });
    toastSuccess('Attendance PDF report downloaded successfully');
  };

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return classes;
    }
    return classes.filter((classItem) => {
      const subjectName = classItem.subjectId?.name || '';
      const teacherName = classItem.teacherId?.name || '';
      const date = classItem.date || '';
      const status = classItem.status || '';
      return [subjectName, teacherName, date, status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [classes, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredClasses.length) {
      showWarning('No Classes', 'No classes available to generate a report.');
      return;
    }

    const headers = [
      'Subject',
      'Teacher',
      'Date',
      'Time',
      'Status',
      'Break Status',
      'Total Break Duration',
      'Students Attempted'
    ];

    const rows = filteredClasses.map((classItem) => [
      classItem.subjectId?.name || '',
      classItem.teacherId?.name || '',
      classItem.date || '',
      classItem.time || '',
      classItem.status || '',
      classItem.breakStatus || 'none',
      getTotalBreakDuration(classItem),
      attemptCounts[classItem._id] || 0
    ]);

    const completedClasses = filteredClasses.filter(c => c.status === 'completed').length;
    const activeClasses = filteredClasses.filter(c => c.status !== 'completed').length;

    generatePdfReport({
      title: 'Class Schedule & Monitoring Report',
      subtitle: 'Wisdom Institute of Higher Education • Official Academic Class Directory',
      filename: `classes-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'landscape',
      filterInfo: [
        ...(searchTerm ? [{ label: 'Search Query', value: searchTerm }] : [])
      ],
      summaryCards: [
        { label: 'Total Classes', value: filteredClasses.length },
        { label: 'Completed', value: completedClasses, color: 'green' },
        { label: 'Active / Scheduled', value: activeClasses }
      ]
    });
    toastSuccess('Classes PDF report downloaded successfully');
  };

  return (
    <div className="classes-view-page">
      <Sidebar />
      <div className="classes-view-main-content">
        <Topbar userName={userType === 'admin' ? 'Wisdom Admin' : 'Teacher'} />
        
        <div className="classes-view-content">
          <div className="classes-view-header">
            <div>
              <h1>My Started Classes</h1>
              <p className="classes-view-subtitle">
                View and manage all classes you have started
              </p>
            </div>
            <div className="classes-header-actions">
              <div className="classes-search">
                <input
                  type="text"
                  placeholder="Search by subject, teacher, or date"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className="report-btn"
                onClick={handleGenerateReport}
                disabled={filteredClasses.length === 0}
              >
                Generate Report
              </button>
              <button
                type="button"
                className="refresh-btn"
                onClick={() => fetchTeacherClasses()}
                title="Refresh classes and attendance"
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#0369A1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ↻ Refresh
              </button>
              <button className="back-btn" onClick={() => navigate('/admin/class')}>
                Back to Classes
              </button>
            </div>
          </div>

          <div className="classes-table-container">
            {loading ? (
              <div className="empty-state">
                <p>Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="empty-state">
                <p>No classes started yet.</p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="empty-state">
                <p>No classes match your search.</p>
              </div>
            ) : (
              <table className="class-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Mode</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Break Status</th>
                    <th>Break Time</th>
                    <th>Students Attempted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((classItem) => {
                    const currentBreakDuration = getCurrentBreakDuration(classItem);
                    const totalBreakDuration = getTotalBreakDuration(classItem);
                    
                    return (
                      <tr key={classItem._id}>
                        <td className="class-name">{classItem.subjectId?.name || 'N/A'}</td>
                        <td>
                          <span className={`mode-badge ${(classItem.classType || 'Physical').toLowerCase()}`}>
                            {classItem.classType === 'Online' ? '🌐 Online' : '🏫 Physical'}
                          </span>
                        </td>
                        <td>{classItem.date}</td>
                        <td>{classItem.time}</td>
                        <td>
                          <span className={`class-status-badge status-${classItem.status}`}>
                            {classItem.status}
                          </span>
                        </td>
                        <td>
                          {classItem.breakStatus && classItem.breakStatus !== 'none' ? (
                            <span className={`break-status-badge break-${classItem.breakStatus === 'on_break' ? 'on-break' : 'class-starting'}`}>
                              {classItem.breakStatus === 'on_break' ? 'On Break' : 'Class Starting'}
                            </span>
                          ) : (
                            <span className="break-status-badge break-none">None</span>
                          )}
                        </td>
                        <td>
                          <div className="break-time-info">
                            {currentBreakDuration ? (
                              <div>
                                <div className="break-current">
                                  Current: {currentBreakDuration}
                                </div>
                                <div className="break-total">
                                  Total: {totalBreakDuration}
                                </div>
                              </div>
                            ) : (
                              <div className="break-total">
                                Total: {totalBreakDuration}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="attempt-count-cell">
                            <span 
                              className="attempt-count-link"
                              onClick={() => handleViewAttempts(classItem._id)}
                              title="View student attempts"
                            >
                              {attemptCounts[classItem._id] || 0}
                            </span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          {classItem.isDeleted ? (
                            <div className="action-buttons-group">
                              <button 
                                className="view-attendance-btn-small"
                                onClick={() => handleViewAttempts(classItem._id)}
                                title="View Student Attendance"
                              >
                                View Attendance
                              </button>
                              <span className="class-deleted-label">Deleted</span>
                              <button 
                                className="remove-class-btn-small"
                                onClick={() => handleRemoveClass(classItem._id)}
                                title="Drop Record Permanently"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : classItem.status === 'completed' ? (
                            <div className="action-buttons-group">
                              <button 
                                className="view-attendance-btn-small"
                                onClick={() => handleViewAttempts(classItem._id)}
                                title="View Student Attendance"
                              >
                                View Attendance
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : classItem.status === 'scheduled' ? (
                            <div className="action-buttons-group">
                              <button 
                                className="start-class-btn-small"
                                onClick={() => handleStartClass(classItem._id)}
                                title="Start Class"
                              >
                                Start Class
                              </button>
                              <button 
                                className="edit-class-btn-small"
                                onClick={() => handleEditClassClick(classItem)}
                                title="Edit Class"
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons-group">
                              <button 
                                className="view-attendance-btn-small"
                                onClick={() => handleViewAttempts(classItem._id)}
                                title="View Student Attendance"
                              >
                                View Attendance
                              </button>
                              <button 
                                className="close-class-btn-small"
                                onClick={() => handleCloseClass(classItem._id)}
                                title="Close Class"
                              >
                                Close Class
                              </button>
                              <button 
                                className="edit-class-btn-small"
                                onClick={() => handleEditClassClick(classItem)}
                                title="Edit Class"
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
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
      </div>

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClassForEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Class</h2>
            <div className="modal-body">
              <div className="form-group compact-group">
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

              {selectedClassForEdit?.status !== 'completed' && (
                <div className="break-actions">
                  <h3>Break Management</h3>
                  <div className="break-buttons">
                    <button 
                      className="start-break-btn"
                      onClick={handleStartBreak}
                      disabled={selectedClassForEdit?.breakStatus === 'on_break'}
                    >
                      Start Break
                    </button>
                    <button 
                      className="end-break-btn"
                      onClick={handleEndBreak}
                      disabled={selectedClassForEdit?.breakStatus !== 'on_break'}
                    >
                      End Break
                    </button>
                  </div>
                </div>
              )}
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

      {/* Attempts Modal */}
      {showAttemptsModal && (
        <div className="modal-overlay" onClick={handleCloseAttemptsModal}>
          <div className="modal-content attempts-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Student Attendance</h2>
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#16a34a',
                  backgroundColor: '#f0fdf4',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: '1px solid #bbf7d0'
                }}
              >
                <span 
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    display: 'inline-block'
                  }} 
                />
                Live Auto-Refresh Active
              </span>
            </div>
            {selectedClassInfo && (
              <div className="class-info-header">
                <p><strong>Subject:</strong> {selectedClassInfo.subjectId?.name || 'N/A'}</p>
                <p><strong>Teacher:</strong> {selectedClassInfo.teacherId?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {selectedClassInfo.date || 'N/A'} | <strong>Time:</strong> {selectedClassInfo.time || 'N/A'}</p>
              </div>
            )}
            {loadingAttempts ? (
              <div className="empty-state">
                <p>Loading attempts...</p>
              </div>
            ) : selectedClassAttempts.length === 0 ? (
              <div className="empty-state">
                <p>No students have attempted this class yet.</p>
              </div>
            ) : (
              <div className="attempts-list">
                <table className="attempts-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Attempted Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClassAttempts.map((attempt) => (
                      <tr key={attempt._id}>
                        <td><strong>{attempt.studentId}</strong></td>
                        <td>{attempt.studentName}</td>
                        <td>{attempt.studentEmail || 'N/A'}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: attempt.attendance === 'attended' || attempt.status === 'active' ? '#e6f7ec' : '#fdeded',
                              color: attempt.attendance === 'attended' || attempt.status === 'active' ? '#1b7a4b' : '#c53030',
                              border: `1px solid ${attempt.attendance === 'attended' || attempt.status === 'active' ? '#a3e0b9' : '#f5c2c2'}`
                            }}
                          >
                            {attempt.attendance === 'attended' ? '✓ Attended' : attempt.status === 'active' ? 'Active' : attempt.status === 'left' ? 'Left' : (attempt.attendance || 'Attended')}
                          </span>
                        </td>
                        <td>{formatDateTime(attempt.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button 
                className="generate-report-btn" 
                onClick={handleGenerateClassAttendanceReport}
                disabled={!selectedClassAttempts || selectedClassAttempts.length === 0 || !selectedClassInfo}
              >
                Generate Report
              </button>
              <button
                type="button"
                className="refresh-modal-btn"
                onClick={() => {
                  const targetId = activeClassIdForModal || selectedClassInfo?._id;
                  if (targetId) refreshClassAttempts(targetId, false);
                }}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#0369A1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ↻ Refresh List
              </button>
              <button className="cancel-btn" onClick={handleCloseAttemptsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesViewPage;

