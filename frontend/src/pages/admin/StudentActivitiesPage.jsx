import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { authenticatedFetch } from '../../utils/apiHelper';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './StudentActivitiesPage.css';

const StudentActivitiesPage = () => {
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    paidCount: 0,
    pendingCount: 0,
    onlineCount: 0,
    physicalCount: 0,
    avgClassAttendance: 0,
    avgExamAttendance: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [selectedClassType, setSelectedClassType] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');

  const isAnyFilterActive = Boolean(
    searchTerm.trim() ||
    selectedSubject !== 'All' ||
    selectedGrade !== 'All' ||
    selectedTeacher !== 'All' ||
    selectedClassType !== 'All' ||
    selectedPaymentStatus !== 'All'
  );

  // Detail Modal State
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [modalDetails, setModalDetails] = useState(null);
  const [loadingModalDetails, setLoadingModalDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'exams' | 'fees'

  // Mark Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('class'); // 'class' | 'exam'
  const [attendanceTargetStudent, setAttendanceTargetStudent] = useState(null);
  const [attendanceTargetSubject, setAttendanceTargetSubject] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceMode, setAttendanceMode] = useState('Physical');
  const [selectedAssignedExamId, setSelectedAssignedExamId] = useState('');
  const [attendanceExamName, setAttendanceExamName] = useState('');
  const [attendanceExamHall, setAttendanceExamHall] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('Present'); // 'Present' | 'Late' | 'Absent' | null
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${API_CONFIG.API_URL}/student-activities`);
      const result = await response.json();
      if (response.ok && result.success) {
        setActivities(result.data || []);
        if (result.metrics) {
          setMetrics(result.metrics);
        }
      } else {
        showError('Failed to load activities', result.message || 'Could not fetch student activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      showError('Network Error', 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters back to default values
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSubject('All');
    setSelectedGrade('All');
    setSelectedTeacher('All');
    setSelectedClassType('All');
    setSelectedPaymentStatus('All');
  };

  // Refresh data and reset all filters
  const handleRefresh = async () => {
    handleResetFilters();
    await fetchActivities();
    showSuccess('Refreshed', 'Activity data and filters refreshed successfully');
  };

  // Open detailed activity history modal
  const handleOpenDetailModal = async (studentActivity) => {
    setSelectedStudentForModal(studentActivity);
    setActiveTab('classes');
    setLoadingModalDetails(true);
    try {
      const response = await authenticatedFetch(
        `${API_CONFIG.API_URL}/student-activities/${studentActivity._id}`
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setModalDetails(result.data);
      } else {
        setModalDetails(null);
      }
    } catch (err) {
      console.error('Error fetching modal details:', err);
      setModalDetails(null);
    } finally {
      setLoadingModalDetails(false);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedStudentForModal(null);
    setModalDetails(null);
  };

  // Helper to extract assigned exams for the active student and subject
  const getSubjectAssignedExams = (student, subject) => {
    if (!student) return [];
    if (subject?.assignedExams && Array.isArray(subject.assignedExams) && subject.assignedExams.length > 0) {
      return subject.assignedExams;
    }
    const subName = (subject?.subjectName || student.subject || '').trim().toLowerCase();
    if (student.assignedExams && Array.isArray(student.assignedExams) && student.assignedExams.length > 0) {
      return student.assignedExams.filter(e => {
        if (!subName) return true;
        return (e.subject || '').trim().toLowerCase() === subName;
      });
    }
    return [];
  };

  // Currently available assigned exams for the modal's selected student and subject
  const currentAssignedExams = useMemo(() => {
    return getSubjectAssignedExams(attendanceTargetStudent, attendanceTargetSubject);
  }, [attendanceTargetStudent, attendanceTargetSubject]);

  // Open Mark Attendance Modal (Supports both 'class' and 'exam')
  const handleOpenAttendanceModal = (student, subject = null, type = 'class') => {
    setAttendanceTargetStudent(student);
    const targetSub = subject || (student.enrolledSubjects && student.enrolledSubjects.length > 0 ? student.enrolledSubjects[0] : null);
    setAttendanceTargetSubject(targetSub);
    setAttendanceType(type);

    // Class mode setup
    const isOnline = (targetSub?.classType || student.classType || '').toLowerCase() === 'online';
    const venue = targetSub?.classLocation ? `Physical (${targetSub.classLocation})` : 'Physical (Main Hall)';
    setAttendanceMode(isOnline ? 'Online (Live Stream / Zoom)' : venue);

    // Check if an exam has been assigned by admin
    const assigned = getSubjectAssignedExams(student, targetSub);
    if (type === 'exam') {
      if (assigned.length > 0) {
        // Admin has assigned an exam: Auto-fill the boxes!
        const latestExam = assigned[0];
        setSelectedAssignedExamId(latestExam._id || '');
        setAttendanceExamName(latestExam.examName || '');
        setAttendanceDate(latestExam.examDate || '');
        setAttendanceExamHall(latestExam.examHall || '');
        const currentStat = latestExam.attendance && latestExam.attendance !== 'Pending'
          ? (latestExam.attendance === 'Attended' ? 'Present' : latestExam.attendance)
          : 'Present';
        setAttendanceStatus(currentStat);
      } else {
        // NO EXAM ASSIGNED YET BY ADMIN: KEEP BOXES COMPLETELY EMPTY!
        setSelectedAssignedExamId('');
        setAttendanceExamName('');
        setAttendanceDate('');
        setAttendanceExamHall('');
        setAttendanceStatus(null);
      }
    } else {
      // Class attendance mode: default session date to today
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setAttendanceStatus('Present');
      setSelectedAssignedExamId('');
      setAttendanceExamName('');
      setAttendanceExamHall('');
    }

    setIsAttendanceModalOpen(true);
  };

  // Switch between Class Attendance and Exam Attendance within the modal
  const handleSwitchAttendanceType = (newType) => {
    setAttendanceType(newType);
    if (newType === 'exam') {
      const assigned = getSubjectAssignedExams(attendanceTargetStudent, attendanceTargetSubject);
      if (assigned.length > 0) {
        // Admin assigned exam: Fill the boxes!
        const ex = assigned.find(x => x._id === selectedAssignedExamId) || assigned[0];
        setSelectedAssignedExamId(ex._id || '');
        setAttendanceExamName(ex.examName || '');
        setAttendanceDate(ex.examDate || '');
        setAttendanceExamHall(ex.examHall || '');
        const currentStat = ex.attendance && ex.attendance !== 'Pending'
          ? (ex.attendance === 'Attended' ? 'Present' : ex.attendance)
          : 'Present';
        setAttendanceStatus(currentStat);
      } else {
        // NO EXAM ASSIGNED YET: KEEP BOXES COMPLETELY EMPTY!
        setSelectedAssignedExamId('');
        setAttendanceExamName('');
        setAttendanceDate('');
        setAttendanceExamHall('');
        setAttendanceStatus(null);
      }
    } else {
      // Switch back to class attendance:
      if (!attendanceDate) {
        setAttendanceDate(new Date().toISOString().split('T')[0]);
      }
      if (!attendanceStatus) {
        setAttendanceStatus('Present');
      }
    }
  };

  // When subject is changed inside the modal
  const handleSubjectChange = (newSubjectName) => {
    const sub = attendanceTargetStudent?.enrolledSubjects?.find(s => s.subjectName === newSubjectName);
    if (sub) {
      setAttendanceTargetSubject(sub);
      const isOnline = (sub.classType || '').toLowerCase() === 'online';
      const venue = sub.classLocation ? `Physical (${sub.classLocation})` : 'Physical (Main Hall)';
      setAttendanceMode(isOnline ? 'Online (Live Stream / Zoom)' : venue);

      if (attendanceType === 'exam') {
        const assigned = getSubjectAssignedExams(attendanceTargetStudent, sub);
        if (assigned.length > 0) {
          const ex = assigned[0];
          setSelectedAssignedExamId(ex._id || '');
          setAttendanceExamName(ex.examName || '');
          setAttendanceDate(ex.examDate || '');
          setAttendanceExamHall(ex.examHall || '');
          const currentStat = ex.attendance && ex.attendance !== 'Pending'
            ? (ex.attendance === 'Attended' ? 'Present' : ex.attendance)
            : 'Present';
          setAttendanceStatus(currentStat);
        } else {
          // NO EXAM ASSIGNED FOR THIS SUBJECT -> KEEP BOXES EMPTY!
          setSelectedAssignedExamId('');
          setAttendanceExamName('');
          setAttendanceDate('');
          setAttendanceExamHall('');
          setAttendanceStatus(null);
        }
      }
    }
  };

  // When admin selects an assigned exam from the dropdown
  const handleSelectAssignedExam = (examId) => {
    setSelectedAssignedExamId(examId);
    const assigned = getSubjectAssignedExams(attendanceTargetStudent, attendanceTargetSubject);
    const ex = assigned.find(x => x._id === examId);
    if (ex) {
      setAttendanceExamName(ex.examName || '');
      setAttendanceDate(ex.examDate || '');
      setAttendanceExamHall(ex.examHall || '');
      const currentStat = ex.attendance && ex.attendance !== 'Pending'
        ? (ex.attendance === 'Attended' ? 'Present' : ex.attendance)
        : 'Present';
      setAttendanceStatus(currentStat);
    } else {
      setAttendanceExamName('');
      setAttendanceDate('');
      setAttendanceExamHall('');
      setAttendanceStatus(null);
    }
  };

  const handleCloseAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setAttendanceTargetStudent(null);
    setAttendanceTargetSubject(null);
    setAttendanceStatus('Present');
    setAttendanceType('class');
    setSelectedAssignedExamId('');
    setAttendanceExamName('');
    setAttendanceDate('');
    setAttendanceExamHall('');
  };

  // Save Attendance to Backend (Dynamic: Class or Exam)
  const handleSaveAttendance = async () => {
    if (!attendanceTargetStudent) return;

    if (attendanceType === 'exam') {
      if (!attendanceExamName || !attendanceExamName.trim()) {
        showError('Exam Name Required', 'No exam has been assigned or specified. Please select an assigned exam or enter an exam name.');
        return;
      }
      if (!attendanceDate) {
        showError('Exam Date Required', 'Please provide an exam date before saving attendance');
        return;
      }
    }

    const statusToSend = attendanceStatus || 'Reset';

    setSavingAttendance(true);
    try {
      let endpoint = `${API_CONFIG.API_URL}/student-activities/mark-attendance`;
      let payload = {};

      if (attendanceType === 'exam') {
        endpoint = `${API_CONFIG.API_URL}/student-activities/mark-exam-attendance`;
        payload = {
          studentId: attendanceTargetStudent.studentId,
          studentMongoId: attendanceTargetStudent._id,
          examName: attendanceExamName.trim(),
          subjectName: attendanceTargetSubject?.subjectName || attendanceTargetStudent.subject || 'General Assessment',
          subjectId: attendanceTargetSubject?.subjectId || null,
          examDate: attendanceDate,
          examHall: attendanceExamHall || '',
          status: statusToSend
        };
      } else {
        const modeValue = attendanceMode.toLowerCase().includes('online') ? 'Online' : 'Physical';
        payload = {
          studentId: attendanceTargetStudent.studentId,
          studentMongoId: attendanceTargetStudent._id,
          sessionDate: attendanceDate,
          classMode: modeValue,
          status: statusToSend,
          subjectName: attendanceTargetSubject?.subjectName || attendanceTargetStudent.subject || 'Class',
          subjectId: attendanceTargetSubject?.subjectId || null
        };
      }

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showSuccess(
          attendanceType === 'exam' ? 'Exam Attendance Saved' : 'Class Attendance Saved',
          result.message || (statusToSend === 'Reset' ? `Attendance reset to Pending for ${attendanceTargetStudent.name}` : `Marked ${attendanceStatus} for ${attendanceTargetStudent.name}`)
        );
        handleCloseAttendanceModal();
        fetchActivities(); // Live refresh activities table
      } else {
        showError('Failed to Save', result.message || 'Could not record attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      showError('Network Error', 'Failed to connect to the server');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return activities.filter((item) => {
      // Search filter
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const matchName = item.name?.toLowerCase().includes(q);
        const matchId = item.studentId?.toLowerCase().includes(q);
        const matchSub = item.enrolledSubjects?.some(s => s.subjectName?.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchSub) return false;
      }

      // 1. Subject filter
      if (selectedSubject !== 'All') {
        const subLower = selectedSubject.toLowerCase();
        const hasMatchingSubject = item.enrolledSubjects?.some(
          s => (s.subjectName || '').toLowerCase() === subLower
        );
        if (!hasMatchingSubject) return false;
      }

      // 2. Grade filter
      if (selectedGrade !== 'All') {
        if (item.grade !== selectedGrade) {
          return false;
        }
      }

      // 3. Teacher filter
      if (selectedTeacher !== 'All') {
        const teacherLower = selectedTeacher.toLowerCase();
        const hasMatchingTeacher = item.enrolledSubjects?.some(
          s => (s.teacherName || '').toLowerCase() === teacherLower
        ) || (item.teacherName || '').toLowerCase() === teacherLower;
        if (!hasMatchingTeacher) return false;
      }

      // 4. Class Mode filter
      if (selectedClassType !== 'All') {
        const typeLower = selectedClassType.toLowerCase();
        const hasMatchingType = item.enrolledSubjects?.some(
          s => (s.classType || 'Physical').toLowerCase() === typeLower
        ) || item.primaryMode?.toLowerCase() === typeLower;
        if (!hasMatchingType) return false;
      }

      // 5. Payment Status filter
      if (selectedPaymentStatus !== 'All') {
        const statusLower = selectedPaymentStatus.toLowerCase();
        if (statusLower === 'paid') {
          const hasPaidSubject = item.enrolledSubjects?.some(s => s.feeStatus === 'Paid');
          if (item.feeStatus !== 'Paid' && !hasPaidSubject) return false;
        } else if (statusLower === 'pending') {
          const hasPendingSubject = item.enrolledSubjects?.some(s => s.feeStatus === 'Pending');
          if (item.feeStatus !== 'Pending' && item.feeStatus !== 'Partial' && !hasPendingSubject) return false;
        }
      }

      return true;
    });
  }, [activities, searchTerm, selectedSubject, selectedGrade, selectedTeacher, selectedClassType, selectedPaymentStatus]);

  // Unique subjects for dropdown
  const subjectOptions = useMemo(() => {
    const set = new Set();
    activities.forEach(a => {
      a.enrolledSubjects?.forEach(s => {
        if (s.subjectName) set.add(s.subjectName);
      });
    });
    return ['All', ...Array.from(set).sort()];
  }, [activities]);

  // Unique grades for dropdown
  const gradeOptions = useMemo(() => {
    const set = new Set(activities.map(a => a.grade).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [activities]);

  // Unique teachers for dropdown
  const teacherOptions = useMemo(() => {
    const set = new Set();
    activities.forEach(a => {
      if (a.teacherName) set.add(a.teacherName.trim());
      a.enrolledSubjects?.forEach(s => {
        if (s.teacherName) set.add(s.teacherName.trim());
      });
    });
    return ['All', ...Array.from(set).filter(Boolean).sort()];
  }, [activities]);

  const getAttendanceColorClass = (rate) => {
    if (rate >= 75) return 'high';
    if (rate >= 50) return 'medium';
    return 'low';
  };

  const handleGenerateReport = () => {
    try {
      if (!filteredList || filteredList.length === 0) {
        showError('No Activities', 'No student activity records available to generate a report.');
        return;
      }

      const headers = [
        'Student ID',
        'Student Name',
        'Grade',
        'Enrolled Subject',
        'Teacher / Lecturer',
        'Class Mode',
        'Fee Status',
        'Class Attendance',
        'Exam Attendance'
      ];

      const rows = [];
      filteredList.forEach((item) => {
        const rawSubjects = item.enrolledSubjects && item.enrolledSubjects.length > 0
          ? item.enrolledSubjects
          : null;

        const subjects = rawSubjects && (selectedSubject !== 'All' || selectedTeacher !== 'All')
          ? rawSubjects.filter(s => {
              if (selectedSubject !== 'All' && (s.subjectName || '').toLowerCase() !== selectedSubject.toLowerCase()) {
                return false;
              }
              if (selectedTeacher !== 'All') {
                const tName = s.teacherName || item.teacherName || '';
                if (tName.toLowerCase() !== selectedTeacher.toLowerCase()) {
                  return false;
                }
              }
              return true;
            })
          : rawSubjects;

        if (!subjects || subjects.length === 0) {
          rows.push([
            item.studentId || '',
            item.name || '',
            item.grade || 'N/A',
            'No enrolled subjects',
            item.teacherName || 'N/A',
            item.primaryMode || 'Physical',
            item.feeStatus || 'Pending',
            '-',
            '-'
          ]);
        } else {
          subjects.forEach((sub) => {
            rows.push([
              item.studentId || '',
              item.name || '',
              item.grade || 'N/A',
              sub.subjectName || 'General',
              sub.teacherName || item.teacherName || 'N/A',
              sub.classType || item.primaryMode || 'Physical',
              sub.feeStatus || 'Pending',
              `${sub.classAttendance?.rate ?? 0}%`,
              `${sub.examAttendance?.rate ?? 0}%`
            ]);
          });
        }
      });

      generatePdfReport({
        title: 'Student Activities & Academic Engagement Report',
        subtitle: 'Wisdom Institute of Higher Education • Comprehensive Subject, Attendance & Financial Summary',
        filename: `student-activities-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        headers,
        rows,
        orientation: 'landscape',
        filterInfo: [
          ...(selectedSubject !== 'All' ? [{ label: 'Subject', value: selectedSubject }] : []),
          ...(selectedGrade !== 'All' ? [{ label: 'Grade', value: selectedGrade }] : []),
          ...(selectedTeacher !== 'All' ? [{ label: 'Teacher', value: selectedTeacher }] : []),
          ...(selectedClassType !== 'All' ? [{ label: 'Mode', value: selectedClassType }] : []),
          ...(selectedPaymentStatus !== 'All' ? [{ label: 'Fee Status', value: selectedPaymentStatus }] : []),
          ...(searchTerm ? [{ label: 'Search Query', value: searchTerm }] : [])
        ],
        summaryCards: [
          { label: 'Total Students', value: filteredList.length },
          { label: 'Enrolled Classes', value: rows.length, color: 'blue' },
          { label: 'Paid Status', value: `${metrics.paidCount || 0} Paid`, color: 'green' },
          { label: 'Pending Dues', value: `${metrics.pendingCount || 0} Pending`, color: 'red' },
          { label: 'Avg Class Attendance', value: `${metrics.avgClassAttendance || 0}%` }
        ]
      });
      showSuccess('PDF Report Generated', 'Student activities PDF report downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('Report Generation Error', err.message || 'Could not generate PDF report');
    }
  };

  return (
    <div className="activities-page">
      <Sidebar />
      <div className="activities-main-content">
        <Topbar userName="Wisdom Admin" />
        <div className="activities-content">
          {/* Header */}
          <div className="activities-header">
            <div>
              <h1>Student Activities</h1>
              <p className="activities-header-sub">
                Subject-wise tracking for fee payments, learning modes, class attendance, and exam participation
              </p>
            </div>
            <div className="activities-header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="export-pdf-btn"
                onClick={handleGenerateReport}
                title="Download complete student activities report as PDF"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                📄 Download PDF Report
              </button>
              <button
                type="button"
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh latest activity data and reset all filters"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="activities-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper blue">👥</div>
              <div className="kpi-info">
                <span className="kpi-label">Total Students</span>
                <span className="kpi-value">{metrics.totalStudents}</span>
                <span className="kpi-sub">Enrolled active learners</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper green">💳</div>
              <div className="kpi-info">
                <span className="kpi-label">Fee Payment Status</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{metrics.paidCount} Paid</span>
                  <span className="kpi-divider">/</span>
                  <span className="kpi-sub-count">{metrics.pendingCount} Pending</span>
                </div>
                <div className="kpi-progress-bar">
                  <div
                    className="kpi-progress-fill green"
                    style={{
                      width: `${metrics.totalStudents ? (metrics.paidCount / metrics.totalStudents) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper purple">🏫 / 💻</div>
              <div className="kpi-info">
                <span className="kpi-label">Class Modes</span>
                <div className="kpi-modes-row">
                  <span className="mode-chip physical">
                    🏫 {metrics.physicalCount} Physical
                  </span>
                  <span className="mode-chip online">
                    💻 {metrics.onlineCount} Online
                  </span>
                </div>
                <span className="kpi-sub">Learning delivery channel</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper teal">📅</div>
              <div className="kpi-info">
                <span className="kpi-label">Avg Class Attendance</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{metrics.avgClassAttendance}%</span>
                  <span className={`kpi-status-badge ${getAttendanceColorClass(metrics.avgClassAttendance)}`}>
                    {metrics.avgClassAttendance >= 75 ? 'Good' : 'Needs Focus'}
                  </span>
                </div>
                <span className="kpi-sub">Weekly scheduled classes</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper amber">📝</div>
              <div className="kpi-info">
                <span className="kpi-label">Avg Exam Attendance</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{metrics.avgExamAttendance}%</span>
                  <span className={`kpi-status-badge ${getAttendanceColorClass(metrics.avgExamAttendance)}`}>
                    {metrics.avgExamAttendance >= 75 ? 'Active' : 'Moderate'}
                  </span>
                </div>
                <span className="kpi-sub">Tests & evaluation sessions</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="activities-filter-toolbar">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by student name, ID, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-dropdowns-group">
              {/* 1. Subject */}
              <div className="filter-item">
                <label>Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {subjectOptions.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
                  ))}
                </select>
              </div>

              {/* 2. Grade */}
              <div className="filter-item">
                <label>Grade:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
                  ))}
                </select>
              </div>

              {/* 3. Teacher */}
              <div className="filter-item">
                <label>Teacher:</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  {teacherOptions.map(t => (
                    <option key={t} value={t}>{t === 'All' ? 'All Teachers' : t}</option>
                  ))}
                </select>
              </div>

              {/* 4. Class Mode */}
              <div className="filter-item">
                <label>Class Mode:</label>
                <select
                  value={selectedClassType}
                  onChange={(e) => setSelectedClassType(e.target.value)}
                >
                  <option value="All">All Modes</option>
                  <option value="Physical">Physical Only</option>
                  <option value="Online">Online Only</option>
                </select>
              </div>

              {/* 5. Payment Status */}
              <div className="filter-item">
                <label>Payment Status:</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending / Unpaid</option>
                </select>
              </div>

              {isAnyFilterActive && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                  title="Clear all active filters"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Activities Table */}
          <div className="activities-table-card">
            {loading ? (
              <div className="activities-loading-state">
                <div className="spinner"></div>
                <p>Loading student activity records...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="activities-empty-state">
                <span className="empty-icon">📂</span>
                <h3>No Student Activity Records Found</h3>
                <p>Try adjusting your search query or filter criteria.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="activities-table">
                  <thead>
                    <tr>
                      <th className="student-col-th">Student</th>
                      <th>Enrolled Class & Mode</th>
                      <th>Class Fee Status</th>
                      <th className="attendance-th">
                        <span>Class Attendance</span>
                        <small>(Subject Sessions)</small>
                      </th>
                      <th className="attendance-th">
                        <span>Exam Attendance</span>
                        <small>(Subject Exams)</small>
                      </th>
                      <th className="text-center actions-col-th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => {
                      const rawSubjects = item.enrolledSubjects && item.enrolledSubjects.length > 0
                        ? item.enrolledSubjects
                        : null;

                      // If a specific subject or teacher is selected, focus on matching sub-rows
                      const subjects = rawSubjects && (selectedSubject !== 'All' || selectedTeacher !== 'All')
                        ? rawSubjects.filter(s => {
                            if (selectedSubject !== 'All' && (s.subjectName || '').toLowerCase() !== selectedSubject.toLowerCase()) {
                              return false;
                            }
                            if (selectedTeacher !== 'All') {
                              const tName = s.teacherName || item.teacherName || '';
                              if (tName.toLowerCase() !== selectedTeacher.toLowerCase()) {
                                return false;
                              }
                            }
                            return true;
                          })
                        : rawSubjects;

                      if (!subjects || subjects.length === 0) {
                        return (
                          <tr key={item._id} className="student-row-group group-first-row">
                            <td className="student-profile-td student-group-parent">
                              <div className="student-badge-wrap">
                                <span className="student-id-tag">{item.studentId}</span>
                                <div className="student-name-box">
                                  <span className="student-full-name">{item.name}</span>
                                  <span className="student-grade-tag">{item.grade}</span>
                                </div>
                              </div>
                            </td>
                            <td className="subject-info-td">
                              <span className="no-classes-text">No active class enrollments</span>
                            </td>
                            <td className="subject-fee-td">
                              <span className="fee-status-pill pending">⏳ No Fee Record</span>
                            </td>
                            <td className="attendance-cell-td">
                              <span className="no-activity-text">-</span>
                            </td>
                            <td className="attendance-cell-td">
                              <span className="no-activity-text">-</span>
                            </td>
                            <td className="text-center action-group-parent">
                              <div className="table-actions-stack">
                                <button
                                  type="button"
                                  className="mark-attendance-btn"
                                  onClick={() => handleOpenAttendanceModal(item, null)}
                                  title="Mark attendance for this student"
                                >
                                  <span className="btn-icon">📋</span> Mark Attendance
                                </button>
                                <button
                                  type="button"
                                  className="view-activity-btn"
                                  onClick={() => handleOpenDetailModal(item)}
                                  title="View detailed student activity timeline"
                                >
                                  📊 View Activity
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return subjects.map((sub, sIdx) => {
                        const isFirst = sIdx === 0;
                        const isSubPaid = sub.feeStatus === 'Paid';
                        const subClassRate = sub.classAttendance?.rate || 0;
                        const subExamRate = sub.examAttendance?.rate || 0;
                        const isOnline = (sub.classType || '').toLowerCase() === 'online';

                        return (
                          <tr
                            key={`${item._id}-sub-${sIdx}`}
                            className={`student-row-group ${isFirst ? 'group-first-row' : 'group-sub-row'}`}
                          >
                            {/* Student Profile (Spans across all subjects of this student) */}
                            {isFirst && (
                              <td
                                rowSpan={subjects.length}
                                className="student-profile-td student-group-parent"
                              >
                                <div className="student-badge-wrap">
                                  <span className="student-id-tag">{item.studentId}</span>
                                  <div className="student-name-box">
                                    <span className="student-full-name">{item.name}</span>
                                    <span className="student-grade-tag">{item.grade}</span>
                                    {subjects.length > 1 && (
                                      <span className="student-subject-count-badge">
                                        {subjects.length} Subjects
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* 1. Enrolled Subject & Mode */}
                            <td className="subject-info-td">
                              <div className="subject-card-compact">
                                <div className="class-name-teacher">
                                  <span className="class-subject-name">{sub.subjectName}</span>
                                  {sub.teacherName && (
                                    <span className="class-teacher-name">({sub.teacherName})</span>
                                  )}
                                </div>
                                <div className="subject-badges-row">
                                  <span className={`class-mode-badge ${isOnline ? 'online' : 'physical'}`}>
                                    {isOnline ? '💻 Online' : '🏫 Physical'}
                                  </span>
                                  {sub.classDay && (
                                    <span className="subject-day-pill">📅 {sub.classDay}</span>
                                  )}
                                  {sub.classLocation && (
                                    <span className="subject-location-pill">📍 {sub.classLocation}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Fee Status (Per Subject) */}
                            <td className="subject-fee-td">
                              <div className="fee-status-cell">
                                <span className={`fee-status-pill ${isSubPaid ? 'paid' : 'pending'}`}>
                                  {isSubPaid ? '✓ Fee Paid' : '⏳ Pending / Unpaid'}
                                </span>

                                {sub.paidMonths && sub.paidMonths.length > 0 ? (
                                  <div className="paid-months-tags">
                                    <span className="paid-label">Paid:</span>
                                    {sub.paidMonths.map((m, mIdx) => (
                                      <span key={mIdx} className="month-tag">{m}</span>
                                    ))}
                                  </div>
                                ) : null}

                                {sub.monthlyFee > 0 && (
                                  <span className="fee-amount-sub">
                                    Fee: LKR {Number(sub.monthlyFee).toLocaleString()}/mo
                                  </span>
                                )}
                                {sub.totalPaidAmount > 0 && (
                                  <span className="fee-total-paid">
                                    Total: LKR {Number(sub.totalPaidAmount).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Class Attendance (Per Subject) */}
                            <td className="attendance-cell-td">
                              <div className="attendance-cell">
                                <div className="attendance-percentage-row">
                                  <span className={`attendance-rate-badge ${getAttendanceColorClass(subClassRate)}`}>
                                    {subClassRate}%
                                  </span>
                                  <span className="attendance-counts">
                                    {sub.classAttendance?.attended || 0}/{sub.classAttendance?.totalHeld ?? 4} classes
                                  </span>
                                </div>
                                <div className="attendance-progress-track">
                                  <div
                                    className={`attendance-progress-bar ${getAttendanceColorClass(subClassRate)}`}
                                    style={{ width: `${subClassRate}%` }}
                                  />
                                </div>
                                <div className="attendance-sub-meta">
                                  <span>Attended: {sub.classAttendance?.attended || 0}</span>
                                  <span>Absent: {sub.classAttendance?.absent || 0}</span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Exam Attendance (Per Subject) */}
                            <td className="attendance-cell-td">
                              <div className="attendance-cell">
                                <div className="attendance-percentage-row">
                                  <span className={`attendance-rate-badge ${getAttendanceColorClass(subExamRate)}`}>
                                    {subExamRate}%
                                  </span>
                                  <span className="attendance-counts">
                                    {sub.examAttendance?.totalScheduled > 0
                                      ? `${sub.examAttendance?.attended || 0}/${sub.examAttendance?.totalScheduled} exams`
                                      : 'No exam assigned'}
                                  </span>
                                </div>
                                <div className="attendance-progress-track">
                                  <div
                                    className={`attendance-progress-bar ${getAttendanceColorClass(subExamRate)}`}
                                    style={{ width: `${subExamRate}%` }}
                                  />
                                </div>
                                <div className="attendance-sub-meta">
                                  <span>Participated: {sub.examAttendance?.attended || 0}</span>
                                  <span>Scheduled: {sub.examAttendance?.totalScheduled || 0}</span>
                                </div>
                              </div>
                            </td>

                            {/* Action (Spans across all subjects of this student) */}
                            {isFirst && (
                              <td
                                rowSpan={subjects.length}
                                className="text-center action-group-parent"
                              >
                                <div className="table-actions-stack">
                                  <button
                                    type="button"
                                    className="mark-attendance-btn"
                                    onClick={() => handleOpenAttendanceModal(item, subjects[0], 'class')}
                                    title="Mark attendance for this student"
                                  >
                                    <span className="btn-icon">📋</span> Mark Attendance
                                  </button>
                                  <button
                                    type="button"
                                    className="view-activity-btn"
                                    onClick={() => handleOpenDetailModal(item)}
                                    title="View detailed student activity timeline"
                                  >
                                    📊 View Activity
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MARK ATTENDANCE MODAL
         ========================================================= */}
      {isAttendanceModalOpen && attendanceTargetStudent && (
        <div className="modal-overlay" onClick={handleCloseAttendanceModal}>
          <div className="modal-content attendance-mark-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header: student's subject, grade, and teacher name, with a close button */}
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-icon">{attendanceType === 'exam' ? '📝' : '📋'}</span>
                <div>
                  <h2>{attendanceType === 'exam' ? 'Mark Exam Attendance' : 'Mark Class Attendance'}</h2>
                  <div className="modal-header-meta-chips">
                    <span className="meta-chip subject">
                      📚 {attendanceTargetSubject?.subjectName || attendanceTargetStudent.subject || 'All Classes'}
                    </span>
                    <span className="meta-chip grade">
                      🎓 {attendanceTargetStudent.grade}
                    </span>
                    {(attendanceTargetSubject?.teacherName || attendanceTargetStudent.teacherName) && (
                      <span className="meta-chip teacher">
                        👨‍🏫 {attendanceTargetSubject?.teacherName || attendanceTargetStudent.teacherName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseAttendanceModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="attendance-modal-body">
              {/* Mode Switcher Tabs: Class vs Exam */}
              <div className="attendance-type-switcher">
                <button
                  type="button"
                  className={`type-switch-btn ${attendanceType === 'class' ? 'active' : ''}`}
                  onClick={() => handleSwitchAttendanceType('class')}
                >
                  <span>📅 Class Attendance</span>
                </button>
                <button
                  type="button"
                  className={`type-switch-btn exam ${attendanceType === 'exam' ? 'active exam' : ''}`}
                  onClick={() => handleSwitchAttendanceType('exam')}
                >
                  <span>📝 Exam Attendance</span>
                </button>
              </div>

              {/* Dynamic Meta Row based on attendanceType */}
              {attendanceType === 'exam' ? (
                <div className="attendance-meta-row exam-meta-row">
                  {attendanceTargetStudent.enrolledSubjects && attendanceTargetStudent.enrolledSubjects.length > 1 && (
                    <div className="attendance-meta-field">
                      <label>Exam Subject:</label>
                      <select
                        value={attendanceTargetSubject?.subjectName || ''}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                      >
                        {attendanceTargetStudent.enrolledSubjects.map((s, idx) => (
                          <option key={idx} value={s.subjectName}>
                            {s.subjectName} ({s.teacherName || 'Instructor'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {currentAssignedExams && currentAssignedExams.length > 0 && (
                    <div className="attendance-meta-field">
                      <label>Assigned Exam:</label>
                      <select
                        value={selectedAssignedExamId}
                        onChange={(e) => handleSelectAssignedExam(e.target.value)}
                      >
                        {currentAssignedExams.map((ex) => (
                          <option key={ex._id} value={ex._id}>
                            📝 {ex.examName} {ex.examDate ? `(${ex.examDate})` : ''} {ex.examHall ? `- ${ex.examHall}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="attendance-meta-field">
                    <label>Exam Name:</label>
                    <input
                      type="text"
                      list="exam-name-suggestions"
                      value={attendanceExamName}
                      onChange={(e) => setAttendanceExamName(e.target.value)}
                      placeholder={currentAssignedExams.length === 0 ? "No exam assigned yet" : "e.g. Monthly Test"}
                    />
                    <datalist id="exam-name-suggestions">
                      <option value="Monthly Test" />
                      <option value="Term Test 1" />
                      <option value="Term Test 2" />
                      <option value="Term Test 3" />
                      <option value="Mid-Term Assessment" />
                      <option value="Unit Evaluation" />
                      <option value="Final Mock Exam" />
                    </datalist>
                  </div>

                  <div className="attendance-meta-field">
                    <label>Exam Date:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>

                  <div className="attendance-meta-field">
                    <label>Exam Hall / Room:</label>
                    <select
                      value={attendanceExamHall}
                      onChange={(e) => setAttendanceExamHall(e.target.value)}
                    >
                      <option value="">-- No Exam Hall Assigned --</option>
                      <option value="Main Hall">Main Hall</option>
                      <option value="Hall A (Ground Floor)">Hall A (Ground Floor)</option>
                      <option value="Hall B (1st Floor)">Hall B (1st Floor)</option>
                      <option value="Science Lab">Science Lab</option>
                      <option value="Computer Lab">Computer Lab</option>
                      <option value="Online Exam Portal">Online Exam Portal</option>
                    </select>
                  </div>

                  {currentAssignedExams.length === 0 && (
                    <div className="no-exam-assigned-banner">
                      <span>⚠️ No exam has been assigned to this student for this subject yet.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="attendance-meta-row">
                  {attendanceTargetStudent.enrolledSubjects && attendanceTargetStudent.enrolledSubjects.length > 1 && (
                    <div className="attendance-meta-field">
                      <label>Subject Session:</label>
                      <select
                        value={attendanceTargetSubject?.subjectName || ''}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                      >
                        {attendanceTargetStudent.enrolledSubjects.map((s, idx) => (
                          <option key={idx} value={s.subjectName}>
                            {s.subjectName} ({s.teacherName || 'Instructor'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="attendance-meta-field">
                    <label>Session Date:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>

                  <div className="attendance-meta-field">
                    <label>Class Mode:</label>
                    <select
                      value={attendanceMode}
                      onChange={(e) => setAttendanceMode(e.target.value)}
                    >
                      <option value={`Physical (${attendanceTargetSubject?.classLocation || 'Main Hall'})`}>
                        🏫 Physical ({attendanceTargetSubject?.classLocation || 'Main Hall'})
                      </option>
                      <option value="Physical (General Hall)">
                        🏫 Physical (General Hall)
                      </option>
                      <option value="Online (Live Stream / Zoom)">
                        💻 Online (Live Stream / Zoom)
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* Quick Actions Row */}
              <div className="attendance-quick-action-row">
                <span className="quick-action-hint">Quick Actions:</span>
                <div className="quick-action-buttons">
                  <button
                    type="button"
                    className="quick-action-btn present"
                    onClick={() => setAttendanceStatus('Present')}
                  >
                    ✓ Mark present
                  </button>
                  <button
                    type="button"
                    className={`quick-action-btn reset ${!attendanceStatus ? 'active' : ''}`}
                    onClick={() => setAttendanceStatus(null)}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* Student Row with 3-way Segmented Control & Dynamic Background Tint */}
              <div className={`attendance-student-row-card ${attendanceStatus ? attendanceStatus.toLowerCase() : 'neutral'}`}>
                <div className="attendance-student-info">
                  <div className="attendance-student-avatar">
                    {attendanceTargetStudent.name ? attendanceTargetStudent.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="attendance-student-details">
                    <div className="attendance-student-name">
                      {attendanceTargetStudent.name}
                    </div>
                    <div className="attendance-student-badges">
                      <span className="student-id-tag">{attendanceTargetStudent.studentId}</span>
                      <span className="student-grade-tag">{attendanceTargetStudent.grade}</span>
                      <span className="student-subject-tag">{attendanceTargetSubject?.subjectName || 'Class'}</span>
                      {attendanceType === 'exam' && attendanceExamName && (
                        <span className="student-exam-tag">📝 {attendanceExamName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3-way Segmented Control: Present / Late / Absent */}
                <div className="attendance-segmented-control" role="group" aria-label="Attendance Status">
                  <button
                    type="button"
                    className={`seg-btn present ${attendanceStatus === 'Present' ? 'active' : ''}`}
                    onClick={() => setAttendanceStatus('Present')}
                  >
                    <span className="seg-indicator">✓</span>
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    className={`seg-btn late ${attendanceStatus === 'Late' ? 'active' : ''}`}
                    onClick={() => setAttendanceStatus('Late')}
                  >
                    <span className="seg-indicator">⏰</span>
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    className={`seg-btn absent ${attendanceStatus === 'Absent' ? 'active' : ''}`}
                    onClick={() => setAttendanceStatus('Absent')}
                  >
                    <span className="seg-indicator">✕</span>
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer: Live Summary Pills & Save Attendance Button */}
            <div className="attendance-modal-footer">
              <div className="attendance-summary-pills">
                <span className={`summary-pill present ${attendanceStatus === 'Present' ? 'highlight' : ''}`}>
                  Present: {attendanceStatus === 'Present' ? 1 : 0}
                </span>
                <span className={`summary-pill late ${attendanceStatus === 'Late' ? 'highlight' : ''}`}>
                  Late: {attendanceStatus === 'Late' ? 1 : 0}
                </span>
                <span className={`summary-pill absent ${attendanceStatus === 'Absent' ? 'highlight' : ''}`}>
                  Absent: {attendanceStatus === 'Absent' ? 1 : 0}
                </span>
              </div>

              <div className="attendance-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseAttendanceModal}
                  disabled={savingAttendance}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`save-attendance-btn ${attendanceType === 'exam' ? 'exam-save-btn' : ''} ${!attendanceStatus ? 'reset-save-btn' : ''}`}
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                >
                  {savingAttendance
                    ? 'Saving...'
                    : !attendanceStatus
                    ? (attendanceType === 'exam' ? '💾 Save (Reset Exam Attendance)' : '💾 Save (Reset Class Attendance)')
                    : (attendanceType === 'exam' ? '💾 Save Exam Attendance' : '💾 Save Class Attendance')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DETAILED STUDENT ACTIVITY REPORT MODAL
         ========================================================= */}
      {selectedStudentForModal && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content activity-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-icon">📈</span>
                <div>
                  <h2>Student Activity Report</h2>
                  <p className="modal-subtitle">
                    Subject-wise attendance, fee settlement, and examination records
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseDetailModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Student Overview Strip */}
            <div className="modal-student-strip">
              <div className="strip-avatar">
                {selectedStudentForModal.name ? selectedStudentForModal.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="strip-meta">
                <div className="strip-name">{selectedStudentForModal.name}</div>
                <div className="strip-chips">
                  <span className="chip"><strong>ID:</strong> {selectedStudentForModal.studentId}</span>
                  <span className="chip"><strong>Grade:</strong> {selectedStudentForModal.grade}</span>
                  <span className="chip">
                    <strong>Primary Mode:</strong> {selectedStudentForModal.primaryMode}
                  </span>
                  <span className={`chip fee-chip ${selectedStudentForModal.feeStatus === 'Paid' ? 'paid' : 'pending'}`}>
                    {selectedStudentForModal.feeStatus === 'Paid' ? '✓ Fees Paid' : '⏳ Fees Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Subject Quick Summary Cards in Modal */}
            {selectedStudentForModal.enrolledSubjects && selectedStudentForModal.enrolledSubjects.length > 0 && (
              <div className="modal-subjects-cards-grid">
                {selectedStudentForModal.enrolledSubjects.map((es, eIdx) => {
                  const isSubPaid = es.feeStatus === 'Paid';
                  const cRate = es.classAttendance?.rate || 0;
                  const xRate = es.examAttendance?.rate || 0;
                  const isOnline = (es.classType || '').toLowerCase() === 'online';

                  return (
                    <div key={eIdx} className="modal-subject-mini-card">
                      <div className="mini-card-head">
                        <span className="mini-card-sub-name">{es.subjectName}</span>
                        <span className={`class-mode-badge ${isOnline ? 'online' : 'physical'}`}>
                          {isOnline ? '💻 Online' : '🏫 Physical'}
                        </span>
                      </div>
                      <div className="mini-card-teacher">
                        👨‍🏫 {es.teacherName || 'Assigned Instructor'}
                      </div>
                      <div className="mini-card-stats">
                        <div className="mini-card-stat-item">
                          <span className="stat-name">Fee Status:</span>
                          <span className={`fee-mini-pill ${isSubPaid ? 'paid' : 'pending'}`}>
                            {isSubPaid ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </div>
                        {es.paidMonths && es.paidMonths.length > 0 && (
                          <div className="mini-card-stat-item">
                            <span className="stat-name">Paid:</span>
                            <span className="stat-months">{es.paidMonths.join(', ')}</span>
                          </div>
                        )}
                        <div className="mini-card-stat-item">
                          <span className="stat-name">Class Att:</span>
                          <span className="stat-val">
                            {cRate}% ({es.classAttendance?.attended || 0}/{es.classAttendance?.totalHeld || 0})
                          </span>
                        </div>
                        <div className="mini-card-stat-item">
                          <span className="stat-name">Exam Att:</span>
                          <span className="stat-val">
                            {xRate}% ({es.examAttendance?.attended || 0}/{es.examAttendance?.totalScheduled || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Tabs Header */}
            <div className="modal-tabs-header">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
                onClick={() => setActiveTab('classes')}
              >
                📅 Class Attendance ({modalDetails?.classSessions?.length || 0})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
                onClick={() => setActiveTab('exams')}
              >
                📝 Exam Attendance ({modalDetails?.examSessions?.length || 0})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
                onClick={() => setActiveTab('fees')}
              >
                💳 Payment History ({modalDetails?.paymentHistory?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-tabs-body">
              {loadingModalDetails ? (
                <div className="modal-loading-box">
                  <div className="spinner"></div>
                  <p>Loading activity logs...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: Class Attendance */}
                  {activeTab === 'classes' && (
                    <div className="tab-pane">
                      <div className="pane-summary-banner">
                        <div className="mini-stat">
                          <span className="mini-stat-label">Total Classes</span>
                          <span className="mini-stat-val">
                            {selectedStudentForModal.classAttendance?.totalHeld || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Attended</span>
                          <span className="mini-stat-val green">
                            {selectedStudentForModal.classAttendance?.attended || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Absent</span>
                          <span className="mini-stat-val red">
                            {selectedStudentForModal.classAttendance?.absent || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Overall Attendance</span>
                          <span className="mini-stat-val blue">
                            {selectedStudentForModal.classAttendance?.rate || 0}%
                          </span>
                        </div>
                      </div>

                      {modalDetails?.classSessions && modalDetails.classSessions.length > 0 ? (
                        <div className="modal-table-wrap">
                          <table className="modal-sub-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Subject</th>
                                <th>Instructor</th>
                                <th>Attendance Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modalDetails.classSessions.map((session, sIdx) => {
                                const isAttended = session.status === 'attended' || session.status === 'active';
                                return (
                                  <tr key={sIdx}>
                                    <td>{new Date(session.date).toLocaleDateString()}</td>
                                    <td>{session.time || '-'}</td>
                                    <td><strong>{session.subjectName}</strong></td>
                                    <td>{session.teacherName || '-'}</td>
                                    <td>
                                      <span className={`status-pill ${isAttended ? 'active' : 'inactive'}`}>
                                        {isAttended ? 'Attended' : 'Absent'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="modal-empty-pane">
                          No specific class attempt sessions logged yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Exam Attendance */}
                  {activeTab === 'exams' && (
                    <div className="tab-pane">
                      <div className="pane-summary-banner">
                        <div className="mini-stat">
                          <span className="mini-stat-label">Total Scheduled</span>
                          <span className="mini-stat-val">
                            {selectedStudentForModal.examAttendance?.totalScheduled || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Participated</span>
                          <span className="mini-stat-val green">
                            {selectedStudentForModal.examAttendance?.attended || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Absent</span>
                          <span className="mini-stat-val red">
                            {selectedStudentForModal.examAttendance?.absent || 0}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Exam Participation</span>
                          <span className="mini-stat-val blue">
                            {selectedStudentForModal.examAttendance?.rate || 0}%
                          </span>
                        </div>
                      </div>

                      {modalDetails?.examSessions && modalDetails.examSessions.length > 0 ? (
                        <div className="modal-table-wrap">
                          <table className="modal-sub-table">
                            <thead>
                              <tr>
                                <th>Exam Name</th>
                                <th>Subject</th>
                                <th>Date & Time</th>
                                <th>Hall</th>
                                <th>Attendance Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modalDetails.examSessions.map((exam, eIdx) => {
                                const isAttended = exam.attendance === 'Attended';
                                return (
                                  <tr key={eIdx}>
                                    <td><strong>{exam.examName}</strong></td>
                                    <td>{exam.subject}</td>
                                    <td>{new Date(exam.examDate).toLocaleDateString()} {exam.examTime ? `(${exam.examTime})` : ''}</td>
                                    <td>{exam.examHall || 'Main Hall'}</td>
                                    <td>
                                      <span className={`status-pill ${isAttended ? 'active' : 'inactive'}`}>
                                        {exam.attendance || 'Pending'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="modal-empty-pane">
                          No exams scheduled or recorded for this student yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Fee & Payment History */}
                  {activeTab === 'fees' && (
                    <div className="tab-pane">
                      <div className="pane-summary-banner">
                        <div className="mini-stat">
                          <span className="mini-stat-label">Overall Fee Status</span>
                          <span className={`mini-stat-val ${selectedStudentForModal.feeStatus === 'Paid' ? 'green' : 'amber'}`}>
                            {selectedStudentForModal.feeStatus}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Total Amount Paid</span>
                          <span className="mini-stat-val green">
                            LKR {Number(selectedStudentForModal.totalPaidAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-label">Months Settled</span>
                          <span className="mini-stat-val blue">
                            {selectedStudentForModal.paidMonths?.length || 0} Month(s)
                          </span>
                        </div>
                      </div>

                      {modalDetails?.paymentHistory && modalDetails.paymentHistory.length > 0 ? (
                        <div className="modal-table-wrap">
                          <table className="modal-sub-table">
                            <thead>
                              <tr>
                                <th>Month</th>
                                <th>Amount (LKR)</th>
                                <th>Payment Method</th>
                                <th>Payment Date</th>
                                <th>Subject(s)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modalDetails.paymentHistory.map((p, pIdx) => (
                                <tr key={pIdx}>
                                  <td><span className="month-badge">{p.month}</span></td>
                                  <td><strong>LKR {Number(p.totalAmount).toLocaleString()}</strong></td>
                                  <td>{p.paymentMethod}</td>
                                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                  <td>{p.subjects || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="modal-empty-pane">
                          No historical payments recorded for this student yet.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions-bar">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={handleCloseDetailModal}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActivitiesPage;
