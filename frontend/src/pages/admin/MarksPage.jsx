import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './MarksPage.css';

// Auto calculate academic grade from marks:
// >= 75: A, >= 65: B, >= 55: C, >= 35: S, < 35: F
export const calculateGrade = (marksVal) => {
  if (marksVal === '' || marksVal === null || marksVal === undefined) return '';
  const num = parseFloat(marksVal);
  if (isNaN(num)) return '';
  if (num > 100 || num < 0) return '';
  if (num >= 75) return 'A';
  if (num >= 65) return 'B';
  if (num >= 55) return 'C';
  if (num >= 35) return 'S';
  return 'F';
};

const MarksPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [marksRecords, setMarksRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [validatedStudent, setValidatedStudent] = useState(null);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [studentValidationError, setStudentValidationError] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [editingMarks, setEditingMarks] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedResultGrade, setSelectedResultGrade] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [teachers, setTeachers] = useState([]);
  const [examType, setExamType] = useState('1st Term Test');
  const [customExamType, setCustomExamType] = useState('');
  const [showCustomExamType, setShowCustomExamType] = useState(false);

  const token = localStorage.getItem('adminToken');

  const [activeTab, setActiveTab] = useState('marks');
  const [paperSubmissions, setPaperSubmissions] = useState([]);
  const [viewingSubmission, setViewingSubmission] = useState(null);

  useEffect(() => {
    fetchMarks();
    fetchSubjects();
    fetchAllStudents();
    fetchTeachers();
    fetchPaperSubmissions();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const teacherList = data.data
          .filter(emp => !emp.role || emp.role.toLowerCase().includes('teach') || emp.role.toLowerCase().includes('lectur'))
          .map(emp => emp.name);
        setTeachers(teacherList);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Use subjects from database with teacher information
        const subjects = data.data.map(sub => ({
          id: sub._id,
          name: sub.name,
          teacherName: sub.conductedBy?.name || ''
        }));
        setAvailableSubjects(subjects);
      } else {
        // If no subjects exist, use test subjects as fallback
        const testSubjects = [
          { id: 'test1', name: 'test1', teacherName: '' },
          { id: 'test2', name: 'test2', teacherName: '' }
        ];
        setAvailableSubjects(testSubjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      const testSubjects = [
        { id: 'test1', name: 'test1', teacherName: '' },
        { id: 'test2', name: 'test2', teacherName: '' }
      ];
      setAvailableSubjects(testSubjects);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchMarks = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMarksRecords(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  const fetchPaperSubmissions = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/exam-submissions`);
      const data = await res.json();
      if (data.success) setPaperSubmissions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error fetching paper submissions:', err);
    }
  };

  // Dynamic Options for Subject, Teacher, Student Grade
  const subjectOptions = React.useMemo(() => {
    const set = new Set();
    availableSubjects.forEach(s => {
      if (s.name) set.add(s.name.trim());
    });
    marksRecords.forEach(record => {
      record.subjects?.forEach(sub => {
        const name = typeof sub.subjectId === 'object' ? sub.subjectId?.name : (sub.subjectName || '');
        if (name) set.add(name.trim());
      });
    });
    return ['All', ...Array.from(set).sort()];
  }, [availableSubjects, marksRecords]);

  const teacherOptions = React.useMemo(() => {
    const set = new Set();
    teachers.forEach(t => {
      if (t) set.add(t.trim());
    });
    availableSubjects.forEach(s => {
      if (s.teacherName) set.add(s.teacherName.trim());
    });
    marksRecords.forEach(record => {
      record.subjects?.forEach(sub => {
        const teacher = typeof sub.subjectId === 'object' ? sub.subjectId?.conductedBy?.name : '';
        if (teacher) set.add(teacher.trim());
      });
    });
    return ['All', ...Array.from(set).sort()];
  }, [teachers, availableSubjects, marksRecords]);

  const gradeOptions = React.useMemo(() => {
    const set = new Set();
    allStudents.forEach(s => {
      if (s.grade) set.add(s.grade.trim());
    });
    marksRecords.forEach(record => {
      if (record.studentId?.grade) {
        set.add(record.studentId.grade.trim());
      }
    });
    if (set.size === 0) {
      for (let i = 1; i <= 13; i++) {
        set.add(`Grade ${i}`);
      }
    }
    return ['All', ...Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA !== numB ? numA - numB : a.localeCompare(b);
    })];
  }, [allStudents, marksRecords]);

  const examTypeOptions = React.useMemo(() => {
    const set = new Set([
      '1st Term Test',
      '2nd Term Test',
      '3rd Term Test',
      'Mid Term Exam',
      'Final Exam',
      'Monthly Test',
      'Mock Exam'
    ]);
    marksRecords.forEach(record => {
      if (record.examType) set.add(record.examType.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [marksRecords]);

  // Get student suggestions based on search input
  const getStudentSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];

    allStudents.forEach(student => {
      const studentName = (student.name || '').trim().toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      
      // Check if search matches student ID
      if (studentId.includes(searchLower)) {
        suggestions.push({
          ...student,
          matchType: 'ID',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
        return;
      }

      // Split student's full name into parts
      const nameParts = studentName.split(/\s+/).filter(part => part.length > 0);
      const firstName = nameParts.length > 0 ? nameParts[0] : '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      const fullName = studentName;

      // Check if search matches first name, last name, or full name (partial match)
      const matchesFirstName = firstName && firstName.startsWith(searchLower);
      const matchesLastName = lastName && lastName.startsWith(searchLower);
      const matchesFullName = fullName.includes(searchLower);
      
      // Check if search matches any part of the name
      const matchesAnyPart = nameParts.some(part => part.startsWith(searchLower));

      if (matchesFirstName || matchesLastName || matchesFullName || matchesAnyPart) {
        suggestions.push({
          ...student,
          matchType: 'Name',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
      }
    });

    // Sort: exact ID matches first, then name matches
    return suggestions.sort((a, b) => {
      if (a.matchType === 'ID' && b.matchType !== 'ID') return -1;
      if (a.matchType !== 'ID' && b.matchType === 'ID') return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 10); // Limit to 10 suggestions
  };

  const handleStudentSearchChange = (e) => {
    const searchTerm = e.target.value;
    setStudentIdInput(searchTerm);
    
    if (searchTerm.trim()) {
      const suggestions = getStudentSuggestions(searchTerm);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setValidatedStudent(null);
    setStudentValidationError('');
    setSubjectMarks([]);
  };

  const handleStudentSuggestionSelect = async (student) => {
    setStudentIdInput(`${student.name} (ID: ${student.studentId})`);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    
    // Validate the selected student through the backend
    setValidatingStudent(true);
    setStudentValidationError('');
    
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/validate-student/${student.studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.valid) {
        setValidatedStudent(data.data);
        setSubjectMarks([{
          subjectId: '',
          subjectName: '',
          marks: '',
          grade: ''
        }]);
        setStudentValidationError('');
      } else {
        setStudentValidationError(data.message || 'Invalid Student ID. Student not found.');
        setValidatedStudent(null);
        setSubjectMarks([]);
      }
    } catch (err) {
      setStudentValidationError('Network error. Please try again.');
      setValidatedStudent(null);
      setSubjectMarks([]);
    } finally {
      setValidatingStudent(false);
    }
  };

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID, first name, last name, or full name');
      return;
    }

    // If student is already selected from suggestions, skip validation
    if (validatedStudent) {
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);
    setSubjectMarks([]);

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/validate-student/${studentIdInput.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.valid) {
        setValidatedStudent(data.data);
        // Initialize with one empty subject entry
        setSubjectMarks([{
          subjectId: '',
          subjectName: '',
          marks: '',
          grade: ''
        }]);
        setStudentValidationError('');
      } else {
        setStudentValidationError(data.message || 'Invalid Student ID. Student not found.');
        setValidatedStudent(null);
        setSubjectMarks([]);
      }
    } catch (err) {
      setStudentValidationError('Network error. Please try again.');
      setValidatedStudent(null);
      setSubjectMarks([]);
    } finally {
      setValidatingStudent(false);
    }
  };

  const handleSubjectMarksChange = (index, field, value) => {
    const updatedMarks = [...subjectMarks];
    updatedMarks[index][field] = value;
    
    // If subject is changed, update subjectName as well
    if (field === 'subjectId') {
      const selectedSubject = availableSubjects.find(sub => sub.id === value);
      updatedMarks[index].subjectName = selectedSubject ? selectedSubject.name : '';
    }

    // Auto-calculate grade when marks are entered or modified
    if (field === 'marks') {
      const autoGrade = calculateGrade(value);
      updatedMarks[index].grade = autoGrade;
    }
    
    setSubjectMarks(updatedMarks);
  };

  const handleAddSubject = () => {
    setSubjectMarks([...subjectMarks, {
      subjectId: '',
      subjectName: '',
      marks: '',
      grade: ''
    }]);
  };

  const handleRemoveSubject = (index) => {
    if (subjectMarks.length > 1) {
      const updatedMarks = subjectMarks.filter((_, i) => i !== index);
      setSubjectMarks(updatedMarks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all subjects have subject selected, marks and grade
    const incompleteSubjects = subjectMarks.filter(sub => !sub.subjectId || !sub.marks || !sub.grade);
    if (incompleteSubjects.length > 0) {
      setError('Please select subject, enter marks and grade for all entries');
      setLoading(false);
      return;
    }

    // Validate no duplicate subjects
    const subjectIds = subjectMarks.map(sub => sub.subjectId);
    const duplicateSubjects = subjectIds.filter((id, index) => subjectIds.indexOf(id) !== index);
    if (duplicateSubjects.length > 0) {
      setError('Each subject can only be added once. Please remove duplicate subjects.');
      setLoading(false);
      return;
    }

    // Validate marks range (0-100)
    const invalidMarks = subjectMarks.filter(sub => {
      const marks = parseFloat(sub.marks);
      return isNaN(marks) || marks < 0 || marks > 100;
    });
    if (invalidMarks.length > 0) {
      setError('Marks must be between 0 and 100');
      setLoading(false);
      return;
    }

    try {
      const subjectsData = subjectMarks.map(sub => ({
        subjectId: sub.subjectId,
        marks: parseFloat(sub.marks),
        grade: sub.grade.trim()
      }));

      const url = editingMarks 
        ? `${API_CONFIG.API_URL}/marks/${editingMarks._id}`
        : `${API_CONFIG.API_URL}/marks`;
      
      const method = editingMarks ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: validatedStudent.studentId,
          examType: showCustomExamType ? customExamType.trim() || examType : examType,
          subjects: subjectsData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchMarks();
        showSuccess(editingMarks ? 'Marks Updated' : 'Marks Recorded', editingMarks ? 'Student marks have been updated successfully.' : 'Student marks have been recorded successfully.');
        resetForm();
        setShowForm(false);
      } else {
        setError(data.message || `Failed to ${editingMarks ? 'update' : 'add'} marks`);
        showError('Save Failed', data.message || `Failed to ${editingMarks ? 'update' : 'add'} marks`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (marksRecord) => {
    setViewingRecord(null);
    setEditingMarks(marksRecord);
    setStudentIdInput(marksRecord.studentId?.studentId || '');
    setValidatedStudent({
      studentId: marksRecord.studentId?._id,
      name: marksRecord.studentId?.name || 'Unknown Student',
      studentIdField: marksRecord.studentId?.studentId || '',
      subjects: (marksRecord.subjects || []).map(sub => sub.subjectId)
    });

    // Restore exam type
    const recExamType = marksRecord.examType || '1st Term Test';
    const knownTypes = ['1st Term Test', '2nd Term Test', '3rd Term Test', 'Mid Term Exam', 'Final Exam', 'Monthly Test', 'Mock Exam'];
    if (knownTypes.includes(recExamType)) {
      setExamType(recExamType);
      setShowCustomExamType(false);
      setCustomExamType('');
    } else {
      setExamType('Custom...');
      setShowCustomExamType(true);
      setCustomExamType(recExamType);
    }

    // Initialize subject marks from existing record
    const initialMarks = marksRecord.subjects.map(sub => {
      const subjectId = typeof sub.subjectId === 'object' ? sub.subjectId._id : sub.subjectId;
      const subjectName = typeof sub.subjectId === 'object' ? sub.subjectId.name : '';
      // If subject is not in availableSubjects, use the subjectId as fallback
      const foundSubject = availableSubjects.find(s => s.id === subjectId || s.name === subjectName);
      return {
        subjectId: foundSubject ? foundSubject.id : subjectId,
        subjectName: foundSubject ? foundSubject.name : subjectName,
        marks: sub.marks.toString(),
        grade: sub.grade
      };
    });
    setSubjectMarks(initialMarks);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Marks?',
      message: 'Are you sure you want to delete this marks record? This action cannot be undone.',
      confirmText: 'Delete Marks',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchMarks();
        showSuccess('Marks Deleted', 'Marks record removed successfully.');
      } else {
        showError('Delete Failed', data.message || 'Failed to delete marks');
      }
    } catch (err) {
      console.error('Error deleting marks:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setStudentIdInput('');
    setValidatedStudent(null);
    setSubjectMarks([]);
    setEditingMarks(null);
    setStudentValidationError('');
    setError('');
    setExamType('1st Term Test');
    setCustomExamType('');
    setShowCustomExamType(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const isAnyFilterActive = 
    selectedSubject !== 'All' || 
    selectedTeacher !== 'All' || 
    selectedGrade !== 'All' || 
    selectedResultGrade !== 'All' || 
    selectedExamType !== 'All' ||
    searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setSelectedSubject('All');
    setSelectedTeacher('All');
    setSelectedGrade('All');
    setSelectedResultGrade('All');
    setSelectedExamType('All');
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchMarks(), fetchSubjects(), fetchAllStudents(), fetchTeachers()]);
      handleResetFilters();
      showSuccess('Refreshed', 'Marks records and filters refreshed successfully');
    } catch (err) {
      showError('Refresh Failed', 'Unable to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMarks = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return marksRecords.filter((record) => {
      // 0. Search term filter
      if (term) {
        const studentName = record.studentId?.name || '';
        const studentId = record.studentId?.studentId || '';
        const studentGrade = record.studentId?.grade || '';
        const subjects = record.subjects || [];
        const subjectNames = subjects
          .map((sub) => (typeof sub.subjectId === 'object' ? sub.subjectId?.name : (sub.subjectName || '')))
          .join(' ');
        const teacherNames = subjects
          .map((sub) => (typeof sub.subjectId === 'object' ? sub.subjectId?.conductedBy?.name : ''))
          .join(' ');

        const matchesSearch = [studentName, studentId, studentGrade, subjectNames, teacherNames]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // 1. Subject filter
      if (selectedSubject !== 'All') {
        const targetSub = selectedSubject.toLowerCase();
        const hasMatchingSubject = record.subjects?.some((sub) => {
          const subName = (typeof sub.subjectId === 'object' ? sub.subjectId?.name : sub.subjectName) || '';
          return subName.toLowerCase() === targetSub;
        });
        if (!hasMatchingSubject) return false;
      }

      // 2. Teacher filter
      if (selectedTeacher !== 'All') {
        const targetTeacher = selectedTeacher.toLowerCase();
        const hasMatchingTeacher = record.subjects?.some((sub) => {
          const teacher = (typeof sub.subjectId === 'object' ? sub.subjectId?.conductedBy?.name : '') || '';
          const subId = typeof sub.subjectId === 'object' ? sub.subjectId?._id : sub.subjectId;
          const foundSub = availableSubjects.find(s => s.id === subId);
          const fallbackTeacher = foundSub?.teacherName || '';
          return teacher.toLowerCase() === targetTeacher || fallbackTeacher.toLowerCase() === targetTeacher;
        });
        if (!hasMatchingTeacher) return false;
      }

      // 3. Student Grade filter
      if (selectedGrade !== 'All') {
        const studentGrade = record.studentId?.grade || '';
        if (studentGrade !== selectedGrade) {
          return false;
        }
      }

      // 4. Result Grade filter (A, B, C, S, F)
      if (selectedResultGrade !== 'All') {
        const targetResult = selectedResultGrade.toUpperCase();
        const hasMatchingResult = record.subjects?.some((sub) => {
          if (selectedSubject !== 'All') {
            const subName = (typeof sub.subjectId === 'object' ? sub.subjectId?.name : sub.subjectName) || '';
            if (subName.toLowerCase() === selectedSubject.toLowerCase()) {
              return (sub.grade || '').toUpperCase() === targetResult;
            }
            return false;
          }
          return (sub.grade || '').toUpperCase() === targetResult;
        });
        if (!hasMatchingResult) return false;
      }

      // 5. Exam Type filter
      if (selectedExamType !== 'All') {
        const recExamType = record.examType || '1st Term Test';
        if (recExamType !== selectedExamType) return false;
      }

      return true;
    });
  }, [marksRecords, searchTerm, selectedSubject, selectedTeacher, selectedGrade, selectedResultGrade, selectedExamType, availableSubjects]);

  const handleGenerateReport = () => {
    if (!filteredMarks.length) {
      showWarning('No Marks Records', 'No marks records available to generate a report.');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Grade', 'Exam Type', 'Subject', 'Marks', 'Result'];

    const rows = filteredMarks.flatMap((record) => {
      const studentName = record.studentId?.name || '';
      const studentId = record.studentId?.studentId || '';
      const studentGrade = record.studentId?.grade || '-';
      const recExamType = record.examType || '1st Term Test';

      if (!record.subjects || record.subjects.length === 0) {
        return [[studentId, studentName, studentGrade, recExamType, 'N/A', '-', '-']];
      }

      let relevantSubjects = record.subjects;
      if (selectedSubject !== 'All') {
        relevantSubjects = relevantSubjects.filter(sub => {
          const subName = typeof sub.subjectId === 'object' ? sub.subjectId?.name : (sub.subjectName || '');
          return subName.toLowerCase() === selectedSubject.toLowerCase();
        });
      }
      if (selectedResultGrade !== 'All') {
        relevantSubjects = relevantSubjects.filter(sub => (sub.grade || '').toUpperCase() === selectedResultGrade.toUpperCase());
      }

      if (relevantSubjects.length === 0) {
        relevantSubjects = record.subjects;
      }

      return relevantSubjects.map((subjectEntry) => {
        const subject =
          typeof subjectEntry.subjectId === 'object' ? subjectEntry.subjectId : null;
        return [
          studentId,
          studentName,
          studentGrade,
          recExamType,
          subject?.name || 'Unknown Subject',
          subjectEntry.marks !== undefined && subjectEntry.marks !== null ? String(subjectEntry.marks) : '0',
          subjectEntry.grade ?? '-'
        ];
      });
    });

    generatePdfReport({
      title: 'Academic Performance & Examination Marks Directory',
      subtitle: 'Wisdom Institute of Higher Education • Official Academic Grade Sheet',
      filename: `marks-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      filterInfo: [
        ...(searchTerm ? [{ label: 'Search Query', value: searchTerm }] : []),
        ...(selectedSubject !== 'All' ? [{ label: 'Subject Filter', value: selectedSubject }] : []),
        ...(selectedTeacher !== 'All' ? [{ label: 'Teacher Filter', value: selectedTeacher }] : []),
        ...(selectedGrade !== 'All' ? [{ label: 'Student Grade Filter', value: selectedGrade }] : []),
        ...(selectedResultGrade !== 'All' ? [{ label: 'Result Grade Filter', value: selectedResultGrade }] : []),
        ...(selectedExamType !== 'All' ? [{ label: 'Exam Type Filter', value: selectedExamType }] : [])
      ],
      summaryCards: [
        { label: 'Total Student Profiles', value: filteredMarks.length },
        { label: 'Total Subject Assessments', value: rows.length, color: 'green' }
      ]
    });
    toastSuccess('Marks PDF report downloaded successfully');
  };

  return (
    <div className="marks-page">
      <Sidebar />
      <div className="marks-main-content">
        <Topbar userName="Wisdom Admin" />
        
        <div className="marks-content">
          <div className="marks-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>Marks Management</h1>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('marks')}
                  style={{
                    padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '0.82rem',
                    background: activeTab === 'marks' ? '#fff' : 'transparent',
                    color: activeTab === 'marks' ? '#1e293b' : '#64748b',
                    boxShadow: activeTab === 'marks' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Marks Records
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('submissions'); fetchPaperSubmissions(); }}
                  style={{
                    padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '0.82rem',
                    background: activeTab === 'submissions' ? '#fff' : 'transparent',
                    color: activeTab === 'submissions' ? '#6366f1' : '#64748b',
                    boxShadow: activeTab === 'submissions' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Paper Submissions {paperSubmissions.length > 0 && (
                    <span style={{ background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '0 7px', fontSize: '0.7rem', marginLeft: '4px' }}>
                      {paperSubmissions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            {activeTab === 'marks' && (
            <div className="marks-header-actions">
              <div className="marks-search">
                <input
                  type="text"
                  placeholder="Search by student or subject"
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
                disabled={filteredMarks.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-marks-btn" 
                onClick={() => {
                  if (showForm) {
                    handleCancel();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add Marks'}
              </button>
            </div>
            )}
          </div>

          {activeTab === 'submissions' && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748b' }}>
                Exam papers submitted by students. Click <strong>View Paper</strong> to see their answers and marks.
              </p>
              {paperSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '600' }}>No submissions yet</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Students will appear here after they submit an exam paper.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        {['Student ID', 'Student Name', 'Paper Title', 'Subject', 'Grade', 'Marks', '%', 'Result', 'Submitted', 'Action'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paperSubmissions.map((sub, i) => (
                        <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: '600' }}>{sub.studentId}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem' }}>{sub.studentName || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.paperTitle}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem' }}>{sub.subject}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem' }}>{sub.grade || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: '700' }}>{sub.earnedMarks}/{sub.totalMarks}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: '700', color: '#6366f1' }}>{sub.percentage}%</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: sub.passed ? '#dcfce7' : '#fee2e2', color: sub.passed ? '#15803d' : '#b91c1c' }}>
                              {sub.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              type="button"
                              onClick={() => setViewingSubmission(sub)}
                              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '7px', padding: '5px 14px', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              View Paper
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'marks' && (
          <>

          {showForm && (
            <div className="marks-form-container">
              <h2>{editingMarks ? 'Edit Marks' : 'Add Marks'}</h2>
              <form onSubmit={handleSubmit} className="marks-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label htmlFor="studentId">Student ID or Name <span className="required">*</span></label>
                  <div className="student-id-input-group">
                    <div className="student-search-container" style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        id="studentId"
                        value={studentIdInput}
                        onChange={handleStudentSearchChange}
                        onFocus={() => {
                          if (studentIdInput && !editingMarks) {
                            const suggestions = getStudentSuggestions(studentIdInput);
                            setStudentSuggestions(suggestions);
                            setShowSuggestions(suggestions.length > 0);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Type Student ID, first name, last name, or full name..."
                        disabled={!!editingMarks}
                        required
                        autoComplete="off"
                        style={{ width: '100%' }}
                      />
                      {showSuggestions && studentSuggestions.length > 0 && !editingMarks && (
                        <div className="student-suggestions-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          marginTop: '2px'
                        }}>
                          {studentSuggestions.map((student, index) => (
                            <div
                              key={student._id || index}
                              onClick={() => handleStudentSuggestionSelect(student)}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: index < studentSuggestions.length - 1 ? '1px solid #eee' : 'none'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                              <div style={{ fontSize: '0.9em', color: '#666' }}>ID: {student.studentId}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!editingMarks && (
                      <button
                        type="button"
                        className="validate-btn"
                        onClick={validateStudentId}
                        disabled={validatingStudent || !studentIdInput.trim()}
                      >
                        {validatingStudent ? 'Validating...' : 'Validate'}
                      </button>
                    )}
                  </div>
                  {studentValidationError && (
                    <div className="validation-error">{studentValidationError}</div>
                  )}
                  {validatedStudent && (
                    <div className="validation-success">
                      ✓ Valid Student: {validatedStudent.name} ({validatedStudent.studentIdField})
                    </div>
                  )}
                </div>

                {validatedStudent && (
                  <div className="form-group">
                    <label htmlFor="examType">Exam Type <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        id="examType"
                        value={examType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExamType(val);
                          setShowCustomExamType(val === 'Custom...');
                          if (val !== 'Custom...') setCustomExamType('');
                        }}
                        style={{ flex: '1', minWidth: '180px' }}
                        required
                      >
                        <option value="1st Term Test">1st Term Test</option>
                        <option value="2nd Term Test">2nd Term Test</option>
                        <option value="3rd Term Test">3rd Term Test</option>
                        <option value="Mid Term Exam">Mid Term Exam</option>
                        <option value="Final Exam">Final Exam</option>
                        <option value="Monthly Test">Monthly Test</option>
                        <option value="Mock Exam">Mock Exam</option>
                        <option value="Custom...">Custom...</option>
                      </select>
                      {showCustomExamType && (
                        <input
                          type="text"
                          value={customExamType}
                          onChange={(e) => setCustomExamType(e.target.value)}
                          placeholder="Enter exam name..."
                          style={{ flex: '1', minWidth: '160px' }}
                          required
                        />
                      )}
                    </div>
                  </div>
                )}

                {validatedStudent && (
                  <div className="subjects-marks-section">
                    <div className="subjects-marks-header">
                      <h3>Add Subject Marks</h3>
                      <button
                        type="button"
                        className="add-subject-btn"
                        onClick={handleAddSubject}
                      >
                        + Add Subject
                      </button>
                    </div>
                    <div className="subjects-marks-list">
                      {subjectMarks.map((subject, index) => (
                        <div key={index} className="subject-marks-item">
                          <div className="subject-select-group">
                            <label>Subject <span className="required">*</span></label>
                            <select
                              value={subject.subjectId}
                              onChange={(e) => handleSubjectMarksChange(index, 'subjectId', e.target.value)}
                              required
                            >
                              <option value="" disabled>Select Subject</option>
                              {availableSubjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="marks-inputs">
                            <div className="marks-input-group">
                              <label>Marks (0-100) <span className="required">*</span></label>
                              <input
                                type="number"
                                value={subject.marks}
                                onChange={(e) => handleSubjectMarksChange(index, 'marks', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="0-100"
                                required
                              />
                            </div>
                            <div className="marks-input-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Grade <span className="required">*</span></label>
                                {subject.grade && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: '700',
                                      padding: '1px 8px',
                                      borderRadius: '10px',
                                      backgroundColor:
                                        subject.grade === 'A' ? '#dcfce7' :
                                        subject.grade === 'B' ? '#e0f2fe' :
                                        subject.grade === 'C' ? '#fef9c3' :
                                        subject.grade === 'S' ? '#ede9fe' : '#fee2e2',
                                      color:
                                        subject.grade === 'A' ? '#15803d' :
                                        subject.grade === 'B' ? '#0369a1' :
                                        subject.grade === 'C' ? '#a16207' :
                                        subject.grade === 'S' ? '#6d28d9' : '#b91c1c'
                                    }}
                                  >
                                    Auto: {subject.grade}
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={subject.grade}
                                onChange={(e) => handleSubjectMarksChange(index, 'grade', e.target.value.toUpperCase())}
                                placeholder="Auto (A, B, C, S, F)"
                                required
                                maxLength="5"
                              />
                            </div>
                          </div>
                          {subjectMarks.length > 1 && (
                            <button
                              type="button"
                              className="remove-subject-btn"
                              onClick={() => handleRemoveSubject(index)}
                              title="Remove this subject"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validatedStudent && (
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading 
                        ? (editingMarks ? 'Updating...' : 'Saving...') 
                        : (editingMarks ? 'Update Marks' : 'Save Marks')
                      }
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Filters Toolbar */}
          <div className="marks-filter-toolbar">
            <div className="marks-filter-dropdowns">
              {/* 1. Subject Filter */}
              <div className="marks-filter-item">
                <label>Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {subjectOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === 'All' ? 'All Subjects' : sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Teacher Filter */}
              <div className="marks-filter-item">
                <label>Teacher:</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  {teacherOptions.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher === 'All' ? 'All Teachers' : teacher}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Student Grade Filter */}
              <div className="marks-filter-item">
                <label>Grade:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g === 'All' ? 'All Grades' : g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Result Grade Filter */}
              <div className="marks-filter-item">
                <label>Result:</label>
                <select
                  value={selectedResultGrade}
                  onChange={(e) => setSelectedResultGrade(e.target.value)}
                >
                  <option value="All">All Results (A-F)</option>
                  <option value="A">Grade A (75-100)</option>
                  <option value="B">Grade B (65-74)</option>
                  <option value="C">Grade C (55-64)</option>
                  <option value="S">Grade S (35-54)</option>
                  <option value="F">Grade F (0-34)</option>
                </select>
              </div>

              {/* 5. Exam Type Filter */}
              <div className="marks-filter-item">
                <label>Exam:</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                >
                  {examTypeOptions.map((et) => (
                    <option key={et} value={et}>
                      {et === 'All' ? 'All Exam Types' : et}
                    </option>
                  ))}
                </select>
              </div>

              {isAnyFilterActive && (
                <button
                  type="button"
                  className="marks-reset-filters-btn"
                  onClick={handleResetFilters}
                  title="Clear all active filters"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>

            <div className="marks-filter-meta">
              <span className="marks-count-badge">
                Showing <strong>{filteredMarks.length}</strong> of {marksRecords.length} records
              </span>
              <button
                type="button"
                className="marks-refresh-btn"
                onClick={handleRefresh}
                title="Refresh latest marks and reset filters"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="marks-table">
            {marksRecords.length === 0 ? (
              <div className="empty-state">
                <p>No marks records added yet. Click "Add Marks" to get started.</p>
              </div>
            ) : filteredMarks.length === 0 ? (
              <div className="empty-state">
                <p>No marks records match your search or filter criteria.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Exam Type</th>
                    <th>Subjects & Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarks.map((record) => (
                    <tr key={record._id}>
                      <td>{record.studentId?.studentId || '-'}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {record.studentId?.name || '-'}
                        </div>
                        {record.studentId?.grade && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            {record.studentId.grade}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          whiteSpace: 'nowrap'
                        }}>
                          {record.examType || '1st Term Test'}
                        </span>
                      </td>
                      <td>
                        <div className="subjects-summary-cell">
                          <div className="subjects-summary-text">
                            <span style={{ fontWeight: '600' }}>
                              {record.subjects?.length
                                ? `${record.subjects.length} subject${record.subjects.length === 1 ? '' : 's'}`
                                : 'No subjects recorded'}
                            </span>
                            {record.subjects && record.subjects.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {record.subjects.slice(0, 3).map((sub, sIdx) => {
                                  const subName = typeof sub.subjectId === 'object' ? sub.subjectId?.name : (sub.subjectName || '');
                                  return (
                                    <span
                                      key={sIdx}
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        background: '#f1f5f9',
                                        color: '#334155',
                                        border: '1px solid #e2e8f0',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <span>{subName || 'Subject'}</span>
                                      <strong style={{
                                        color:
                                          sub.grade === 'A' ? '#15803d' :
                                          sub.grade === 'B' ? '#0369a1' :
                                          sub.grade === 'C' ? '#a16207' :
                                          sub.grade === 'S' ? '#6d28d9' : '#b91c1c'
                                      }}>
                                        {sub.grade || '-'}
                                      </strong>
                                    </span>
                                  );
                                })}
                                {record.subjects.length > 3 && (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    +{record.subjects.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="view-subjects-btn"
                            onClick={() => setViewingRecord(record)}
                            disabled={!record.subjects || record.subjects.length === 0}
                          >
                            View
                          </button>
                        </div>
                      </td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(record)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(record._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {viewingRecord && (
        <div className="marks-modal-overlay" onClick={() => setViewingRecord(null)}>
          <div className="marks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="marks-modal-header">
              <div>
                <h2>Subject Results</h2>
                <p>
                  {viewingRecord.studentId?.name || 'Unknown Student'} •{' '}
                  {viewingRecord.studentId?.studentId || '--'}
                </p>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  marginTop: '4px'
                }}>
                  {viewingRecord.examType || '1st Term Test'}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingRecord(null)}
              >
                Close
              </button>
            </div>
            <div className="marks-modal-body">
              {viewingRecord.subjects && viewingRecord.subjects.length > 0 ? (
                <div className="marks-modal-list">
                  {viewingRecord.subjects.map((sub, index) => {
                    const subject = typeof sub.subjectId === 'object' ? sub.subjectId : null;
                    return (
                      <div key={index} className="marks-modal-item">
                        <div className="marks-modal-item-top">
                          <span className="marks-modal-subject">
                            {subject?.name || 'Unknown Subject'}
                          </span>
                          <span className="marks-modal-grade">{sub.grade}</span>
                        </div>
                        <div className="marks-modal-meta">
                          <span className="marks-modal-label">Marks</span>
                          <span className="marks-modal-value">{sub.marks}</span>
                          {subject?.conductedBy?.name && (
                            <span className="marks-modal-teacher">
                              Teacher: {subject.conductedBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="marks-modal-empty">
                  No subjects or marks recorded for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingSubmission && (
        <div className="marks-modal-overlay" onClick={() => setViewingSubmission(null)}>
          <div className="marks-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="marks-modal-header" style={{ background: '#6366f1' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>
                  {viewingSubmission.paperTitle || 'Exam Paper'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#e0e7ff', marginTop: '2px' }}>
                  {viewingSubmission.studentId} · {viewingSubmission.subject} · {viewingSubmission.grade} · {viewingSubmission.examType}
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setViewingSubmission(null)}>Close</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px',
                padding: '14px 18px', background: viewingSubmission.passed ? '#dcfce7' : '#fee2e2',
                borderRadius: '10px',
                border: `1px solid ${viewingSubmission.passed ? '#86efac' : '#fca5a5'}`
              }}>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{viewingSubmission.earnedMarks}/{viewingSubmission.totalMarks}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>MARKS</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#6366f1' }}>{viewingSubmission.percentage}%</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>PERCENTAGE</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: viewingSubmission.passed ? '#15803d' : '#b91c1c' }}>
                    {viewingSubmission.passed ? 'Passed' : 'Failed'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(viewingSubmission.answers || []).map((a, idx) => (
                  <div key={idx} style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px', padding: '12px 16px', background: '#fafafa'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>Q{a.questionNumber}. {a.questionText}</div>
                    <div style={{ fontSize: '0.83rem', marginTop: '8px' }}>
                      <strong>Student's Answer: </strong>{a.studentAnswer || 'No answer given'}
                    </div>
                    {a.correctAnswer && (
                      <div style={{ fontSize: '0.83rem' }}>
                        <strong>Correct Answer: </strong>{a.correctAnswer}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{a.earnedMarks}/{a.totalMarks} marks</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksPage;

