import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { authenticatedFetch } from '../../utils/apiHelper';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './StudentsPage.css';

const TIME_OPTIONS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
];

const DAY_OPTIONS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const GRADE_OPTIONS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'Grade 13'
];

/**
 * Auto-calculate school grade from Date of Birth.
 * Rule: Age 6 = Grade 1 (Grade = Age - 5)
 */
export const calculateGradeFromBirthdate = (birthdateStr) => {
  if (!birthdateStr) return '';
  const birthDate = new Date(birthdateStr);
  if (isNaN(birthDate.getTime())) return '';

  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();
  const age = currentYear - birthYear;

  if (age <= 0) return '';

  const gradeNum = age - 5;
  if (gradeNum <= 1) {
    return 'Grade 1';
  } else if (gradeNum >= 13) {
    return 'Grade 13';
  } else {
    return `Grade ${gradeNum}`;
  }
};

const INITIAL_FORM_STATE = {
  // 1. Student Details
  name: '',
  birthday: '',
  gender: '',
  studentId: '',
  grade: '',
  // 2. Parent / Guardian Details
  guardianName: '',
  guardianRelationship: 'Father',
  guardianTelephone: '',
  guardianEmail: '',
  guardianAddress: '',
  // 3. Class Details
  subject: '',
  teacherName: '',
  classType: 'Physical',
  classDay: 'Saturday',
  startTime: '08:30 AM',
  endTime: '10:30 AM',
  classLocation: '',
  // 4. Login Details (for LMS)
  username: '',
  password: '',
  // 5. Registration Details
  registrationDate: new Date().toISOString().split('T')[0],
  registrationStatus: 'Active',
  paymentStatus: 'Pending',
  admissionFee: '',
  monthlyClassFee: '',
  totalFee: 0
};

const StudentsPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Add Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [selectedStudentForSubject, setSelectedStudentForSubject] = useState(null);
  const [submittingAddSubject, setSubmittingAddSubject] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState('');
  const [addSubjectFormData, setAddSubjectFormData] = useState({
    subject: '',
    teacherName: '',
    classType: 'Physical',
    classDay: 'Saturday',
    startTime: '08:30 AM',
    endTime: '10:30 AM',
    classLocation: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationStatus: 'Active',
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    admissionFee: '0',
    monthlyClassFee: '',
    totalFee: 0
  });

  // Remove / Drop Subject Confirmation State
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState(null);
  const [submittingRemoveSubject, setSubmittingRemoveSubject] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await authenticatedFetch(`${API_CONFIG.API_URL}/students`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
        return data.data || [];
      } else {
        console.error('Failed to fetch students:', data.message);
        return [];
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      return [];
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      if (data.success && data.data) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'birthday') {
      const autoGrade = calculateGradeFromBirthdate(value);
      setFormData(prev => ({
        ...prev,
        birthday: value,
        grade: autoGrade || prev.grade
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  // Handle Admission Fee and Monthly Class Fee changes and auto-calculate Total Fee
  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    // Allow numbers and decimal
    const cleanVal = value.replace(/[^\d.]/g, '');
    setFormData(prev => {
      const adm = parseFloat(name === 'admissionFee' ? cleanVal : prev.admissionFee) || 0;
      const mon = parseFloat(name === 'monthlyClassFee' ? cleanVal : prev.monthlyClassFee) || 0;
      const calcTotal = Math.round((adm + mon) * 100) / 100;
      return {
        ...prev,
        [name]: cleanVal,
        totalFee: calcTotal
      };
    });
    setError('');
  };

  // Handle parent contact number input with Sri Lankan +94 format
  const handleGuardianTelephoneChange = (e) => {
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
      guardianTelephone: value
    }));
    setError('');
  };

  // When subject dropdown is changed, auto-fill teacher and default monthly price if available
  const handleSubjectChange = (e) => {
    const selectedName = e.target.value;
    const foundSubject = subjects.find(s => s.name === selectedName || s._id === selectedName);
    const assignedTeacher = foundSubject?.conductedBy?.name || '';
    const defaultSubjectPrice = (foundSubject?.price !== undefined && foundSubject?.price !== null) ? String(foundSubject.price) : '';

    setFormData(prev => {
      const monthlyFee = prev.monthlyClassFee !== '' ? prev.monthlyClassFee : defaultSubjectPrice;
      const adm = parseFloat(prev.admissionFee) || 0;
      const mon = parseFloat(monthlyFee) || 0;
      return {
        ...prev,
        subject: selectedName,
        teacherName: assignedTeacher || prev.teacherName,
        monthlyClassFee: monthlyFee,
        totalFee: Math.round((adm + mon) * 100) / 100
      };
    });
    setError('');
  };

  const handleEdit = (student) => {
    setEditingStudent(student);

    // Format dates (YYYY-MM-DD)
    const birthdayDate = student.birthday 
      ? new Date(student.birthday).toISOString().split('T')[0] 
      : '';
    const registrationDateValue = student.registrationDate 
      ? new Date(student.registrationDate).toISOString().split('T')[0] 
      : (student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : '');

    // Parse Guardian Phone (strip +94 / leading 0)
    let rawContact = student.guardianTelephone || student.mobile || '';
    if (rawContact.startsWith('+94')) {
      rawContact = rawContact.substring(3);
    } else if (rawContact.startsWith('0')) {
      rawContact = rawContact.substring(1);
    }
    rawContact = rawContact.replace(/\D/g, '');

    // Parse Subject name
    let subjectName = student.subject || '';
    if (!subjectName && student.subjects && student.subjects.length > 0) {
      const firstSub = student.subjects[0];
      subjectName = typeof firstSub === 'object' ? firstSub.name : firstSub;
    }

    // Parse Guardian Name
    const guardianFullName = student.guardianName || `${student.guardianFirstName || ''} ${student.guardianLastName || ''}`.trim();

    // Parse Class Time (split "08:30 AM - 10:30 AM")
    let startT = '08:30 AM';
    let endT = '10:30 AM';
    if (student.classTime && student.classTime.includes('-')) {
      const parts = student.classTime.split('-').map(p => p.trim());
      if (parts[0]) startT = parts[0];
      if (parts[1]) endT = parts[1];
    }

    const admFee = student.admissionFee !== undefined && student.admissionFee !== null ? String(student.admissionFee) : '';
    const monFee = student.monthlyClassFee !== undefined && student.monthlyClassFee !== null ? String(student.monthlyClassFee) : '';
    const totFee = student.totalFee !== undefined && student.totalFee !== null ? student.totalFee : (((parseFloat(admFee) || 0) + (parseFloat(monFee) || 0)) || (student.totalPrice || 0));

    setFormData({
      name: student.name || '',
      birthday: birthdayDate,
      gender: student.gender || '',
      studentId: student.studentId || '',
      grade: student.grade || '',
      guardianName: guardianFullName,
      guardianRelationship: student.guardianRelationship || 'Father',
      guardianTelephone: rawContact,
      guardianEmail: student.guardianEmail || '',
      guardianAddress: student.guardianAddress || '',
      subject: subjectName,
      teacherName: student.teacherName || '',
      classType: student.classType || 'Physical',
      classDay: student.classDay || 'Saturday',
      startTime: startT,
      endTime: endT,
      classLocation: student.classLocation || '',
      username: '',
      password: '',
      registrationDate: registrationDateValue || new Date().toISOString().split('T')[0],
      registrationStatus: student.registrationStatus || 'Active',
      paymentStatus: student.paymentStatus || 'Pending',
      admissionFee: admFee,
      monthlyClassFee: monFee,
      totalFee: totFee
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setFormData(INITIAL_FORM_STATE);
    setShowForm(false);
    setError('');
  };

  // Add Subject Handlers
  const handleOpenAddSubject = (student) => {
    setSelectedStudentForSubject(student);
    setAddSubjectError('');
    setAddSubjectFormData({
      subject: '',
      teacherName: '',
      classType: 'Physical',
      classDay: 'Saturday',
      startTime: '08:30 AM',
      endTime: '10:30 AM',
      classLocation: '',
      registrationDate: new Date().toISOString().split('T')[0],
      registrationStatus: 'Active',
      paymentStatus: 'Pending',
      paymentMethod: 'Cash',
      admissionFee: '0',
      monthlyClassFee: '',
      totalFee: 0
    });
    setShowAddSubjectModal(true);
  };

  const handleCloseAddSubject = () => {
    setShowAddSubjectModal(false);
    setSelectedStudentForSubject(null);
    setAddSubjectError('');
  };

  const handleAddSubjectChange = (e) => {
    const { name, value } = e.target;
    setAddSubjectFormData((prev) => ({ ...prev, [name]: value }));
    setAddSubjectError('');
  };

  const handleAddSubjectSelect = (e) => {
    const selectedSubName = e.target.value;
    const found = subjects.find(
      (s) => s.name === selectedSubName || s._id === selectedSubName
    );
    const teacher = found?.conductedBy?.name || '';
    const defaultPrice = found?.price !== undefined && found?.price !== null ? String(found.price) : '';

    setAddSubjectFormData((prev) => {
      const monthlyFee = defaultPrice || prev.monthlyClassFee;
      const adm = parseFloat(prev.admissionFee) || 0;
      const mon = parseFloat(monthlyFee) || 0;
      return {
        ...prev,
        subject: selectedSubName,
        teacherName: teacher || prev.teacherName,
        monthlyClassFee: monthlyFee,
        totalFee: Math.round((adm + mon) * 100) / 100
      };
    });
    setAddSubjectError('');
  };

  const handleAddSubjectFeeChange = (e) => {
    const { name, value } = e.target;
    const clean = value.replace(/[^\d.]/g, '');
    setAddSubjectFormData((prev) => {
      const adm = parseFloat(name === 'admissionFee' ? clean : prev.admissionFee) || 0;
      const mon = parseFloat(name === 'monthlyClassFee' ? clean : prev.monthlyClassFee) || 0;
      return {
        ...prev,
        [name]: clean,
        totalFee: Math.round((adm + mon) * 100) / 100
      };
    });
    setAddSubjectError('');
  };

  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    setAddSubjectError('');

    if (!selectedStudentForSubject) return;

    if (!addSubjectFormData.subject || !addSubjectFormData.subject.trim()) {
      setAddSubjectError('Please select a subject to add');
      showError('Subject Required', 'Please select a subject to add');
      return;
    }

    const monFee = parseFloat(addSubjectFormData.monthlyClassFee);
    if (isNaN(monFee) || monFee < 0) {
      setAddSubjectError('Please enter a valid monthly class fee');
      showError('Fee Required', 'Please enter a valid monthly class fee');
      return;
    }

    setSubmittingAddSubject(true);

    try {
      const combinedTime = `${addSubjectFormData.startTime} - ${addSubjectFormData.endTime}`.trim();
      const adm = parseFloat(addSubjectFormData.admissionFee) || 0;
      const mon = parseFloat(addSubjectFormData.monthlyClassFee) || 0;
      const tot = Math.round((adm + mon) * 100) / 100;

      const payload = {
        subject: addSubjectFormData.subject.trim(),
        teacherName: (addSubjectFormData.teacherName || '').trim(),
        classType: addSubjectFormData.classType || 'Physical',
        classDay: addSubjectFormData.classDay || 'Saturday',
        classTime: combinedTime,
        classLocation: (addSubjectFormData.classLocation || '').trim(),
        registrationDate: addSubjectFormData.registrationDate,
        registrationStatus: addSubjectFormData.registrationStatus || 'Active',
        paymentStatus: addSubjectFormData.paymentStatus || 'Pending',
        paymentMethod: addSubjectFormData.paymentMethod || 'Cash',
        admissionFee: adm,
        monthlyClassFee: mon,
        totalFee: tot
      };

      const response = await authenticatedFetch(
        `${API_CONFIG.API_URL}/students/${selectedStudentForSubject._id}/add-subject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
        showSuccess(
          'Subject Added',
          `Subject "${addSubjectFormData.subject}" added successfully to ${selectedStudentForSubject.name} (${selectedStudentForSubject.studentId})!`
        );
        handleCloseAddSubject();
      } else {
        const msg = data.message || 'Failed to add subject';
        setAddSubjectError(msg);
        showError('Add Subject Failed', msg);
      }
    } catch (err) {
      console.error('Error adding subject:', err);
      setAddSubjectError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setSubmittingAddSubject(false);
    }
  };

  // Remove / Drop Subject Handlers
  const handleRequestRemoveSubject = (student, subjectItem) => {
    const subName = subjectItem.subjectName || subjectItem.subject || subjectItem.name;
    const subId = subjectItem.subjectId || subjectItem._id;
    const enrollId = subjectItem._id;
    setSubjectToRemove({
      studentId: student.studentId,
      studentMongoId: student._id,
      studentName: student.name,
      subjectName: subName,
      subjectId: subId,
      enrollmentId: enrollId
    });
    setShowRemoveConfirmModal(true);
  };

  const handleCancelRemoveSubject = () => {
    setShowRemoveConfirmModal(false);
    setSubjectToRemove(null);
    setSubmittingRemoveSubject(false);
  };

  const handleExecuteRemoveSubject = async () => {
    if (!subjectToRemove) return;
    setSubmittingRemoveSubject(true);

    try {
      const response = await authenticatedFetch(
        `${API_CONFIG.API_URL}/students/${subjectToRemove.studentMongoId}/remove-subject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: subjectToRemove.subjectName,
            subjectId: subjectToRemove.subjectId,
            enrollmentId: subjectToRemove.enrollmentId
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedList = await fetchStudents();
        // If the Add/Manage modal is currently open for this student, update selectedStudentForSubject
        if (selectedStudentForSubject && selectedStudentForSubject._id === subjectToRemove.studentMongoId) {
          const freshStudent = data.data || (Array.isArray(updatedList) ? updatedList.find(s => s._id === subjectToRemove.studentMongoId) : null);
          if (freshStudent) {
            setSelectedStudentForSubject(freshStudent);
          }
        }
        showSuccess(
          'Subject Removed',
          `Subject "${subjectToRemove.subjectName}" removed successfully from ${subjectToRemove.studentName} (${subjectToRemove.studentId})!`
        );
        setShowRemoveConfirmModal(false);
        setSubjectToRemove(null);
      } else {
        const msg = data.message || 'Failed to remove subject';
        showError('Remove Subject Failed', msg);
      }
    } catch (err) {
      console.error('Error removing subject:', err);
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setSubmittingRemoveSubject(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedName = (formData.name || '').trim();
    const trimmedGrade = (formData.grade || '').trim();
    const trimmedGuardianName = (formData.guardianName || '').trim();
    const trimmedSubject = (formData.subject || '').trim();

    // Format contact number with +94
    let trimmedContact = (formData.guardianTelephone || '').trim().replace(/\D/g, '');
    if (trimmedContact.startsWith('0')) {
      trimmedContact = trimmedContact.substring(1);
    }
    const finalContact = trimmedContact ? `+94${trimmedContact}` : '';

    // Validations
    if (!trimmedName) {
      setError('Please enter Student Full Name');
      setLoading(false);
      return;
    }
    if (!formData.birthday) {
      setError('Please select Date of Birth');
      setLoading(false);
      return;
    }
    if (!formData.gender) {
      setError('Please select Gender');
      setLoading(false);
      return;
    }
    if (!trimmedGrade) {
      setError('Please enter or select Grade / Class');
      setLoading(false);
      return;
    }
    if (!finalContact) {
      setError('Please enter Parent / Guardian Contact Number');
      setLoading(false);
      return;
    }

    try {
      const url = editingStudent 
        ? `${API_CONFIG.API_URL}/students/${editingStudent._id}`
        : `${API_CONFIG.API_URL}/students`;
      
      const method = editingStudent ? 'PUT' : 'POST';

      const combinedClassTime = `${formData.startTime} - ${formData.endTime}`.trim();
      const adm = parseFloat(formData.admissionFee) || 0;
      const mon = parseFloat(formData.monthlyClassFee) || 0;
      const tot = Math.round((adm + mon) * 100) / 100;

      const payload = {
        // 1. Student Details
        name: trimmedName,
        birthday: formData.birthday,
        gender: formData.gender,
        studentId: editingStudent ? formData.studentId : '', // empty triggers auto-generation ID####
        grade: trimmedGrade,
        // 2. Parent / Guardian Details
        guardianName: trimmedGuardianName,
        guardianRelationship: formData.guardianRelationship || 'Father',
        guardianTelephone: finalContact,
        guardianEmail: (formData.guardianEmail || '').trim().toLowerCase(),
        guardianAddress: (formData.guardianAddress || '').trim(),
        // 3. Class Details
        subject: trimmedSubject,
        teacherName: (formData.teacherName || '').trim(),
        classType: formData.classType || 'Physical',
        classDay: formData.classDay || 'Saturday',
        classTime: combinedClassTime,
        classLocation: (formData.classLocation || '').trim(),
        // 4. Login Details (for LMS)
        username: (formData.username || '').trim().toLowerCase(),
        password: formData.password ? formData.password.trim() : undefined,
        // 5. Registration Details
        registrationDate: formData.registrationDate,
        registrationStatus: formData.registrationStatus || 'Active',
        paymentStatus: formData.paymentStatus || 'Pending',
        admissionFee: adm,
        monthlyClassFee: mon,
        totalFee: tot
      };

      const response = await authenticatedFetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
        showSuccess(
          editingStudent ? 'Student Updated' : 'Student Registered',
          editingStudent ? 'Student details updated successfully.' : `New student registered successfully with ID: ${data.data?.studentId || 'Generated'}`
        );
        setFormData(INITIAL_FORM_STATE);
        setEditingStudent(null);
        setShowForm(false);
        setError('');
      } else {
        const errorMessage = data.message || data.error || `Failed to ${editingStudent ? 'update' : 'add'} student`;
        setError(errorMessage);
        showError('Registration Error', errorMessage);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Student?',
      message: 'Are you sure you want to delete this student record? This action cannot be undone.',
      confirmText: 'Delete Student',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(`${API_CONFIG.API_URL}/students/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
        showSuccess('Student Deleted', 'Student record deleted successfully.');
      } else {
        showError('Delete Failed', data.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      showError('Network Error', 'Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      [
        student.name,
        student.studentId,
        student.grade,
        student.subject,
        student.guardianName,
        student.guardianTelephone,
        student.mobile,
        student.username,
        student.email,
        student.gender
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term))
    );
  }, [students, searchTerm]);

  // Generate CSV Report matching the 5 sections + Fees
  const handleGenerateReport = () => {
    if (!filteredStudents.length) {
      showWarning('No Students', 'No students available to generate a report.');
      return;
    }

    const headers = [
      'Student ID',
      'Student Full Name',
      'Grade',
      'Guardian & Contact',
      'Subject & Teacher',
      'Mode',
      'Reg. Date',
      'Status',
      'Payment',
      'Total Fee (LKR)'
    ];

    const rows = filteredStudents.map((s) => {
      const adm = s.admissionFee !== undefined ? Number(s.admissionFee) : 0;
      const mon = s.monthlyClassFee !== undefined ? Number(s.monthlyClassFee) : 0;
      const tot = s.totalFee !== undefined ? Number(s.totalFee) : (adm + mon);

      const guardianInfo = [
        s.guardianName || `${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim(),
        s.guardianTelephone || s.mobile
      ].filter(Boolean).join('\n');

      const subjectInfo = [
        s.subject || (s.subjects?.[0]?.name || s.subjects?.[0] || ''),
        s.teacherName ? `Tr: ${s.teacherName}` : ''
      ].filter(Boolean).join('\n');

      return [
        s.studentId || '',
        s.name || '',
        s.grade || 'N/A',
        guardianInfo || 'N/A',
        subjectInfo || 'N/A',
        s.classType || 'Physical',
        formatDate(s.registrationDate || s.createdAt),
        s.registrationStatus || 'Active',
        s.paymentStatus || 'Pending',
        tot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];
    });

    const activeCount = filteredStudents.filter(s => (s.registrationStatus || 'Active') === 'Active').length;
    const paidCount = filteredStudents.filter(s => s.paymentStatus === 'Paid').length;

    generatePdfReport({
      title: 'Student Registration & Enrollment Directory',
      subtitle: 'Wisdom Institute of Higher Education • Comprehensive Student Registry',
      filename: `student-registration-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'landscape',
      filterInfo: searchTerm ? [{ label: 'Search Query', value: searchTerm }] : [],
      summaryCards: [
        { label: 'Total Students', value: filteredStudents.length },
        { label: 'Active Learners', value: activeCount, color: 'green' },
        { label: 'Paid Fees', value: paidCount, color: 'green' },
        { label: 'Pending Dues', value: filteredStudents.length - paidCount, color: 'red' }
      ]
    });
    toastSuccess('Student directory PDF report downloaded successfully');
  };

  return (
    <div className="students-page">
      <Sidebar />
      <div className="students-main-content">
        <Topbar userName="Wisdom Admin" />
        
        <div className="students-content">
          <div className="students-header">
            <div>
              <h1>Student Registration</h1>
              <p className="students-header-sub">Manage student admissions, parent records, class allotments, and LMS access</p>
            </div>
            <div className="students-header-actions">
              <div className="students-search">
                <input
                  type="text"
                  placeholder="Search by name, ID, grade, subject..."
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
                className="report-btn"
                onClick={handleGenerateReport}
                disabled={filteredStudents.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-student-btn" 
                onClick={() => {
                  if (showForm) {
                    handleCancelEdit();
                  } else {
                    setEditingStudent(null);
                    setFormData(INITIAL_FORM_STATE);
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add New Student'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="student-form-container">
              <div className="form-card-header">
                <h2>{editingStudent ? `Edit Student — ${editingStudent.studentId}` : 'Student Registration Form'}</h2>
                <p>Please complete the 5 registration sections below. Student ID is automatically generated by the system.</p>
              </div>

              <form onSubmit={handleSubmit} className="student-form">
                {error && <div className="error-message">{error}</div>}

                {/* 1. Student Details */}
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="section-number">1</span>
                    <h3>Student Details</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group span-2">
                      <label htmlFor="name">Student Full Name <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter student full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="birthday">Date of Birth <span className="required">*</span></label>
                      <input
                        type="date"
                        id="birthday"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Gender <span className="required">*</span></label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="studentId">
                        Student ID / Registration Number <span className="auto-generated">(Auto-generated ID####)</span>
                      </label>
                      <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        value={editingStudent ? formData.studentId : 'Auto-generated (System ID)'}
                        readOnly
                        disabled
                        className="readonly-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="grade">
                        Grade / Class <span className="required">*</span> <span className="auto-generated">(Auto-calculated from DOB)</span>
                      </label>
                      <input
                        type="text"
                        id="grade"
                        name="grade"
                        list="grade-options"
                        value={formData.grade}
                        onChange={handleInputChange}
                        placeholder="e.g. Grade 10"
                        required
                      />
                      <datalist id="grade-options">
                        {GRADE_OPTIONS.map(g => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* 2. Parent / Guardian Details */}
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="section-number">2</span>
                    <h3>Parent / Guardian Details</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="guardianName">Parent / Guardian Name <span className="required">*</span></label>
                      <input
                        type="text"
                        id="guardianName"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleInputChange}
                        placeholder="Enter parent or guardian name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="guardianRelationship">Relationship to Student</label>
                      <select
                        id="guardianRelationship"
                        name="guardianRelationship"
                        value={formData.guardianRelationship}
                        onChange={handleInputChange}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="guardianTelephone">Contact Number <span className="required">*</span></label>
                      <div className="mobile-input-wrapper">
                        <span className="mobile-prefix">+94</span>
                        <input
                          type="tel"
                          id="guardianTelephone"
                          name="guardianTelephone"
                          value={formData.guardianTelephone}
                          onChange={handleGuardianTelephoneChange}
                          placeholder="771234567"
                          required
                          maxLength="9"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="guardianEmail">Email Address</label>
                      <input
                        type="email"
                        id="guardianEmail"
                        name="guardianEmail"
                        value={formData.guardianEmail}
                        onChange={handleInputChange}
                        placeholder="parent@example.com"
                      />
                    </div>

                    <div className="form-group span-2">
                      <label htmlFor="guardianAddress">Address</label>
                      <input
                        type="text"
                        id="guardianAddress"
                        name="guardianAddress"
                        value={formData.guardianAddress}
                        onChange={handleInputChange}
                        placeholder="Enter residential address"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Class Details */}
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="section-number">3</span>
                    <h3>Class Details</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="subject">Subject <span className="required">*</span></label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleSubjectChange}
                        required
                      >
                        <option value="" disabled>Select Subject</option>
                        {subjects.map(s => (
                          <option key={s._id} value={s.name}>
                            {s.name} {s.conductedBy?.name ? `(${s.conductedBy.name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="teacherName">Teacher / Lecturer</label>
                      <input
                        type="text"
                        id="teacherName"
                        name="teacherName"
                        value={formData.teacherName}
                        onChange={handleInputChange}
                        placeholder="Teacher name (auto-filled on subject select)"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="classType">Class Type</label>
                      <select
                        id="classType"
                        name="classType"
                        value={formData.classType}
                        onChange={handleInputChange}
                      >
                        <option value="Physical">Physical</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="classDay">Class Day</label>
                      <select
                        id="classDay"
                        name="classDay"
                        value={formData.classDay}
                        onChange={handleInputChange}
                      >
                        {DAY_OPTIONS.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group span-2">
                      <label>Class Time</label>
                      <div className="time-select-pair">
                        <div className="time-picker-block">
                          <span className="time-label">Start Time:</span>
                          <select
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`start-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-picker-block">
                          <span className="time-label">End Time:</span>
                          <select
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`end-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-group span-2">
                      <label htmlFor="classLocation">Class Location / Hall</label>
                      <input
                        type="text"
                        id="classLocation"
                        name="classLocation"
                        value={formData.classLocation}
                        onChange={handleInputChange}
                        placeholder="e.g. Hall A, Room 102, Online Zoom Link"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Login Details (for LMS) */}
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="section-number">4</span>
                    <h3>Login Details (for LMS)</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="username">Username / Email</label>
                       <input
                         type="text"
                         id="username"
                         name="username"
                         value={formData.username}
                         onChange={handleInputChange}
                       />
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="password-input-wrapper">
                       <input
                         type={showPassword ? 'text' : 'password'}
                         id="password"
                         name="password"
                         value={formData.password}
                         onChange={handleInputChange}
                         placeholder="Set student portal password"
                       />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Registration Details */}
                <div className="form-section">
                  <div className="form-section-header">
                    <span className="section-number">5</span>
                    <h3>Registration Details</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="registrationDate">Registration Date <span className="required">*</span></label>
                      <input
                        type="date"
                        id="registrationDate"
                        name="registrationDate"
                        value={formData.registrationDate}
                        onChange={handleInputChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="registrationStatus">Registration Status</label>
                      <select
                        id="registrationStatus"
                        name="registrationStatus"
                        value={formData.registrationStatus}
                        onChange={handleInputChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="paymentStatus">Payment Status</label>
                      <select
                        id="paymentStatus"
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleInputChange}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="admissionFee">Admission Fee (LKR)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        id="admissionFee"
                        name="admissionFee"
                        value={formData.admissionFee}
                        onChange={handleFeeChange}
                        placeholder="e.g. 1500"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="monthlyClassFee">Monthly Class Fee (LKR)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        id="monthlyClassFee"
                        name="monthlyClassFee"
                        value={formData.monthlyClassFee}
                        onChange={handleFeeChange}
                        placeholder="e.g. 2500"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="totalFee">
                        Total Fee <span className="auto-generated">(Admission Fee + Monthly Class Fee)</span>
                      </label>
                      <div className="total-fee-display-box">
                        <span className="currency-prefix">LKR</span>
                        <span className="total-fee-amount">
                          {Number((parseFloat(formData.admissionFee) || 0) + (parseFloat(formData.monthlyClassFee) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading 
                      ? (editingStudent ? 'Updating...' : 'Registering...') 
                      : (editingStudent ? 'Update Student Record' : 'Register Student')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="students-table">
            {students.length === 0 ? (
              <div className="empty-state">
                <p>No students registered yet. Click "+ Add New Student" to get started.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state">
                <p>No students match your search query.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Full Name</th>
                    <th>Grade / Class</th>
                    <th>Subject & Teacher</th>
                    <th>Class Schedule</th>
                    <th>Parent / Guardian</th>
                    <th>Contact No.</th>
                    <th>Reg. Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const guardian = student.guardianName || `${student.guardianFirstName || ''} ${student.guardianLastName || ''}`.trim() || '-';
                    const contact = student.guardianTelephone || student.mobile || '-';
                    const subName = student.subject || (student.subjects?.[0]?.name || student.subjects?.[0] || '-');
                    const schedule = [student.classDay, student.classTime].filter(Boolean).join(' • ') || '-';
                    const isActive = (student.registrationStatus || 'Active') === 'Active';

                    return (
                      <tr key={student._id}>
                        <td className="student-id-cell">
                          <strong>{student.studentId}</strong>
                        </td>
                        <td className="student-name-cell">
                          <div className="name-primary">{student.name}</div>
                          {student.username && <div className="username-sub">@{student.username}</div>}
                        </td>
                        <td>
                          <span className="grade-badge">{student.grade || '-'}</span>
                        </td>
                        <td>
                          {student.enrolledSubjects && student.enrolledSubjects.length > 0 ? (
                            <div className="student-subjects-stack">
                              {student.enrolledSubjects.map((es, idx) => (
                                <div key={idx} className="subject-chip-item">
                                  <div className="subject-chip-header">
                                    <span className="subject-cell-name">{es.subjectName || es.subject}</span>
                                    <button
                                      type="button"
                                      className="table-drop-btn"
                                      onClick={() => handleRequestRemoveSubject(student, es)}
                                      title={`Drop / Remove ${es.subjectName || es.subject}`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {es.teacherName && (
                                    <div className="teacher-sub">Lecturer: {es.teacherName}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="subject-chip-item">
                              <div className="subject-chip-header">
                                <div className="subject-cell-name">{subName}</div>
                                {subName && subName !== '-' && (
                                  <button
                                    type="button"
                                    className="table-drop-btn"
                                    onClick={() => handleRequestRemoveSubject(student, { subjectName: subName })}
                                    title={`Drop / Remove ${subName}`}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              {student.teacherName && (
                                <div className="teacher-sub">Lecturer: {student.teacherName}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="schedule-type-badge">{student.classType || 'Physical'}</div>
                          <div className="schedule-time">{schedule}</div>
                          {student.classLocation && (
                            <div className="schedule-loc">📍 {student.classLocation}</div>
                          )}
                        </td>
                        <td>
                          <div>{guardian}</div>
                          {student.guardianRelationship && (
                            <div className="relation-sub">({student.guardianRelationship})</div>
                          )}
                        </td>
                        <td>
                          <a href={`tel:${contact}`} className="contact-link">{contact}</a>
                        </td>
                        <td>{formatDate(student.registrationDate || student.createdAt)}</td>
                        <td>
                          <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                            {student.registrationStatus || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              type="button"
                              className="add-subject-btn"
                              onClick={() => handleOpenAddSubject(student)}
                              title="Add or manage subjects for student"
                            >
                              + Add / Manage
                            </button>
                            <button 
                              className="edit-btn"
                              onClick={() => handleEdit(student)}
                              title="Edit student record"
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(student._id)}
                              title="Delete student record"
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
            )}
          </div>
        </div>
      </div>

      {/* Add Subject to Student Modal */}
      {showAddSubjectModal && selectedStudentForSubject && (
        <div className="modal-overlay" onClick={handleCloseAddSubject}>
          <div className="modal-content add-subject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-icon">📚</span>
                <div>
                  <h2>Manage & Add Subjects</h2>
                  <p className="modal-subtitle">Enroll student in classes or drop classes when student withdraws</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={handleCloseAddSubject}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Automatically Loaded Student Existing Details */}
            <div className="student-profile-summary-card">
              <div className="profile-summary-header">
                <div className="student-avatar-badge">
                  {selectedStudentForSubject.name ? selectedStudentForSubject.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="student-info-meta">
                  <div className="student-info-name">{selectedStudentForSubject.name}</div>
                  <div className="student-info-sub">
                    <span className="info-chip"><strong>Student ID:</strong> {selectedStudentForSubject.studentId}</span>
                    <span className="info-chip"><strong>Grade:</strong> {selectedStudentForSubject.grade || '-'}</span>
                    {selectedStudentForSubject.gender && (
                      <span className="info-chip">{selectedStudentForSubject.gender}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Enrolled Subjects with Drop/Remove Option */}
              <div className="currently-enrolled-section">
                <div className="enrolled-section-title">
                  <span className="enrolled-section-icon">🎓</span>
                  <h4>Currently Enrolled Classes ({selectedStudentForSubject.enrolledSubjects?.length || (selectedStudentForSubject.subject ? selectedStudentForSubject.subject.split(',').length : 0)})</h4>
                </div>

                {selectedStudentForSubject.enrolledSubjects && selectedStudentForSubject.enrolledSubjects.length > 0 ? (
                  <div className="enrolled-cards-list">
                    {selectedStudentForSubject.enrolledSubjects.map((es, idx) => (
                      <div key={es._id || idx} className="enrolled-class-card">
                        <div className="enrolled-class-main">
                          <div className="enrolled-class-header">
                            <span className="enrolled-class-name">{es.subjectName || es.subject}</span>
                            {es.classType && (
                              <span className="enrolled-type-tag">{es.classType}</span>
                            )}
                          </div>
                          <div className="enrolled-class-meta">
                            {es.teacherName && (
                              <span className="enrolled-meta-item">👨‍🏫 {es.teacherName}</span>
                            )}
                            {(es.classDay || es.classTime) && (
                              <span className="enrolled-meta-item">
                                📅 {[es.classDay, es.classTime].filter(Boolean).join(' ')}
                              </span>
                            )}
                            {es.classLocation && (
                              <span className="enrolled-meta-item">📍 {es.classLocation}</span>
                            )}
                            {es.monthlyClassFee !== undefined && (
                              <span className="enrolled-meta-item fee">
                                💰 Fee: LKR {Number(es.monthlyClassFee).toLocaleString()}/mo
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="drop-class-action-btn"
                          onClick={() => handleRequestRemoveSubject(selectedStudentForSubject, es)}
                          title={`Drop / Remove ${es.subjectName || es.subject} for ${selectedStudentForSubject.name}`}
                        >
                          ✕ Drop Class
                        </button>
                      </div>
                    ))}
                  </div>
                ) : selectedStudentForSubject.subject ? (
                  <div className="enrolled-cards-list">
                    {selectedStudentForSubject.subject.split(',').map((sName, idx) => {
                      const trimmed = sName.trim();
                      return (
                        <div key={idx} className="enrolled-class-card">
                          <div className="enrolled-class-main">
                            <div className="enrolled-class-header">
                              <span className="enrolled-class-name">{trimmed}</span>
                              {selectedStudentForSubject.classType && (
                                <span className="enrolled-type-tag">{selectedStudentForSubject.classType}</span>
                              )}
                            </div>
                            <div className="enrolled-class-meta">
                              {selectedStudentForSubject.teacherName && (
                                <span className="enrolled-meta-item">👨‍🏫 {selectedStudentForSubject.teacherName}</span>
                              )}
                              {(selectedStudentForSubject.classDay || selectedStudentForSubject.classTime) && (
                                <span className="enrolled-meta-item">
                                  📅 {[selectedStudentForSubject.classDay, selectedStudentForSubject.classTime].filter(Boolean).join(' ')}
                                </span>
                              )}
                              {selectedStudentForSubject.classLocation && (
                                <span className="enrolled-meta-item">📍 {selectedStudentForSubject.classLocation}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="drop-class-action-btn"
                            onClick={() => handleRequestRemoveSubject(selectedStudentForSubject, { subjectName: trimmed })}
                            title={`Drop / Remove ${trimmed} for ${selectedStudentForSubject.name}`}
                          >
                            ✕ Drop Class
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-enrolled-classes-note">
                    Student is not currently enrolled in any classes. Use the form below to enroll.
                  </div>
                )}
              </div>
            </div>

            {addSubjectError && (
              <div className="modal-error-banner">
                ⚠️ {addSubjectError}
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmit} className="add-subject-form">
              {/* Details Section: Add New Subject */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-badge-icon">📖</span>
                  <div>
                    <h3>Class Details (Add New Subject)</h3>
                    <p>Select subject, teacher, and schedule for the student</p>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group span-2">
                    <label htmlFor="modal-subject">Subject <span className="required">*</span></label>
                    <select
                      id="modal-subject"
                      name="subject"
                      value={addSubjectFormData.subject}
                      onChange={handleAddSubjectSelect}
                      required
                    >
                      <option value="" disabled>-- Select Subject to Add --</option>
                      {subjects.map(s => {
                        const isAlreadyEnrolled = selectedStudentForSubject.enrolledSubjects?.some(
                          es => es.subjectName?.toLowerCase() === s.name.toLowerCase() || String(es.subjectId) === String(s._id)
                        ) || selectedStudentForSubject.subjects?.some(
                          sub => (typeof sub === 'string' && sub.toLowerCase() === s.name.toLowerCase()) || String(sub._id || sub) === String(s._id)
                        ) || (selectedStudentForSubject.subject && selectedStudentForSubject.subject.split(',').map(x => x.trim().toLowerCase()).includes(s.name.toLowerCase()));

                        return (
                          <option key={s._id} value={s.name} disabled={isAlreadyEnrolled}>
                            {s.name} {s.conductedBy?.name ? `(Lecturer: ${s.conductedBy.name})` : ''} {isAlreadyEnrolled ? '— [Already Enrolled]' : (s.price ? `— LKR ${s.price}` : '')}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-teacherName">Teacher / Lecturer</label>
                    <input
                      type="text"
                      id="modal-teacherName"
                      name="teacherName"
                      value={addSubjectFormData.teacherName}
                      onChange={handleAddSubjectChange}
                      placeholder="Lecturer name (auto-filled on select)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-classType">Class Type</label>
                    <select
                      id="modal-classType"
                      name="classType"
                      value={addSubjectFormData.classType}
                      onChange={handleAddSubjectChange}
                    >
                      <option value="Physical">Physical</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-classDay">Class Day</label>
                    <select
                      id="modal-classDay"
                      name="classDay"
                      value={addSubjectFormData.classDay}
                      onChange={handleAddSubjectChange}
                    >
                      {DAY_OPTIONS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group span-2">
                    <label>Class Time</label>
                    <div className="time-select-pair">
                      <div className="time-picker-block">
                        <span className="time-label">Start Time:</span>
                        <select
                          name="startTime"
                          value={addSubjectFormData.startTime}
                          onChange={handleAddSubjectChange}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={`modal-start-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <span className="time-separator">to</span>
                      <div className="time-picker-block">
                        <span className="time-label">End Time:</span>
                        <select
                          name="endTime"
                          value={addSubjectFormData.endTime}
                          onChange={handleAddSubjectChange}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={`modal-end-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group span-2">
                    <label htmlFor="modal-classLocation">Class Location / Hall</label>
                    <input
                      type="text"
                      id="modal-classLocation"
                      name="classLocation"
                      value={addSubjectFormData.classLocation}
                      onChange={handleAddSubjectChange}
                      placeholder="e.g. Hall A, Room 102, Online Zoom Link"
                    />
                  </div>
                </div>
              </div>

              {/* Details Section: Registration Details */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-badge-icon">💳</span>
                  <div>
                    <h3>Registration Details</h3>
                    <p>Registration status, payment status, and fees for this subject</p>
                  </div>
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="modal-registrationDate">Registration Date <span className="required">*</span></label>
                    <input
                      type="date"
                      id="modal-registrationDate"
                      name="registrationDate"
                      value={addSubjectFormData.registrationDate}
                      onChange={handleAddSubjectChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-registrationStatus">Registration Status</label>
                    <select
                      id="modal-registrationStatus"
                      name="registrationStatus"
                      value={addSubjectFormData.registrationStatus}
                      onChange={handleAddSubjectChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-paymentStatus">Payment Status</label>
                    <select
                      id="modal-paymentStatus"
                      name="paymentStatus"
                      value={addSubjectFormData.paymentStatus}
                      onChange={handleAddSubjectChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-paymentMethod">Payment Method</label>
                    <select
                      id="modal-paymentMethod"
                      name="paymentMethod"
                      value={addSubjectFormData.paymentMethod || 'Cash'}
                      onChange={handleAddSubjectChange}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-admissionFee">Admission Fee (LKR)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="modal-admissionFee"
                      name="admissionFee"
                      value={addSubjectFormData.admissionFee}
                      onChange={handleAddSubjectFeeChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-monthlyClassFee">Monthly Class Fee (LKR) <span className="required">*</span></label>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="modal-monthlyClassFee"
                      name="monthlyClassFee"
                      value={addSubjectFormData.monthlyClassFee}
                      onChange={handleAddSubjectFeeChange}
                      placeholder="e.g. 2500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-totalFee">
                      Total Fee <span className="auto-generated">(Admission Fee + Monthly Fee)</span>
                    </label>
                    <div className="total-fee-display-box modal-fee-box">
                      <span className="currency-prefix">LKR</span>
                      <span className="total-fee-amount">
                        {Number((parseFloat(addSubjectFormData.admissionFee) || 0) + (parseFloat(addSubjectFormData.monthlyClassFee) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseAddSubject}
                  disabled={submittingAddSubject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={submittingAddSubject}
                >
                  {submittingAddSubject ? 'Adding Subject...' : '+ Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Drop / Remove Subject Modal */}
      {showRemoveConfirmModal && subjectToRemove && (
        <div className="modal-overlay confirm-modal-overlay" onClick={handleCancelRemoveSubject}>
          <div className="modal-content confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <span className="confirm-modal-icon">⚠️</span>
              <h3>Drop / Remove Class</h3>
            </div>
            <div className="confirm-modal-body">
              <p>
                Are you sure you want to remove the subject <strong>"{subjectToRemove.subjectName}"</strong> from:
              </p>
              <div className="confirm-student-target">
                <strong>{subjectToRemove.studentName}</strong> ({subjectToRemove.studentId})
              </div>
              <div className="confirm-warning-box">
                This will unenroll the student from this class and remove the subject from upcoming payment calculations.
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={handleCancelRemoveSubject}
                disabled={submittingRemoveSubject}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-confirm-btn"
                onClick={handleExecuteRemoveSubject}
                disabled={submittingRemoveSubject}
              >
                {submittingRemoveSubject ? 'Removing Class...' : 'Yes, Drop Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
