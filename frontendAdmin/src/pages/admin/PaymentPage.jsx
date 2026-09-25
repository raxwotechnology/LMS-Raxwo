import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import PaymentMonthPicker from '../../components/PaymentMonthPicker';
import './PaymentPage.css';

const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentMonthList = () => [ALL_MONTHS[new Date().getMonth()]];

const getPaymentFeeType = (payment) => {
  if (!payment) return 'Monthly Fee';
  const admFee = payment.admissionFee !== undefined ? Number(payment.admissionFee) : 0;
  const monFee = payment.monthlyFee !== undefined ? Number(payment.monthlyFee) : (admFee === 0 ? Number(payment.totalAmount || 0) : 0);
  return payment.paymentType || (admFee > 0 && monFee > 0 ? 'Admission & Monthly Fee' : (admFee > 0 ? 'Admission Fee' : 'Monthly Fee'));
};

const PaymentPage = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPayments, setFetchingPayments] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Unpaid'
  const [feeTypeFilter, setFeeTypeFilter] = useState('All'); // 'All' | 'Monthly Fee' | 'Admission Fee' | 'Admission & Monthly Fee'
  const [formData, setFormData] = useState({
    studentId: '',
    selectedSubjects: [],
    selectedMonths: getCurrentMonthList(),
    paymentMethod: '',
    paymentDate: ''
  });
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [editFormData, setEditFormData] = useState({
    selectedSubjects: [],
    selectedMonths: [],
    paymentMethod: '',
    paymentDate: '',
    paymentStatus: 'Paid'
  });
  const [editTotalFee, setEditTotalFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [monthlyClassFeeInput, setMonthlyClassFeeInput] = useState('');
  const [editMonthlyClassFeeInput, setEditMonthlyClassFeeInput] = useState('');

  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = (user.name && user.name !== 'Admin') ? user.name : 'Wisdom Admin';

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchPayments();
  }, []);

  useEffect(() => {
    // Calculate total fee when monthly fee input or selected months change
    const feeNum = parseFloat(monthlyClassFeeInput) || 0;
    if (feeNum > 0 && formData.selectedMonths.length > 0) {
      setTotalFee(Math.round(feeNum * formData.selectedMonths.length * 100) / 100);
    } else {
      setTotalFee(0);
    }
  }, [monthlyClassFeeInput, formData.selectedMonths]);

  useEffect(() => {
    // Calculate total fee for edit form when edit monthly fee or selected months change
    const feeNum = parseFloat(editMonthlyClassFeeInput) || 0;
    if (feeNum > 0 && editFormData.selectedMonths && editFormData.selectedMonths.length > 0) {
      setEditTotalFee(Math.round(feeNum * editFormData.selectedMonths.length * 100) / 100);
    } else {
      setEditTotalFee(0);
    }
  }, [editMonthlyClassFeeInput, editFormData.selectedMonths]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchPayments = async () => {
    setFetchingPayments(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setFetchingPayments(false);
    }
  };

  // Get student suggestions based on search input
  const getStudentSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];

    students.forEach(student => {
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
    setStudentSearchInput(searchTerm);
    
    if (searchTerm.trim()) {
      const suggestions = getStudentSuggestions(searchTerm);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setSelectedStudent(null);
    setMonthlyClassFeeInput('');
    setFormData({
      ...formData,
      studentId: '',
      selectedSubjects: [],
      selectedMonths: getCurrentMonthList()
    });
    setError('');
    setSuccess('');
  };

  // Comprehensive helper to resolve all subjects and effective prices for a student
  const resolveStudentSubjectList = (student, allSubjects = subjects) => {
    if (!student) return [];
    
    const subjectIds = [];
    if (student.subjects && Array.isArray(student.subjects)) {
      student.subjects.forEach(s => {
        const id = typeof s === 'object' ? s._id : s;
        if (id && !subjectIds.includes(String(id))) subjectIds.push(String(id));
      });
    }

    if (student.enrolledSubjects && Array.isArray(student.enrolledSubjects)) {
      student.enrolledSubjects.forEach(es => {
        const id = es.subjectId?._id ? es.subjectId._id : es.subjectId;
        if (id && !subjectIds.includes(String(id))) {
          subjectIds.push(String(id));
        } else if (!id && es.subjectName) {
          const match = allSubjects.find(s => s.name.toLowerCase() === es.subjectName.toLowerCase());
          if (match && !subjectIds.includes(String(match._id))) subjectIds.push(String(match._id));
        }
      });
    }

    if (student.subject) {
      const parts = student.subject.split(',').map(p => p.trim());
      parts.forEach(part => {
        const match = allSubjects.find(s => 
          s.name.toLowerCase() === part.toLowerCase() ||
          String(s._id) === String(part)
        );
        if (match && !subjectIds.includes(String(match._id))) {
          subjectIds.push(String(match._id));
        }
      });
    }

    return subjectIds.map(subjectIdValue => {
      const subject = allSubjects.find(s => String(s._id) === String(subjectIdValue));
      if (!subject) return null;
      
      let studentPrice = null;

      // 1. From enrolledSubjects
      if (student.enrolledSubjects && Array.isArray(student.enrolledSubjects)) {
        const es = student.enrolledSubjects.find(e => {
          const esId = e.subjectId?._id ? e.subjectId._id.toString() : e.subjectId?.toString();
          return (esId && esId === String(subjectIdValue)) || (e.subjectName && e.subjectName.toLowerCase() === subject.name.toLowerCase());
        });
        if (es && es.monthlyClassFee !== undefined && es.monthlyClassFee !== null && Number(es.monthlyClassFee) > 0) {
          studentPrice = Number(es.monthlyClassFee);
        }
      }

      // 2. From subjectPrices
      if (studentPrice === null && student.subjectPrices && Array.isArray(student.subjectPrices)) {
        const subjectPrice = student.subjectPrices.find(sp => {
          const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
          return String(spId) === String(subjectIdValue);
        });
        if (subjectPrice && subjectPrice.price !== undefined && subjectPrice.price !== null && subjectPrice.price > 0) {
          studentPrice = subjectPrice.price;
        }
      }

      // 3. Fallback to student's monthlyClassFee if single subject
      if (studentPrice === null && subjectIds.length === 1 && student.monthlyClassFee !== undefined && student.monthlyClassFee !== null && Number(student.monthlyClassFee) > 0) {
        studentPrice = Number(student.monthlyClassFee);
      }
      
      return {
        ...subject,
        studentPrice: studentPrice !== null ? studentPrice : (subject.price || 0)
      };
    }).filter(Boolean);
  };

  const handleStudentSuggestionSelect = (student) => {
    setStudentSearchInput(`${student.name} (ID: ${student.studentId})`);

    const studentSubjectList = resolveStudentSubjectList(student, subjects);
    const subjectIds = studentSubjectList.map(s => String(s._id));

    // Calculate sum of all resolved subjects for initial selection
    const initialMonthlyFeeSum = studentSubjectList.reduce((sum, s) => {
      return sum + (parseFloat(s.studentPrice) || parseFloat(s.price) || 0);
    }, 0);

    const initialMonthlyFee = initialMonthlyFeeSum > 0 ? String(Math.round(initialMonthlyFeeSum * 100) / 100) : '';

    setFormData({
      ...formData,
      studentId: student.studentId,
      selectedSubjects: subjectIds,
      selectedMonths: getCurrentMonthList()
    });
    setMonthlyClassFeeInput(initialMonthlyFee);
    setSelectedStudent(student);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  const handleStudentIdChange = (e) => {
    handleStudentSearchChange(e);
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      const newSelected = isSelected
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];

      // Dynamic calculation: sum of monthly fee for all currently ticked/selected subjects
      const availableSubjects = getStudentSubjects();
      const newTotal = newSelected.reduce((sum, sId) => {
        const sub = availableSubjects.find(s => String(s._id) === String(sId));
        return sum + (sub ? (parseFloat(sub.studentPrice) || parseFloat(sub.price) || 0) : 0);
      }, 0);

      setMonthlyClassFeeInput(newTotal > 0 ? String(Math.round(newTotal * 100) / 100) : '0');

      return {
        ...prev,
        selectedSubjects: newSelected
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleMonthToggle = (month) => {
    setFormData(prev => {
      const isSelected = prev.selectedMonths.includes(month);
      return {
        ...prev,
        selectedMonths: isSelected
          ? prev.selectedMonths.filter(m => m !== month)
          : [...prev.selectedMonths, month]
      };
    });
  };

  const getStudentSubjects = () => {
    return resolveStudentSubjectList(selectedStudent, subjects);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.studentId || !selectedStudent) {
      setError('Please select a student from the suggestions or enter a valid Student ID, first name, last name, or full name');
      setLoading(false);
      return;
    }

    if (formData.selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      setLoading(false);
      return;
    }

    const monthlyFee = parseFloat(monthlyClassFeeInput);
    if (!monthlyFee || monthlyFee <= 0) {
      setError('Please enter a valid monthly class fee');
      showError('Fee Required', 'Please enter a valid monthly class fee greater than 0');
      setLoading(false);
      return;
    }

    if (formData.selectedMonths.length === 0) {
      setError('Please select at least one month');
      setLoading(false);
      return;
    }

    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    if (!formData.paymentDate) {
      setError('Please select a payment date');
      setLoading(false);
      return;
    }

    try {
      // Create a single payment record with all selected months combined
      const monthsCombined = formData.selectedMonths.join(', ');
      const totalAmount = Math.round(monthlyFee * formData.selectedMonths.length * 100) / 100;
      
      const paymentData = {
        studentId: selectedStudent._id,
        studentIdNumber: formData.studentId,
        subjects: formData.selectedSubjects,
        totalAmount: totalAmount,
        month: monthsCombined,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate
      };

      const response = await fetch(`${API_CONFIG.API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        showSuccess('Payment Recorded', `Payment recorded successfully for ${formData.selectedMonths.length} month(s)!`);
        setSuccess(`Payment recorded successfully for ${formData.selectedMonths.length} month(s)!`);
        setFormData({
          studentId: '',
          selectedSubjects: [],
          selectedMonths: getCurrentMonthList(),
          paymentMethod: '',
          paymentDate: ''
        });
        setSelectedStudent(null);
        setMonthlyClassFeeInput('');
        setTotalFee(0);
        fetchPayments(); // Refresh payments list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to record payment');
        showError('Payment Error', data.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    const paymentDate = payment.paymentDate 
      ? new Date(payment.paymentDate).toISOString().split('T')[0]
      : '';
    
    const subjectIds = payment.subjects?.map(subject => {
      return typeof subject === 'object' ? subject._id : subject;
    }) || [];

    // Parse month string (e.g., "January, February") into array
    const selectedMonths = payment.month 
      ? payment.month.split(',').map(m => m.trim()).filter(m => m)
      : [];

    setEditFormData({
      selectedSubjects: subjectIds,
      selectedMonths: selectedMonths,
      paymentMethod: payment.paymentMethod || '',
      paymentDate: paymentDate,
      paymentStatus: payment.paymentStatus || 'Paid'
    });

    // Calculate initial edit total fee and monthly rate
    const monthsCount = selectedMonths.length || 1;
    const monthlyRate = payment.totalAmount ? Math.round((payment.totalAmount / monthsCount) * 100) / 100 : 0;
    setEditMonthlyClassFeeInput(monthlyRate ? String(monthlyRate) : '');

    if (payment.totalAmount) {
      setEditTotalFee(payment.totalAmount);
    }

    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (editFormData.selectedSubjects.length === 0) {
      showWarning('Selection Required', 'Please select at least one subject');
      setError('Please select at least one subject');
      setLoading(false);
      return;
    }

    const editMonthlyFee = parseFloat(editMonthlyClassFeeInput);
    if (!editMonthlyFee || editMonthlyFee <= 0) {
      showWarning('Fee Required', 'Please enter a valid monthly class fee');
      setError('Please enter a valid monthly class fee');
      setLoading(false);
      return;
    }

    if (!editFormData.selectedMonths || editFormData.selectedMonths.length === 0) {
      showWarning('Selection Required', 'Please select at least one month');
      setError('Please select at least one month');
      setLoading(false);
      return;
    }

    if (!editFormData.paymentMethod) {
      showWarning('Selection Required', 'Please select a payment method');
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    if (!editFormData.paymentDate) {
      showWarning('Selection Required', 'Please select a payment date');
      setError('Please select a payment date');
      setLoading(false);
      return;
    }

    try {
      // Join months with comma for multiple months (same as create)
      const monthsCombined = (editFormData.selectedMonths || []).join(', ');
      const totalAmount = Math.round(editMonthlyFee * editFormData.selectedMonths.length * 100) / 100;

      const paymentData = {
        subjects: editFormData.selectedSubjects,
        totalAmount: totalAmount,
        month: monthsCombined,
        paymentMethod: editFormData.paymentMethod,
        paymentDate: editFormData.paymentDate,
        paymentStatus: editFormData.paymentStatus || 'Paid'
      };

      const response = await fetch(`${API_CONFIG.API_URL}/payments/${editingPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Payment Updated', 'Payment details updated successfully!');
        setSuccess('Payment updated successfully!');
        setShowEditModal(false);
        setEditingPayment(null);
        setEditFormData({
          selectedSubjects: [],
          selectedMonths: [],
          paymentMethod: '',
          paymentDate: '',
          paymentStatus: 'Paid'
        });
        setEditTotalFee(0);
        fetchPayments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update payment');
        showError('Update Failed', data.message || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    const confirmed = await showConfirm({
      title: 'Delete Payment Record?',
      message: 'Are you sure you want to delete this payment record? This action cannot be undone.',
      confirmText: 'Delete Payment',
      confirmBtnColor: '#dc2626'
    });

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Payment Deleted', 'Payment record deleted successfully.');
        setSuccess('Payment deleted successfully!');
        fetchPayments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete payment');
        showError('Delete Failed', data.message || 'Failed to delete payment');
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Network error. Please try again.');
      showError('Network Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubjectToggle = (subjectId) => {
    setEditFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      const newSelected = isSelected
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];

      // Dynamic calculation: sum of monthly fee for all currently ticked/selected subjects in Edit modal
      const availableSubjects = getEditStudentSubjects();
      const newTotal = newSelected.reduce((sum, sId) => {
        const sub = availableSubjects.find(s => String(s._id) === String(sId));
        return sum + (sub ? (parseFloat(sub.studentPrice) || parseFloat(sub.price) || 0) : 0);
      }, 0);

      setEditMonthlyClassFeeInput(newTotal > 0 ? String(Math.round(newTotal * 100) / 100) : '0');

      return {
        ...prev,
        selectedSubjects: newSelected
      };
    });
  };

  const handleEditMonthToggle = (month) => {
    setEditFormData(prev => {
      const currentMonths = prev.selectedMonths || [];
      const isSelected = currentMonths.includes(month);
      return {
        ...prev,
        selectedMonths: isSelected
          ? currentMonths.filter(m => m !== month)
          : [...currentMonths, month]
      };
    });
  };

  const getEditStudentSubjects = () => {
    if (!editingPayment || !editingPayment.studentId) return [];
    
    const student = students.find(s => {
      if (typeof editingPayment.studentId === 'object') {
        return s._id === editingPayment.studentId._id;
      }
      return s._id === editingPayment.studentId;
    });

    return resolveStudentSubjectList(student, subjects);
  };

  const statusCounts = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    payments.forEach((p) => {
      const s = (p.paymentStatus || 'Paid').toLowerCase();
      if (s === 'paid') {
        paid++;
      } else {
        unpaid++;
      }
    });
    return {
      all: payments.length,
      paid,
      unpaid
    };
  }, [payments]);

  const feeTypeCounts = useMemo(() => {
    let monthly = 0;
    let admission = 0;
    let admissionAndMonthly = 0;
    payments.forEach((p) => {
      const type = getPaymentFeeType(p);
      if (type === 'Admission & Monthly Fee') {
        admissionAndMonthly++;
      } else if (type === 'Admission Fee') {
        admission++;
      } else {
        monthly++;
      }
    });
    return {
      all: payments.length,
      monthly,
      admission,
      admissionAndMonthly
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      // 1. Payment Status Filter
      const statusVal = (payment.paymentStatus || 'Paid').toLowerCase();
      if (statusFilter === 'Paid' && statusVal !== 'paid') {
        return false;
      }
      if (statusFilter === 'Unpaid' && statusVal !== 'pending' && statusVal !== 'unpaid') {
        return false;
      }

      // 2. Fee Type Filter
      if (feeTypeFilter !== 'All') {
        const feeType = getPaymentFeeType(payment);
        if (feeType !== feeTypeFilter) {
          return false;
        }
      }

      // 3. Search Filter
      if (term) {
        const studentId = payment.studentIdNumber || (payment.studentId?.studentId || '');
        const studentName = payment.studentId?.name || '';
        const feeType = getPaymentFeeType(payment);
        const month = payment.month || '';
        const method = payment.paymentMethod || '';
        const matches = (
          studentId.toLowerCase().includes(term) ||
          studentName.toLowerCase().includes(term) ||
          feeType.toLowerCase().includes(term) ||
          month.toLowerCase().includes(term) ||
          method.toLowerCase().includes(term)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [payments, statusFilter, feeTypeFilter, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredPayments.length) {
      showWarning('No Payments', 'No payments available to generate a report.');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Subjects',
      'Fee Type',
      'Admission Fee (LKR)',
      'Monthly Fee (LKR)',
      'Total Amount (LKR)',
      'Month',
      'Payment Method',
      'Payment Date',
      'Status'
    ];

    const rows = filteredPayments.map((payment) => {
      const subjectNames = payment.subjects?.map(subject => {
        return typeof subject === 'object' ? subject.name : 'Unknown';
      }).join(', ') || payment.studentId?.subject || 'None';

      const admFee = payment.admissionFee !== undefined ? Number(payment.admissionFee) : 0;
      const monFee = payment.monthlyFee !== undefined ? Number(payment.monthlyFee) : (admFee === 0 ? Number(payment.totalAmount || 0) : 0);
      const pType = getPaymentFeeType(payment);

      return [
        payment.studentIdNumber || (payment.studentId?.studentId || ''),
        payment.studentId?.name || '',
        subjectNames,
        pType,
        admFee.toFixed(2),
        monFee.toFixed(2),
        payment.totalAmount?.toFixed(2) || '0.00',
        payment.month || '',
        payment.paymentMethod || '',
        payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().slice(0, 10)
          : '',
        payment.paymentStatus || 'Paid'
      ];
    });

    const totalCollected = filteredPayments
      .filter(p => (p.paymentStatus || 'Paid') === 'Paid')
      .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const totalPending = filteredPayments
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

    generatePdfReport({
      title: 'Fee Payment & Transaction Records Report',
      subtitle: 'Wisdom Institute of Higher Education • Official Financial Transaction Log',
      filename: `payments-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'landscape',
      filterInfo: [
        ...(statusFilter !== 'all' ? [{ label: 'Status Filter', value: statusFilter }] : []),
        ...(feeTypeFilter !== 'all' ? [{ label: 'Fee Type Filter', value: feeTypeFilter }] : []),
        ...(searchTerm ? [{ label: 'Search Query', value: searchTerm }] : [])
      ],
      summaryCards: [
        { label: 'Total Records', value: filteredPayments.length },
        { label: 'Settled Payments (LKR)', value: `LKR ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'green' },
        { label: 'Pending Dues (LKR)', value: `LKR ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'red' }
      ]
    });
    toastSuccess('Payment records PDF report downloaded successfully');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Online'];

  const studentSubjects = getStudentSubjects();

  return (
    <div className="payment-page">
      <Sidebar />
      <div className="admin-content">
        <Topbar userName={userName} />
        <div className="payment-container">
          <div className="payment-header">
            <h1>Payment</h1>
            <p className="payment-subtitle">Record student payments for subjects</p>
          </div>

          <form className="payment-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="studentId">Student ID or Name *</label>
              <div className="student-search-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={studentSearchInput || (selectedStudent ? `${selectedStudent.name} (ID: ${selectedStudent.studentId})` : '')}
                  onChange={handleStudentSearchChange}
                  onFocus={() => {
                    if (studentSearchInput) {
                      const suggestions = getStudentSuggestions(studentSearchInput);
                      setStudentSuggestions(suggestions);
                      setShowSuggestions(suggestions.length > 0);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Type Student ID, first name, last name, or full name..."
                  required
                  autoComplete="off"
                />
                {showSuggestions && studentSuggestions.length > 0 && (
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
              {selectedStudent && (
                <div className="student-info">
                  <div className="student-info-grid">
                    <p><strong>Student:</strong> {selectedStudent.name} (ID: {selectedStudent.studentId})</p>
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    {selectedStudent.grade && <p><strong>Grade:</strong> {selectedStudent.grade}</p>}
                    {selectedStudent.monthlyClassFee !== undefined && selectedStudent.monthlyClassFee !== null && (
                      <p><strong>Monthly Class Fee:</strong> LKR {Number(selectedStudent.monthlyClassFee).toFixed(2)}</p>
                    )}
                    {selectedStudent.admissionFee !== undefined && selectedStudent.admissionFee !== null && Number(selectedStudent.admissionFee) > 0 && (
                      <p><strong>Admission Fee:</strong> LKR {Number(selectedStudent.admissionFee).toFixed(2)}</p>
                    )}
                    {selectedStudent.totalFee !== undefined && selectedStudent.totalFee !== null && (
                      <p><strong>Total Registration Fee:</strong> LKR {Number(selectedStudent.totalFee).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedStudent && (
              <>
                <div className="form-group">
                  <label>Select Subjects *</label>
                  <div className="subjects-selection">
                    {studentSubjects.length === 0 ? (
                      <p className="no-subjects">No subjects registered for this student</p>
                    ) : (
                      <div className="subjects-checkbox-list">
                        {studentSubjects.map((subject) => (
                          <label key={subject._id} className="subject-checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.selectedSubjects.includes(subject._id)}
                              onChange={() => handleSubjectToggle(subject._id)}
                            />
                            <span>{subject.name} - LKR {(subject.studentPrice || subject.price || 0).toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="monthlyClassFeeInput">
                    Monthly Class Fee (LKR) * <span className="auto-generated">(Auto-calculated from selected subjects, editable)</span>
                  </label>
                  <div className="fee-input-wrapper">
                    <span className="fee-currency-prefix">LKR</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="monthlyClassFeeInput"
                      name="monthlyClassFeeInput"
                      value={monthlyClassFeeInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, '');
                        setMonthlyClassFeeInput(val);
                      }}
                      placeholder="Enter monthly class fee (e.g. 2000)"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Month(s) *</label>
                  <PaymentMonthPicker
                    selectedMonths={formData.selectedMonths}
                    onChange={(newMonths) => {
                      setFormData((prev) => ({ ...prev, selectedMonths: newMonths }));
                      setError('');
                    }}
                    monthlyFee={monthlyClassFeeInput}
                    currency="LKR"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentDate">Payment Date *</label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setFormData({
                        studentId: '',
                        selectedSubjects: [],
                        selectedMonths: getCurrentMonthList(),
                        paymentMethod: '',
                        paymentDate: ''
                      });
                      setSelectedStudent(null);
                      setTotalFee(0);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Payments List Section */}
          <div className="payments-list-section">
            <div className="payments-list-header">
              <div className="payments-title-wrapper">
                <h2>Payment Records</h2>
                <div className="status-filter-pills" role="tablist" aria-label="Filter by payment status">
                  <button
                    type="button"
                    className={`status-pill-btn ${statusFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('All')}
                    title="Show all payments"
                  >
                    All <span className="pill-badge">{statusCounts.all}</span>
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn paid ${statusFilter === 'Paid' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Paid')}
                    title="Filter by Paid"
                  >
                    <span className="dot dot-paid"></span>
                    Paid <span className="pill-badge">{statusCounts.paid}</span>
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn unpaid ${statusFilter === 'Unpaid' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Unpaid')}
                    title="Filter by Unpaid / Pending"
                  >
                    <span className="dot dot-unpaid"></span>
                    Unpaid <span className="pill-badge">{statusCounts.unpaid}</span>
                  </button>
                </div>

                <div className="fee-type-filter-pills" role="tablist" aria-label="Filter by fee type">
                  <button
                    type="button"
                    className={`status-pill-btn fee-pill ${feeTypeFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setFeeTypeFilter('All')}
                    title="All fee types"
                  >
                    All Types <span className="pill-badge">{feeTypeCounts.all}</span>
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn fee-pill monthly ${feeTypeFilter === 'Monthly Fee' ? 'active' : ''}`}
                    onClick={() => setFeeTypeFilter('Monthly Fee')}
                    title="Filter by Monthly Fee"
                  >
                    <span className="dot dot-monthly"></span>
                    Monthly <span className="pill-badge">{feeTypeCounts.monthly}</span>
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn fee-pill admission ${feeTypeFilter === 'Admission Fee' ? 'active' : ''}`}
                    onClick={() => setFeeTypeFilter('Admission Fee')}
                    title="Filter by Admission Fee"
                  >
                    <span className="dot dot-admission"></span>
                    Admission <span className="pill-badge">{feeTypeCounts.admission}</span>
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn fee-pill admission-monthly ${feeTypeFilter === 'Admission & Monthly Fee' ? 'active' : ''}`}
                    onClick={() => setFeeTypeFilter('Admission & Monthly Fee')}
                    title="Filter by Admission & Monthly Fee"
                  >
                    <span className="dot dot-admission-monthly"></span>
                    Adm & Monthly <span className="pill-badge">{feeTypeCounts.admissionAndMonthly}</span>
                  </button>
                </div>
              </div>

              <div className="header-actions">
                <div className="filter-item status-filter-item">
                  <label htmlFor="paymentStatusFilter">Status:</label>
                  <select
                    id="paymentStatusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter-select"
                  >
                    <option value="All">All Status ({statusCounts.all})</option>
                    <option value="Paid">Paid ({statusCounts.paid})</option>
                    <option value="Unpaid">Unpaid / Pending ({statusCounts.unpaid})</option>
                  </select>
                </div>

                <div className="filter-item fee-type-filter-item">
                  <label htmlFor="paymentFeeTypeFilter">Fee Type:</label>
                  <select
                    id="paymentFeeTypeFilter"
                    value={feeTypeFilter}
                    onChange={(e) => setFeeTypeFilter(e.target.value)}
                    className="status-filter-select fee-type-filter-select"
                  >
                    <option value="All">All Fee Types ({feeTypeCounts.all})</option>
                    <option value="Monthly Fee">Monthly Fee ({feeTypeCounts.monthly})</option>
                    <option value="Admission Fee">Admission Fee ({feeTypeCounts.admission})</option>
                    <option value="Admission & Monthly Fee">Admission & Monthly Fee ({feeTypeCounts.admissionAndMonthly})</option>
                  </select>
                </div>

                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search by student ID, name, fee type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                      &times;
                    </button>
                  )}
                </div>
                <button
                  className="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={filteredPayments.length === 0}
                >
                  Generate Report
                </button>
              </div>
            </div>

            {/* Active Filter Strip */}
            {(statusFilter !== 'All' || feeTypeFilter !== 'All' || searchTerm) && (
              <div className="active-filter-strip">
                <div className="active-filter-info">
                  Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
                  {statusFilter !== 'All' && (
                    <span className={`filter-active-tag ${statusFilter.toLowerCase()}`}>
                      Status: {statusFilter === 'Unpaid' ? 'Unpaid / Pending' : 'Paid'}
                      <button type="button" onClick={() => setStatusFilter('All')} title="Remove status filter">&times;</button>
                    </span>
                  )}
                  {feeTypeFilter !== 'All' && (
                    <span className={`filter-active-tag fee-type ${feeTypeFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                      Fee Type: {feeTypeFilter}
                      <button type="button" onClick={() => setFeeTypeFilter('All')} title="Remove fee type filter">&times;</button>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="filter-active-tag search">
                      Search: "{searchTerm}"
                      <button type="button" onClick={() => setSearchTerm('')} title="Clear search">&times;</button>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="clear-all-filters-btn"
                  onClick={() => {
                    setStatusFilter('All');
                    setFeeTypeFilter('All');
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {fetchingPayments && payments.length === 0 ? (
              <div className="loading-message">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="no-payments">
                <p>
                  {searchTerm || statusFilter !== 'All' || feeTypeFilter !== 'All'
                    ? `No payment records found matching active filters${searchTerm ? ` and "${searchTerm}"` : ''}.`
                    : 'No payment records found'}
                </p>
                {(searchTerm || statusFilter !== 'All' || feeTypeFilter !== 'All') && (
                  <button
                    type="button"
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('All');
                      setFeeTypeFilter('All');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="payments-table-container">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Subjects</th>
                      <th>Fee Type</th>
                      <th>Admission Fee</th>
                      <th>Monthly Fee</th>
                      <th>Total Amount</th>
                      <th>Month</th>
                      <th>Payment Method</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => {
                      const admFee = payment.admissionFee !== undefined ? Number(payment.admissionFee) : 0;
                      const monFee = payment.monthlyFee !== undefined ? Number(payment.monthlyFee) : (admFee === 0 ? Number(payment.totalAmount || 0) : 0);
                      const pType = getPaymentFeeType(payment);
                      const statusVal = payment.paymentStatus || 'Paid';

                      return (
                        <tr key={payment._id}>
                          <td><strong>{payment.studentIdNumber || (payment.studentId?.studentId || '-')}</strong></td>
                          <td>{payment.studentId?.name || '-'}</td>
                          <td>
                            {payment.subjects && payment.subjects.length > 0 ? (
                              <div className="subjects-list">
                                {payment.subjects.map((subject, idx) => (
                                  <span key={idx} className="subject-tag">
                                    {typeof subject === 'object' ? subject.name : 'Unknown'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              payment.studentId?.subject ? (
                                <div className="subjects-list">
                                  {payment.studentId.subject.split(',').map((s, idx) => (
                                    <span key={idx} className="subject-tag">{s.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )
                            )}
                          </td>
                          <td>
                            <span className={`fee-type-badge ${pType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                              {pType}
                            </span>
                          </td>
                          <td className="fee-adm-cell">
                            {admFee > 0 ? `LKR ${admFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="fee-mon-cell">
                            {monFee > 0 ? `LKR ${monFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="amount-cell">
                            <strong>LKR {Number(payment.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </td>
                          <td>{payment.month || '-'}</td>
                          <td>{payment.paymentMethod || 'Cash'}</td>
                          <td>
                            {payment.paymentDate
                              ? new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : '-'}
                          </td>
                          <td>
                            <span className={`payment-status-badge ${statusVal.toLowerCase()}`}>
                              {statusVal}
                            </span>
                          </td>
                          <td>
                            <div className="payment-actions">
                              <button
                                className="edit-payment-btn"
                                onClick={() => handleEdit(payment)}
                                title="Edit Payment"
                              >
                                Edit
                              </button>
                              <button
                                className="delete-payment-btn"
                                onClick={() => handleDelete(payment._id)}
                                title="Delete Payment"
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

          {/* Edit Payment Modal */}
          {showEditModal && editingPayment && (
            <div className="modal-overlay" onClick={() => {
              setShowEditModal(false);
              setEditingPayment(null);
              setEditFormData({
                selectedSubjects: [],
                selectedMonths: [],
                paymentMethod: '',
                paymentDate: ''
              });
              setEditTotalFee(0);
            }}>
              <div className="modal-content payment-edit-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Payment</h2>
                <p className="modal-subtitle">
                  Student: {editingPayment.studentId?.name || editingPayment.studentIdNumber || 'Unknown'}
                </p>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label>Select Subjects *</label>
                    <div className="subjects-selection">
                      {getEditStudentSubjects().length === 0 ? (
                        <p className="no-subjects">No subjects available</p>
                      ) : (
                        <div className="subjects-checkbox-list">
                          {getEditStudentSubjects().map((subject) => (
                            <label key={subject._id} className="subject-checkbox-item">
                              <input
                                type="checkbox"
                                checked={editFormData.selectedSubjects.includes(subject._id)}
                                onChange={() => handleEditSubjectToggle(subject._id)}
                              />
                              <span>{subject.name} - LKR {(subject.studentPrice || subject.price || 0).toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editMonthlyClassFeeInput">Monthly Class Fee (LKR) *</label>
                    <div className="fee-input-wrapper">
                      <span className="fee-currency-prefix">LKR</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        id="editMonthlyClassFeeInput"
                        name="editMonthlyClassFeeInput"
                        value={editMonthlyClassFeeInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          setEditMonthlyClassFeeInput(val);
                        }}
                        placeholder="Enter monthly class fee"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Payment Month(s) *</label>
                    <PaymentMonthPicker
                      selectedMonths={editFormData.selectedMonths || []}
                      onChange={(newMonths) => {
                        setEditFormData((prev) => ({ ...prev, selectedMonths: newMonths }));
                        setError('');
                      }}
                      monthlyFee={editMonthlyClassFeeInput}
                      currency="LKR"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editPaymentMethod">Payment Method *</label>
                    <select
                      id="editPaymentMethod"
                      name="paymentMethod"
                      value={editFormData.paymentMethod}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editPaymentDate">Payment Date *</label>
                    <input
                      type="date"
                      id="editPaymentDate"
                      name="paymentDate"
                      value={editFormData.paymentDate}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editPaymentStatus">Payment Status *</label>
                    <select
                      id="editPaymentStatus"
                      name="paymentStatus"
                      value={editFormData.paymentStatus || 'Paid'}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                      required
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending / Unpaid</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Payment'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingPayment(null);
                        setEditFormData({
                          selectedSubjects: [],
                          selectedMonths: [],
                          paymentMethod: '',
                          paymentDate: '',
                          paymentStatus: 'Paid'
                        });
                        setEditTotalFee(0);
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

