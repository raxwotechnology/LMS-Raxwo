import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './ExamPage.css';

// Pre-defined time options for start and end time dropdowns (15/30-minute intervals)
const TIME_OPTIONS = [
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM',
  '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
  '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
  '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
  '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
  '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM',
  '06:00 PM', '06:15 PM', '06:30 PM', '06:45 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM'
];

const ExamPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [examRecords, setExamRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Student autocomplete search state
  const [studentIdInput, setStudentIdInput] = useState('');
  const [validatedStudent, setValidatedStudent] = useState(null);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [studentValidationError, setStudentValidationError] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  // Available subjects for dropdown
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // The 10 Form Points (with Start Time & End Time)
  const [formData, setFormData] = useState({
    studentName: '',
    studentIdNumber: '',
    grade: '',
    subject: '',
    subjectId: '',
    examName: '',
    examDate: '',
    startTime: '',
    endTime: '',
    examTime: '',
    examHall: '',
    teacherName: '',
    guardianContact: ''
  });

  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = (user.name && user.name !== 'Admin') ? user.name : 'Wisdom Admin';

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchAllStudents();
  }, []);

  // Fetch subjects with teacher info
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const subjects = data.data.map(sub => ({
          id: sub._id,
          name: sub.name,
          teacherName: sub.conductedBy?.name || ''
        }));
        setAvailableSubjects(subjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch all exam records
  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/exams`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setExamRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  // Fetch all students for quick autocomplete search
  const fetchAllStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllStudents(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Format date helper for table and reports
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Autocomplete suggestions based on student ID or name
  const getStudentSuggestions = (query) => {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const searchLower = query.toLowerCase().trim();
    const suggestions = [];

    allStudents.forEach(student => {
      const studentName = (student.name || '').trim().toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      
      if (studentId.includes(searchLower)) {
        suggestions.push({
          ...student,
          matchType: 'ID',
          displayText: `${student.name} (${student.studentId})`
        });
        return;
      }

      if (studentName.includes(searchLower)) {
        suggestions.push({
          ...student,
          matchType: 'Name',
          displayText: `${student.name} (${student.studentId})`
        });
      }
    });

    return suggestions.sort((a, b) => {
      if (a.matchType === 'ID' && b.matchType !== 'ID') return -1;
      if (a.matchType !== 'ID' && b.matchType === 'ID') return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 10);
  };

  const handleStudentSearchChange = (e) => {
    const value = e.target.value;
    setStudentIdInput(value);
    
    if (value.trim()) {
      const suggestions = getStudentSuggestions(value);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setValidatedStudent(null);
    setStudentValidationError('');
  };

  // Auto-fill student details when selected from suggestions
  const handleStudentSuggestionSelect = (student) => {
    setStudentIdInput(`${student.name} (${student.studentId})`);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setValidatedStudent(student);
    setStudentValidationError('');
    setShowForm(true);

    // Look up previous exam records for this student to pre-fill grade if recorded
    const prevExam = examRecords.find(
      ex => (ex.studentIdNumber === student.studentId || ex.studentId?._id === student._id) && ex.grade
    );

    // Format parent/guardian phone number
    let contactNumber = student.guardianTelephone || student.mobile || '';
    if (contactNumber) {
      if (contactNumber.startsWith('+94')) {
        contactNumber = contactNumber.substring(3);
      } else if (contactNumber.startsWith('0')) {
        contactNumber = contactNumber.substring(1);
      }
      contactNumber = contactNumber.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      studentName: student.name || '',
      studentIdNumber: student.studentId || '',
      guardianContact: contactNumber,
      grade: prev.grade || prevExam?.grade || ''
    }));
  };

  // Validate student button handler
  const validateStudent = () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID or Name');
      return;
    }

    if (validatedStudent) return;

    setValidatingStudent(true);
    setStudentValidationError('');

    const term = studentIdInput.trim().toLowerCase();
    const student = allStudents.find(
      s => (s.studentId && s.studentId.toLowerCase() === term) ||
           (s.name && s.name.toLowerCase().includes(term))
    );

    if (student) {
      handleStudentSuggestionSelect(student);
    } else {
      setStudentValidationError('Student not found. Please select from the suggestion list or enter a valid Student ID.');
    }
    setValidatingStudent(false);
  };

  // Subject change handler: auto-fills teacher name from the selected subject
  const handleSubjectChange = (e) => {
    const selectedSubId = e.target.value;
    const selectedSub = availableSubjects.find(s => s.id === selectedSubId);
    
    if (selectedSub) {
      setFormData(prev => ({
        ...prev,
        subjectId: selectedSub.id,
        subject: selectedSub.name,
        teacherName: selectedSub.teacherName || prev.teacherName || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subjectId: '',
        subject: selectedSubId
      }));
    }
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle start time change
  const handleStartTimeChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      startTime: val,
      examTime: val && prev.endTime ? `${val} - ${prev.endTime}` : (val || '')
    }));
    setError('');
  };

  // Handle end time change
  const handleEndTimeChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      endTime: val,
      examTime: prev.startTime && val ? `${prev.startTime} - ${val}` : (val || '')
    }));
    setError('');
  };

  // Contact number formatting with +94
  const handleGuardianContactChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+94')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }
    value = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      guardianContact: value
    }));
    setError('');
  };

  // Form Reset
  const handleReset = () => {
    setStudentIdInput('');
    setValidatedStudent(null);
    setFormData({
      studentName: '',
      studentIdNumber: '',
      grade: '',
      subject: '',
      subjectId: '',
      examName: '',
      examDate: '',
      startTime: '',
      endTime: '',
      examTime: '',
      examHall: '',
      teacherName: '',
      guardianContact: ''
    });
    setShowForm(false);
    setEditingExam(null);
    setError('');
    setStudentValidationError('');
  };

  // Edit exam record
  const handleEdit = (exam) => {
    setEditingExam(exam);
    const sId = exam.studentIdNumber || exam.studentId?.studentId || '';
    const sName = exam.studentName || exam.studentId?.name || (exam.firstName ? `${exam.firstName} ${exam.lastName || ''}`.trim() : '');
    
    setStudentIdInput(sName ? `${sName} (${sId})` : sId);
    setValidatedStudent(exam.studentId || { _id: exam.studentId?._id, name: sName, studentId: sId });

    let examDateFormatted = '';
    if (exam.examDate) {
      const date = new Date(exam.examDate);
      examDateFormatted = date.toISOString().split('T')[0];
    }

    let subId = exam.subjectId?._id || exam.subjectId || '';
    let subName = exam.subject || (exam.exams && exam.exams[0]?.subjectName) || '';
    if (!subId && exam.exams && exam.exams[0]?.subjectId) {
      subId = typeof exam.exams[0].subjectId === 'object' ? exam.exams[0].subjectId._id : exam.exams[0].subjectId;
    }

    let contact = exam.guardianContact || exam.guardianTelephone || exam.mobile || exam.studentId?.guardianTelephone || '';
    if (contact) {
      if (contact.startsWith('+94')) contact = contact.substring(3);
      else if (contact.startsWith('0')) contact = contact.substring(1);
      contact = contact.replace(/\D/g, '');
    }

    let sTime = exam.startTime || '';
    let eTime = exam.endTime || '';
    if ((!sTime || !eTime) && exam.examTime) {
      const parts = exam.examTime.split('-').map(p => p.trim());
      sTime = sTime || parts[0] || '';
      eTime = eTime || parts[1] || '';
    }

    setFormData({
      studentName: sName,
      studentIdNumber: sId,
      grade: exam.grade || '',
      subject: subName,
      subjectId: subId,
      examName: exam.examName || exam.exam || (exam.exams && exam.exams[0]?.subjectName) || '',
      examDate: examDateFormatted,
      startTime: sTime,
      endTime: eTime,
      examTime: exam.examTime || (sTime && eTime ? `${sTime} - ${eTime}` : sTime),
      examHall: exam.examHall || '',
      teacherName: exam.teacherName || '',
      guardianContact: contact
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete exam record
  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Exam Record',
      message: 'Are you sure you want to delete this exam registration? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/exams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toastSuccess('Exam record deleted successfully');
        await fetchExams();
      } else {
        showError('Delete Failed', data.message || 'Failed to delete exam record');
      }
    } catch (err) {
      console.error('Error deleting exam:', err);
      showError('Delete Failed', 'Network error. Please try again.');
    }
  };

  // Submit handler for creating/updating
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.studentName.trim() || !formData.studentIdNumber.trim()) {
      setError('Please select or validate a student first');
      setLoading(false);
      return;
    }

    if (!formData.subject.trim()) {
      setError('Please select a Subject');
      setLoading(false);
      return;
    }

    if (!formData.examName.trim()) {
      setError('Please enter or select Exam/Test Name');
      setLoading(false);
      return;
    }

    if (!formData.examDate) {
      setError('Please select Exam Date');
      setLoading(false);
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Please select both Exam Start Time and End Time');
      setLoading(false);
      return;
    }

    const computedExamTime = `${formData.startTime} - ${formData.endTime}`;

    let formattedContact = (formData.guardianContact || '').trim();
    if (formattedContact) {
      formattedContact = formattedContact.replace(/\D/g, '');
      if (formattedContact.startsWith('0')) {
        formattedContact = formattedContact.substring(1);
      }
      formattedContact = '+94' + formattedContact;
    }

    // Resolve studentId ObjectId
    let studentObjectId = validatedStudent?._id;
    if (!studentObjectId) {
      const match = allStudents.find(s => s.studentId === formData.studentIdNumber.trim());
      if (match) studentObjectId = match._id;
    }

    const payload = {
      studentId: studentObjectId,
      studentIdNumber: formData.studentIdNumber.trim(),
      studentName: formData.studentName.trim(),
      grade: formData.grade.trim() || undefined,
      subject: formData.subject.trim(),
      subjectId: formData.subjectId || undefined,
      examName: formData.examName.trim(),
      examDate: formData.examDate,
      startTime: formData.startTime.trim(),
      endTime: formData.endTime.trim(),
      examTime: computedExamTime,
      examHall: formData.examHall.trim() || undefined,
      teacherName: formData.teacherName.trim() || undefined,
      guardianContact: formattedContact || undefined
    };

    try {
      const url = editingExam
        ? `${API_CONFIG.API_URL}/exams/${editingExam._id}`
        : `${API_CONFIG.API_URL}/exams`;
      
      const method = editingExam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(
          editingExam ? 'Exam Updated' : 'Exam Registered',
          editingExam ? 'Exam record updated successfully!' : 'Exam registered successfully!'
        );
        setSuccess(editingExam ? 'Exam record updated successfully!' : 'Exam registered successfully!');
        await fetchExams();
        handleReset();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = data.message || `Failed to ${editingExam ? 'update' : 'create'} exam record`;
        setError(errorMsg);
        showError('Registration Failed', errorMsg);
      }
    } catch (err) {
      console.error('Error saving exam:', err);
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter exams for search input
  const filteredExams = examRecords.filter((exam) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const studentId = (exam.studentIdNumber || exam.studentId?.studentId || '').toLowerCase();
    const studentName = (exam.studentName || exam.studentId?.name || `${exam.firstName || ''} ${exam.lastName || ''}`).toLowerCase();
    const grade = (exam.grade || '').toLowerCase();
    const subject = (exam.subject || (exam.exams && exam.exams[0]?.subjectName) || exam.exam || '').toLowerCase();
    const examName = (exam.examName || exam.exam || '').toLowerCase();
    const hall = (exam.examHall || '').toLowerCase();
    const teacher = (exam.teacherName || '').toLowerCase();
    const contact = (exam.guardianContact || exam.guardianTelephone || exam.mobile || '').toLowerCase();

    return (
      studentId.includes(term) ||
      studentName.includes(term) ||
      grade.includes(term) ||
      subject.includes(term) ||
      examName.includes(term) ||
      hall.includes(term) ||
      teacher.includes(term) ||
      contact.includes(term)
    );
  });

  // Generate Clean CSV Report with only the 10 Points
  const handleGenerateReport = () => {
    if (!examRecords || examRecords.length === 0) {
      showWarning('No Exam Records', 'No exam records available to generate a report.');
      return;
    }

    if (filteredExams.length === 0) {
      showWarning('No Matching Records', 'No exam records match your search criteria.');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Grade / Class',
      'Subject',
      'Exam / Test Name',
      'Exam Date',
      'Exam Time',
      'Exam Hall / Location',
      'Teacher / Lecturer Name',
      'Parent/Guardian Contact Number'
    ];

    const rows = filteredExams.map((exam) => {
      const studentId = exam.studentIdNumber || exam.studentId?.studentId || 'N/A';
      const studentName = exam.studentName || exam.studentId?.name || `${exam.firstName || ''} ${exam.lastName || ''}`.trim() || 'N/A';
      const grade = exam.grade || 'N/A';
      const subject = exam.subject || (exam.exams && exam.exams.map(e => e.subjectName).join(', ')) || exam.exam || 'N/A';
      const examName = exam.examName || exam.exam || 'N/A';
      const examDate = exam.examDate ? formatDate(exam.examDate) : 'N/A';
      const examTime = exam.examTime || 'N/A';
      const examHall = exam.examHall || 'N/A';
      const teacherName = exam.teacherName || 'N/A';
      const contact = exam.guardianContact || exam.guardianTelephone || exam.mobile || exam.studentId?.guardianTelephone || 'N/A';

      return [
        studentId,
        studentName,
        grade,
        subject,
        examName,
        examDate,
        examTime,
        examHall,
        teacherName,
        contact
      ];
    });

    const uniqueSubjects = new Set(filteredExams.map(e => e.subject).filter(Boolean)).size;
    const uniqueStudents = new Set(filteredExams.map(e => e.studentIdNumber || e.studentId?.studentId).filter(Boolean)).size;

    generatePdfReport({
      title: 'Student Examination Registration Directory',
      subtitle: 'Wisdom Institute of Higher Education • Official Academic Examination Schedule & Hall Allocation',
      filename: `exam-registration-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'landscape',
      filterInfo: [
        ...(searchTerm ? [{ label: 'Search Query', value: searchTerm }] : [])
      ],
      summaryCards: [
        { label: 'Total Registrations', value: filteredExams.length },
        { label: 'Unique Students', value: uniqueStudents, color: 'green' },
        { label: 'Subjects Involved', value: uniqueSubjects }
      ]
    });
    toastSuccess('Exam registration PDF report downloaded successfully');
  };

  return (
    <div className="exam-page">
      <Sidebar />
      <div className="exam-main-content">
        <Topbar userName={userName} />
        
        <div className="exam-content">
          <div className="exam-header">
            <div>
              <h1>Exam Registration</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Register and manage student examinations, test schedules, venues, and lecturers.
              </p>
            </div>
            <div className="exam-header-actions">
              <div className="exam-search">
                <input
                  type="text"
                  placeholder="Search by ID, name, subject, exam, hall..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={!examRecords || examRecords.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-exam-btn" 
                onClick={() => {
                  if (showForm) {
                    handleReset();
                  } else {
                    setShowForm(true);
                    setEditingExam(null);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Register Exam'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="exam-form-container">
              <h2>{editingExam ? 'Edit Exam Registration' : 'New Exam Registration'}</h2>
              <form onSubmit={handleSubmit} className="exam-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Student Selection & Autocomplete */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="studentSearchInput">
                    Select Registered Student (by ID or Name) <span className="required">*</span>
                  </label>
                  <div className="student-id-validation">
                    <div className="student-search-container" style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        id="studentSearchInput"
                        value={studentIdInput}
                        onChange={handleStudentSearchChange}
                        onFocus={() => {
                          if (studentIdInput) {
                            const suggestions = getStudentSuggestions(studentIdInput);
                            setStudentSuggestions(suggestions);
                            setShowSuggestions(suggestions.length > 0);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 250);
                        }}
                        placeholder="Type Student ID or Name to auto-fill details..."
                        disabled={!!validatedStudent}
                        autoComplete="off"
                        style={{ width: '100%' }}
                      />
                      {showSuggestions && studentSuggestions.length > 0 && (
                        <div className="student-suggestions-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #BAE6FD',
                          borderRadius: '6px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(3, 105, 161, 0.12)',
                          marginTop: '3px'
                        }}>
                          {studentSuggestions.map((student, index) => (
                            <div
                              key={student._id || index}
                              onClick={() => handleStudentSuggestionSelect(student)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: index < studentSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F9FF'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: '600', color: '#0369A1', fontSize: '0.8125rem' }}>{student.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ID: <span style={{ fontWeight: '500', color: '#334155' }}>{student.studentId}</span>
                                {student.mobile && ` • Mobile: ${student.mobile}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!validatedStudent ? (
                      <button
                        type="button"
                        className="validate-btn"
                        onClick={validateStudent}
                        disabled={validatingStudent || !studentIdInput.trim()}
                      >
                        {validatingStudent ? 'Searching...' : 'Auto-Fill Details'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="change-student-btn"
                        onClick={() => {
                          setValidatedStudent(null);
                          setStudentIdInput('');
                          setFormData(prev => ({
                            ...prev,
                            studentName: '',
                            studentIdNumber: '',
                            guardianContact: ''
                          }));
                        }}
                      >
                        Change Student
                      </button>
                    )}
                  </div>
                  {studentValidationError && (
                    <div className="error-message" style={{ marginTop: '4px' }}>{studentValidationError}</div>
                  )}
                  {validatedStudent && (
                    <div style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '4px',
                      color: '#15803D',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>✓</span>
                      <span>Details pre-filled for <strong>{validatedStudent.name}</strong> ({validatedStudent.studentId})</span>
                    </div>
                  )}
                </div>

                {/* THE 10 FIELDS IN A CLEAN 2-COLUMN GRID */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '0.75rem',
                  background: '#F8FAFC',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0'
                }}>
                  {/* Point 1: Student Name */}
                  <div className="form-group">
                    <label htmlFor="studentName">
                      1. Student Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="studentName"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled on student selection"
                      required
                    />
                  </div>

                  {/* Point 2: Student ID / Registration No. */}
                  <div className="form-group">
                    <label htmlFor="studentIdNumber">
                      2. Student ID / Registration No. <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="studentIdNumber"
                      name="studentIdNumber"
                      value={formData.studentIdNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. ST-2026-001"
                      required
                    />
                  </div>

                  {/* Point 3: Grade / Class */}
                  <div className="form-group">
                    <label htmlFor="grade">
                      3. Grade / Class
                    </label>
                    <input
                      type="text"
                      id="grade"
                      name="grade"
                      list="gradeList"
                      value={formData.grade}
                      onChange={handleInputChange}
                      placeholder="e.g. Grade 10, Grade 11, A/L"
                    />
                    <datalist id="gradeList">
                      <option value="Grade 6" />
                      <option value="Grade 7" />
                      <option value="Grade 8" />
                      <option value="Grade 9" />
                      <option value="Grade 10" />
                      <option value="Grade 11" />
                      <option value="Grade 12" />
                      <option value="Grade 13" />
                      <option value="Ordinary Level (O/L)" />
                      <option value="Advanced Level (A/L)" />
                    </datalist>
                  </div>

                  {/* Point 4: Subject */}
                  <div className="form-group">
                    <label htmlFor="subject">
                      4. Subject <span className="required">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subjectId || ''}
                      onChange={handleSubjectChange}
                      disabled={loadingSubjects}
                      required
                    >
                      <option value="" disabled>Select Subject</option>
                      {availableSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.teacherName ? `(${sub.teacherName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Point 5: Exam/Test Name */}
                  <div className="form-group">
                    <label htmlFor="examName">
                      5. Exam / Test Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="examName"
                      name="examName"
                      list="examNameList"
                      value={formData.examName}
                      onChange={handleInputChange}
                      placeholder="e.g. Monthly Test, Term Test, Model Paper"
                      required
                    />
                    <datalist id="examNameList">
                      <option value="Monthly Test" />
                      <option value="Term Test" />
                      <option value="First Term Test" />
                      <option value="Second Term Test" />
                      <option value="Third Term Test" />
                      <option value="Model Paper" />
                      <option value="Unit Test" />
                      <option value="Mid-Term Examination" />
                      <option value="Final Examination" />
                    </datalist>
                  </div>

                  {/* Point 6: Exam Date */}
                  <div className="form-group">
                    <label htmlFor="examDate">
                      6. Exam Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="examDate"
                      name="examDate"
                      value={formData.examDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Point 7: Exam Time (Start Time & End Time Dropdowns) */}
                  <div className="form-group">
                    <label>
                      7. Exam Time (Start Time & End Time) <span className="required">*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                      <select
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleStartTimeChange}
                        required
                        style={{ width: '100%' }}
                      >
                        <option value="" disabled>Start Time</option>
                        {formData.startTime && !TIME_OPTIONS.includes(formData.startTime) && (
                          <option value={formData.startTime}>{formData.startTime}</option>
                        )}
                        {TIME_OPTIONS.map((time) => (
                          <option key={`start-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>to</span>
                      <select
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleEndTimeChange}
                        required
                        style={{ width: '100%' }}
                      >
                        <option value="" disabled>End Time</option>
                        {formData.endTime && !TIME_OPTIONS.includes(formData.endTime) && (
                          <option value={formData.endTime}>{formData.endTime}</option>
                        )}
                        {TIME_OPTIONS.map((time) => (
                          <option key={`end-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    {formData.startTime && formData.endTime && (
                      <div style={{
                        fontSize: '0.6875rem',
                        color: '#0369A1',
                        fontWeight: '600',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⏱️</span>
                        <span>{formData.startTime} – {formData.endTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Point 8: Exam Hall / Location */}
                  <div className="form-group">
                    <label htmlFor="examHall">
                      8. Exam Hall / Location
                    </label>
                    <input
                      type="text"
                      id="examHall"
                      name="examHall"
                      value={formData.examHall}
                      onChange={handleInputChange}
                      placeholder="e.g. Main Hall, Room 102, Lab 1"
                    />
                  </div>

                  {/* Point 9: Teacher / Lecturer Name */}
                  <div className="form-group">
                    <label htmlFor="teacherName">
                      9. Teacher / Lecturer Name
                    </label>
                    <input
                      type="text"
                      id="teacherName"
                      name="teacherName"
                      value={formData.teacherName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled from selected Subject"
                    />
                  </div>

                  {/* Point 10: Parent/Guardian Contact Number */}
                  <div className="form-group">
                    <label htmlFor="guardianContact">
                      10. Parent / Guardian Contact Number
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <span style={{
                        padding: '0.4375rem 0.625rem',
                        background: '#E2E8F0',
                        border: '1.5px solid #E2E8F0',
                        borderRight: 'none',
                        borderRadius: '5px 0 0 5px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#475569'
                      }}>
                        +94
                      </span>
                      <input
                        type="tel"
                        id="guardianContact"
                        name="guardianContact"
                        value={formData.guardianContact}
                        onChange={handleGuardianContactChange}
                        placeholder="771234567"
                        maxLength="9"
                        style={{ borderRadius: '0 5px 5px 0' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleReset}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading 
                      ? (editingExam ? 'Updating...' : 'Saving...') 
                      : (editingExam ? 'Update Exam' : 'Register Exam')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clean Exam Records Table */}
          <div className="exam-records-section">
            <h2>Exam Registrations ({filteredExams.length})</h2>
            {examRecords.length === 0 ? (
              <div className="empty-state">
                <p>No exam records found. Click "+ Register Exam" to create one.</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="empty-state">
                <p>No exam registrations match your search.</p>
              </div>
            ) : (
              <div className="exam-table-container">
                <table className="exam-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Grade / Class</th>
                      <th>Subject</th>
                      <th>Exam Name</th>
                      <th>Exam Date</th>
                      <th>Exam Time</th>
                      <th>Hall / Location</th>
                      <th>Teacher</th>
                      <th>Guardian Contact</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => {
                      const studentId = exam.studentIdNumber || exam.studentId?.studentId || '-';
                      const studentName = exam.studentName || exam.studentId?.name || (exam.firstName ? `${exam.firstName} ${exam.lastName || ''}`.trim() : '-');
                      const grade = exam.grade || '-';
                      const subject = exam.subject || (exam.exams && exam.exams.map(e => e.subjectName).join(', ')) || exam.exam || '-';
                      const examName = exam.examName || exam.exam || '-';
                      const examDate = exam.examDate ? formatDate(exam.examDate) : '-';
                      const examTime = exam.examTime || '-';
                      const examHall = exam.examHall || '-';
                      const teacher = exam.teacherName || '-';
                      const contact = exam.guardianContact || exam.guardianTelephone || exam.mobile || exam.studentId?.guardianTelephone || '-';

                      return (
                        <tr key={exam._id}>
                          <td className="student-id-cell">{studentId}</td>
                          <td className="student-name-cell">{studentName}</td>
                          <td>
                            {grade !== '-' ? (
                              <span style={{
                                padding: '2px 6px',
                                background: '#F1F5F9',
                                color: '#334155',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: '600'
                              }}>
                                {grade}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="exam-subject-cell">
                            <span className="exam-badge">{subject}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#0369A1' }}>{examName}</strong>
                          </td>
                          <td>{examDate}</td>
                          <td>{examTime}</td>
                          <td>{examHall}</td>
                          <td>{teacher}</td>
                          <td>{contact}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="exam-actions" style={{ justifyContent: 'center' }}>
                              <button
                                className="edit-btn"
                                onClick={() => handleEdit(exam)}
                                title="Edit Exam"
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(exam._id)}
                                title="Delete Exam"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
