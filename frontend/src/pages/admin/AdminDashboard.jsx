import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { generatePdfReport } from '../../utils/pdfReportGenerator';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { showSuccess, showError, showWarning, showConfirm, toastSuccess } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalSubjects: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    totalEmployees: 0
  });
  const [topCourses, setTopCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Live Clock & Date State (Updates every second with no reload)
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const token = useMemo(() => localStorage.getItem('adminToken'), []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to get start and end dates of a month
  const getMonthDateRange = (monthName, year = new Date().getFullYear()) => {
    const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex === -1) return null;
    
    const startDate = new Date(year, monthIndex, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, monthIndex + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    let detectedType = null;

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        detectedType = parsedUser?.type || null;
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    if (!detectedType && userTypeData) {
      detectedType = userTypeData;
    }

    if (detectedType === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      navigate('/admin/class', { replace: true });
    }

    setRoleChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (roleChecked && isAdmin) {
      fetchDashboardData();
    }
  }, [roleChecked, isAdmin, selectedMonth]);

  const fetchDashboardData = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {};

      // Build query parameters for month filter
      const incomeParams = new URLSearchParams();
      const paymentsParams = new URLSearchParams();
      if (selectedMonth) {
        incomeParams.append('months', selectedMonth);
        paymentsParams.append('month', selectedMonth);
      }

      const [
        incomeResponse,
        subjectsResponse,
        studentsResponse,
        employeesResponse,
        classesResponse,
        paymentsResponse
      ] = await Promise.all([
        fetch(`${API_CONFIG.API_URL}/income/statistics${incomeParams.toString() ? '?' + incomeParams.toString() : ''}`, { headers }),
        fetch(`${API_CONFIG.API_URL}/subjects`, { headers }),
        fetch(`${API_CONFIG.API_URL}/students`, { headers }),
        fetch(`${API_CONFIG.API_URL}/admin/employees`, { headers }),
        fetch(`${API_CONFIG.API_URL}/classes?includeDeleted=false`, { headers }),
        fetch(`${API_CONFIG.API_URL}/payments${paymentsParams.toString() ? '?' + paymentsParams.toString() : ''}`, { headers })
      ]);

      const [
        incomeData,
        subjectsData,
        studentsData,
        employeesData,
        classesData,
        paymentsData
      ] = await Promise.all([
        incomeResponse.json(),
        subjectsResponse.json(),
        studentsResponse.json(),
        employeesResponse.json(),
        classesResponse.json(),
        paymentsResponse.json()
      ]);

      if (!incomeData?.success) {
        throw new Error(incomeData?.message || 'Failed to fetch income statistics');
      }

      if (!subjectsData?.success) {
        throw new Error(subjectsData?.message || 'Failed to fetch subjects');
      }

      if (!studentsData?.success) {
        throw new Error(studentsData?.message || 'Failed to fetch students');
      }

      if (!employeesData?.success) {
        throw new Error(employeesData?.message || 'Failed to fetch employees');
      }

      if (!classesData?.success) {
        throw new Error(classesData?.message || 'Failed to fetch classes');
      }

      if (!paymentsData?.success) {
        throw new Error(paymentsData?.message || 'Failed to fetch payments');
      }

      const subjects = subjectsData.data || [];
      const students = studentsData.data || [];
      const employees = employeesData.data || [];
      const payments = paymentsData.data || [];
      const fetchedClasses = (classesData.data || []).filter(
        (cls) => cls.status === 'ongoing' && !cls.isDeleted
      );

      // Create a Set of student IDs that have payment records
      const studentsWithPayments = new Set();
      payments.forEach((payment) => {
        const studentId = typeof payment.studentId === 'object' 
          ? payment.studentId._id?.toString() || payment.studentId._id
          : payment.studentId?.toString() || payment.studentId;
        if (studentId) {
          studentsWithPayments.add(studentId);
        }
      });

      // Filter payments by month if selected
      let filteredPayments = payments;
      if (selectedMonth) {
        filteredPayments = payments.filter((payment) => {
          const paymentMonth = payment.month || '';
          return paymentMonth.toLowerCase().includes(selectedMonth.toLowerCase());
        });
        
        studentsWithPayments.clear();
        filteredPayments.forEach((payment) => {
          const studentId = typeof payment.studentId === 'object' 
            ? payment.studentId._id?.toString() || payment.studentId._id
            : payment.studentId?.toString() || payment.studentId;
          if (studentId) {
            studentsWithPayments.add(studentId);
          }
        });
      }

      const monthDateRange = selectedMonth ? getMonthDateRange(selectedMonth) : null;

      let eligibleStudents = students;
      if (selectedMonth && monthDateRange) {
        eligibleStudents = students.filter((student) => {
          const registrationDate = student.registrationDate 
            ? new Date(student.registrationDate)
            : (student.createdAt ? new Date(student.createdAt) : null);
          
          if (!registrationDate) return false;
          return registrationDate <= monthDateRange.endDate;
        });
      }

      const paidStudents = eligibleStudents.filter((student) => {
        const studentId = student._id?.toString() || student._id;
        return studentsWithPayments.has(studentId);
      }).length;
      
      const unpaidStudents = eligibleStudents.length - paidStudents;

      setSummary({
        totalEarnings: incomeData.data?.totalRevenue || 0,
        totalSubjects: subjects.length,
        paidStudents,
        unpaidStudents,
        totalEmployees: employees.length
      });
      setStudentsList(students);

      const subjectLookup = new Map(
        subjects.map((subject) => [subject._id, subject])
      );

      // Calculate top courses based on payment data
      const courseStats = new Map();

      payments.forEach((payment) => {
        const paymentSubjects = payment.subjects || [];
        const subjectCount = paymentSubjects.length;
        const totalAmount = payment.totalAmount || 0;
        const amountPerSubject = subjectCount > 0 ? totalAmount / subjectCount : 0;

        paymentSubjects.forEach((subjectRef) => {
          const subjectId = typeof subjectRef === 'string' ? subjectRef : subjectRef?._id;
          if (!subjectId) {
            return;
          }

          const subjectInfo =
            (typeof subjectRef === 'object' && subjectRef !== null ? subjectRef : subjectLookup.get(subjectId)) ||
            {};

          const subjectPrice = subjectInfo.price || 0;

          const existing = courseStats.get(subjectId) || {
            id: subjectId,
            name: subjectInfo.name || 'Unknown Subject',
            price: subjectPrice,
            teacher: subjectInfo.conductedBy?.name || subjectInfo.conductedBy || '',
            image: subjectInfo.image || ''
          };

          courseStats.set(subjectId, {
            ...existing,
            enrollmentCount: (existing.enrollmentCount || 0) + 1,
            revenue: (existing.revenue || 0) + amountPerSubject
          });
        });
      });

      const computedTopCourses = Array.from(courseStats.values())
        .sort((a, b) => {
          if ((b.revenue || 0) !== (a.revenue || 0)) {
            return (b.revenue || 0) - (a.revenue || 0);
          }
          return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
        })
        .slice(0, 3);

      setTopCourses(computedTopCourses);
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const createStudentReport = (students, filename, paymentMap = null, isNonPaidReport = false) => {
    if (!studentsList.length) {
      showWarning('No Students', 'No student data available.');
      return;
    }

    const targetStudents = students(studentsList);

    if (!targetStudents.length) {
      showWarning('No Matches', 'No matching students found for this report.');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Registration Date', 'Email', 'Mobile', 'Subjects', 'Payment Type'];
    const rows = targetStudents.map((student) => {
      const subjectNames = Array.isArray(student.subjects)
        ? student.subjects
            .map((subject) =>
              typeof subject === 'object' ? subject.name : subject
            )
            .filter(Boolean)
            .join(', ')
        : '';

      let paymentType = '';
      if (isNonPaidReport) {
        paymentType = 'Non';
      } else if (paymentMap) {
        const studentId = student._id?.toString() || student._id;
        const paymentInfo = paymentMap.get(studentId);
        if (paymentInfo && paymentInfo.paymentMethod) {
          paymentType = paymentInfo.paymentMethod;
        }
      } else {
        paymentType = student.paymentType || '';
      }

      const registrationDate = student.registrationDate 
        ? new Date(student.registrationDate).toISOString().slice(0, 10)
        : (student.createdAt ? new Date(student.createdAt).toISOString().slice(0, 10) : '');

      return [
        student.studentId || '',
        student.name || '',
        registrationDate,
        student.email || '',
        student.mobile || '',
        subjectNames,
        paymentType
      ];
    });

    generatePdfReport({
      title: isNonPaidReport ? 'Unpaid / Pending Students Report' : 'Paid Students Report',
      subtitle: 'Wisdom Institute of Higher Education • Student fee settlement breakdown',
      filename: `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'landscape',
      filterInfo: [
        { label: 'Payment Status', value: isNonPaidReport ? 'Unpaid / Pending' : 'Paid' },
        ...(selectedMonth ? [{ label: 'Selected Month', value: selectedMonth }] : [])
      ],
      summaryCards: [
        { label: 'Total In Scope', value: rows.length },
        { label: 'Status Category', value: isNonPaidReport ? 'Pending Fees' : 'Fees Cleared', color: isNonPaidReport ? 'red' : 'green' }
      ]
    });
    toastSuccess('Student PDF report downloaded successfully');
  };

  const handleDownloadNonPaidReport = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const paymentsParams = new URLSearchParams();
      if (selectedMonth) {
        paymentsParams.append('month', selectedMonth);
      }
      
      const paymentsUrl = selectedMonth 
        ? `${API_CONFIG.API_URL}/payments?${paymentsParams.toString()}`
        : `${API_CONFIG.API_URL}/payments`;
      
      const paymentsResponse = await fetch(paymentsUrl, { headers });
      const paymentsData = await paymentsResponse.json();
      const payments = paymentsData.success ? paymentsData.data || [] : [];

      let filteredPayments = payments;
      if (selectedMonth) {
        filteredPayments = payments.filter((payment) => {
          const paymentMonth = payment.month || '';
          return paymentMonth.toLowerCase().includes(selectedMonth.toLowerCase());
        });
      }

      const studentsWithPayments = new Set();
      filteredPayments.forEach((payment) => {
        const studentId = typeof payment.studentId === 'object' 
          ? payment.studentId._id?.toString() || payment.studentId._id
          : payment.studentId?.toString() || payment.studentId;
        if (studentId) {
          studentsWithPayments.add(studentId);
        }
      });

      const monthDateRange = selectedMonth ? getMonthDateRange(selectedMonth) : null;

      const reportFilename = selectedMonth 
        ? `non-paid-students-${selectedMonth.toLowerCase()}`
        : 'non-paid-students';

      createStudentReport(
        (students) => {
          let eligibleStudents = students;
          
          if (selectedMonth && monthDateRange) {
            eligibleStudents = students.filter((student) => {
              const registrationDate = student.registrationDate 
                ? new Date(student.registrationDate)
                : (student.createdAt ? new Date(student.createdAt) : null);
              
              if (!registrationDate) return false;
              return registrationDate <= monthDateRange.endDate;
            });
          }
          
          return eligibleStudents.filter((student) => {
            const studentId = student._id?.toString() || student._id;
            return !studentsWithPayments.has(studentId);
          });
        },
        reportFilename,
        null,
        true
      );
    } catch (err) {
      console.error('Error fetching payments for report:', err);
      showError('Report Error', 'Failed to generate report. Please try again.');
    }
  };

  const handleDownloadPaidReport = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const paymentsParams = new URLSearchParams();
      if (selectedMonth) {
        paymentsParams.append('month', selectedMonth);
      }
      
      const paymentsUrl = selectedMonth 
        ? `${API_CONFIG.API_URL}/payments?${paymentsParams.toString()}`
        : `${API_CONFIG.API_URL}/payments`;
      
      const paymentsResponse = await fetch(paymentsUrl, { headers });
      const paymentsData = await paymentsResponse.json();
      const payments = paymentsData.success ? paymentsData.data || [] : [];

      let filteredPayments = payments;
      if (selectedMonth) {
        filteredPayments = payments.filter((payment) => {
          const paymentMonth = payment.month || '';
          return paymentMonth.toLowerCase().includes(selectedMonth.toLowerCase());
        });
      }

      const studentsWithPayments = new Set();
      const studentPaymentMap = new Map();
      
      filteredPayments.forEach((payment) => {
        const studentId = typeof payment.studentId === 'object' 
          ? payment.studentId._id?.toString() || payment.studentId._id
          : payment.studentId?.toString() || payment.studentId;
        if (studentId) {
          studentsWithPayments.add(studentId);
          if (!studentPaymentMap.has(studentId)) {
            studentPaymentMap.set(studentId, new Set());
          }
          if (payment.paymentMethod) {
            studentPaymentMap.get(studentId).add(payment.paymentMethod);
          }
        }
      });

      const studentPaymentMethodMap = new Map();
      studentPaymentMap.forEach((methods, studentId) => {
        studentPaymentMethodMap.set(studentId, {
          paymentMethod: Array.from(methods).join(', ')
        });
      });

      const monthDateRange = selectedMonth ? getMonthDateRange(selectedMonth) : null;

      const reportFilename = selectedMonth 
        ? `paid-students-${selectedMonth.toLowerCase()}`
        : 'paid-students';

      createStudentReport(
        (students) => {
          let eligibleStudents = students;
          
          if (selectedMonth && monthDateRange) {
            eligibleStudents = students.filter((student) => {
              const registrationDate = student.registrationDate 
                ? new Date(student.registrationDate)
                : (student.createdAt ? new Date(student.createdAt) : null);
              
              if (!registrationDate) return false;
              return registrationDate <= monthDateRange.endDate;
            });
          }
          
          return eligibleStudents.filter((student) => {
            const studentId = student._id?.toString() || student._id;
            return studentsWithPayments.has(studentId);
          });
        },
        reportFilename,
        studentPaymentMethodMap
      );
    } catch (err) {
      console.error('Error fetching payments for report:', err);
      showError('Report Error', 'Failed to generate report. Please try again.');
    }
  };

  const handleGenerateFilteredReport = () => {
    if (!selectedMonth) {
      showWarning('Select Month', 'Please select a month to generate a filtered report.');
      return;
    }

    const headers = ['Category / Item', 'Details / Count', 'Financial Value (LKR)'];
    const rows = [
      ['Total Earnings', 'Consolidated monthly gross revenue', `LKR ${formatCurrency(summary.totalEarnings)}`],
      ['Total Subjects / Courses', `${summary.totalSubjects} active courses`, '-'],
      ['Paid Students', `${summary.paidStudents} students with cleared fees`, '-'],
      ['Non-Paid Students', `${summary.unpaidStudents} students with pending fees`, '-'],
      ['Total Employees', `${summary.totalEmployees} faculty & administrative staff`, '-'],
      ...topCourses.map(course => [
        `Top Course: ${course.name}`,
        `${course.enrollmentCount || 0} students enrolled`,
        `LKR ${formatCurrency(course.revenue || 0)}`
      ])
    ];

    generatePdfReport({
      title: `Executive Monthly Performance Report (${selectedMonth})`,
      subtitle: 'Wisdom LMS • Institutional Financial & Academic Performance Analysis',
      filename: `dashboard-report-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
      orientation: 'portrait',
      filterInfo: [{ label: 'Selected Month', value: selectedMonth }],
      summaryCards: [
        { label: 'Total Earnings', value: `LKR ${formatCurrency(summary.totalEarnings)}`, color: 'green' },
        { label: 'Paid Students', value: summary.paidStudents, color: 'green' },
        { label: 'Unpaid Students', value: summary.unpaidStudents, color: 'red' },
        { label: 'Total Faculty', value: summary.totalEmployees }
      ]
    });
    toastSuccess('Dashboard PDF report downloaded successfully');
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hourStr, minuteStr] = time.split(':');
    if (!hourStr || !minuteStr) return time;
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, '0');
    const isPM = hour >= 12;
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    return `${hour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  };

  // Donut chart using exact palette colors: Purple (#7c3aed), Green (#22c55e), Blue (#0d8ecf)
  const chartSegments = useMemo(() => {
    if (!topCourses.length) {
      return {
        background: '#e2e8f0',
        total: 0
      };
    }

    const totalRevenue = topCourses.reduce((sum, course) => sum + (course.revenue || 0), 0);

    if (totalRevenue === 0) {
      return {
        background: '#e2e8f0',
        total: 0
      };
    }

    const palette = ['#7c3aed', '#22c55e', '#0d8ecf'];
    const segments = [];
    let currentPercent = 0;

    topCourses.forEach((course, index) => {
      const share = ((course.revenue || 0) / totalRevenue) * 100;
      const endPercent = currentPercent + share;
      const color = palette[index % palette.length];
      segments.push(`${color} ${currentPercent}% ${endPercent}%`);
      currentPercent = endPercent;
    });

    if (currentPercent < 100) {
      segments.push(`#e2e8f0 ${currentPercent}% 100%`);
    }

    return {
      background: `conic-gradient(${segments.join(', ')})`,
      total: totalRevenue
    };
  }, [topCourses]);

  // Derived live hero calculations
  const weekday = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const fullDate = currentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const hours = String(currentDateTime.getHours()).padStart(2, '0');
  const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
  const clockString = `${hours}:${minutes}:${seconds}`;

  const tzOffsetMin = -currentDateTime.getTimezoneOffset();
  const tzSign = tzOffsetMin >= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffsetMin) / 60)).padStart(2, '0');
  const tzMins = String(Math.abs(tzOffsetMin) % 60).padStart(2, '0');
  let tzName = '';
  try {
    tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    tzName = '';
  }
  const timezoneString = `GMT${tzSign}${tzHours}:${tzMins}${tzName ? ` • ${tzName}` : ''}`;

  const dayNumber = String(currentDateTime.getDate()).padStart(2, '0');
  const monthYearString = currentDateTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const hour = currentDateTime.getHours();
  let greetingBase = 'Good morning';
  let greetingEmoji = '☀️';

  if (hour >= 5 && hour < 12) {
    greetingBase = 'Good morning';
    greetingEmoji = '☀️';
  } else if (hour >= 12 && hour < 17) {
    greetingBase = 'Good afternoon';
    greetingEmoji = '🌤️';
  } else if (hour >= 17 && hour < 22) {
    greetingBase = 'Good evening';
    greetingEmoji = '🌆';
  } else {
    greetingBase = 'Good evening';
    greetingEmoji = '🌙';
  }

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const adminDisplayName = (storedUser.name && storedUser.name !== 'Admin') ? storedUser.name : 'Wisdom Admin';
  const greetingText = `${greetingBase}, ${adminDisplayName}`;

  // 5 Key Metric Cards using exact application palette
  const keyMetricCards = [
    {
      id: 'total-earnings',
      label: 'Total Earnings',
      value: `LKR ${formatCurrency(summary.totalEarnings)}`,
      badgeClass: 'lavender',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'total-subjects',
      label: 'Total Subjects',
      value: summary.totalSubjects,
      badgeClass: 'sky',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d8ecf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'paid-students',
      label: 'Paid Students',
      value: summary.paidStudents,
      badgeClass: 'green',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      clickable: true,
      onClick: handleDownloadPaidReport
    },
    {
      id: 'unpaid-students',
      label: 'Non Paid Students',
      value: summary.unpaidStudents,
      badgeClass: 'red',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="18" y1="8" x2="23" y2="13" />
          <line x1="23" y1="8" x2="18" y2="13" />
        </svg>
      ),
      clickable: true,
      onClick: handleDownloadNonPaidReport
    },
    {
      id: 'total-employees',
      label: 'Total Employees',
      value: summary.totalEmployees,
      badgeClass: 'pink',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    }
  ];

  // Render Ongoing Class Card with dark navy date badge (#0b1024)
  const renderClassCard = (classItem) => {
    const subject = classItem.subjectId || {};
    const teacher = classItem.teacherId || {};
    
    let monthLabel = 'CLASS';
    let dayLabel = '--';
    if (classItem.date) {
      const d = new Date(classItem.date);
      if (!isNaN(d.getTime())) {
        monthLabel = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        dayLabel = String(d.getDate()).padStart(2, '0');
      }
    }

    const className = subject.name || 'Untitled Class';
    const category = classItem.category || subject.category || (subject.name ? `${subject.name} - Regular Class` : 'General Class');

    return (
      <div key={classItem._id} className="ongoing-class-card">
        {/* Dark Navy Date Badge */}
        <div className="class-date-badge">
          <span className="class-badge-month">{monthLabel}</span>
          <span className="class-badge-day">{dayLabel}</span>
        </div>

        {/* Class Content */}
        <div className="ongoing-class-content">
          <h3 className="ongoing-class-title">{className}</h3>
          <span className="ongoing-class-category">{category}</span>

          <div className="ongoing-class-meta">
            <div className="ongoing-class-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d8ecf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatTime(classItem.time)}</span>
            </div>
            <div className="ongoing-class-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d8ecf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{teacher.name || 'Unknown Teacher'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!roleChecked || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="admin-main-content">
        <Topbar userName="Wisdom Admin" />
        <div className="admin-content">
          
          {/* ==========================================================================
              1. PAGE HEADER ROW: Title on left, Solid Green Filter Button on right
              ========================================================================== */}
          <div className="admin-header-row">
            <h1>Dashboard Overview</h1>
            <div className="dashboard-header-actions">
              <button
                type="button"
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Filter'}
              </button>
              {selectedMonth && (
                <>
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => setSelectedMonth('')}
                  >
                    Clear Filter
                  </button>
                  <button
                    type="button"
                    className="filtered-report-btn"
                    onClick={handleGenerateFilteredReport}
                  >
                    Generate Report ({selectedMonth})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Month Filter Drawer */}
          {showFilters && (
            <div className="filter-section">
              <div className="filter-group">
                <label>Select Month</label>
                <div className="month-select-wrapper">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-select"
                  >
                    <option value="">All Months</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  {selectedMonth && (
                    <div className="selected-month-info">
                      <span>Filtered by: {selectedMonth}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="admin-error-banner">
              <p>{error}</p>
            </div>
          )}

          {/* ==========================================================================
              2. HERO BANNER: Greeting + Live Clock & Calendar Stat Chips
              ========================================================================== */}
          <div className="dashboard-hero-banner">
            {/* Ambient translucent decorative circles */}
            <div className="hero-decor-circle circle-1" aria-hidden="true" />
            <div className="hero-decor-circle circle-2" aria-hidden="true" />
            <div className="hero-decor-circle circle-3" aria-hidden="true" />

            {/* Left side: Date, Greeting, Subtitle */}
            <div className="hero-content-left">
              <div className="hero-date-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{weekday}, {fullDate}</span>
              </div>
              <h2 className="hero-greeting">
                {greetingText} <span className="hero-greeting-emoji">{greetingEmoji}</span>
              </h2>
              <p className="hero-subtitle">
                Here is what is happening across your learning center today.
              </p>
            </div>

            {/* Right side: Two frosted-glass chips (Live Clock + Day/Month) */}
            <div className="hero-content-right">
              {/* Chip 1: Live Clock */}
              <div className="hero-glass-chip">
                <div className="chip-clock-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="chip-clock-icon">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="chip-clock-text">{clockString}</span>
                </div>
                <span className="chip-subtext">{timezoneString}</span>
              </div>

              {/* Chip 2: Day Number & Month/Year */}
              <div className="hero-glass-chip">
                <span className="chip-day-number">{dayNumber}</span>
                <span className="chip-subtext">{monthYearString}</span>
              </div>
            </div>
          </div>

          {/* ==========================================================================
              3. KEY METRICS SECTION: 5 White Cards with Exact Palette Badges
              ========================================================================== */}
          <section className="dashboard-metrics-section">
            <h2 className="metrics-section-title">Key Metrics</h2>
            <div className="metrics-grid-5">
              {keyMetricCards.map((card) => {
                return (
                  <div
                    key={card.id}
                    className={`metric-card ${card.clickable ? 'metric-card-clickable' : ''}`}
                    onClick={card.onClick}
                    role={card.clickable ? 'button' : undefined}
                    tabIndex={card.clickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (card.clickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        card.onClick();
                      }
                    }}
                    title={card.clickable ? 'Click to download report' : undefined}
                  >
                    <div className={`metric-icon-badge ${card.badgeClass}`}>
                      {card.icon}
                    </div>
                    <div className="metric-info">
                      <p className="metric-label">{card.label}</p>
                      <p className="metric-value">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ==========================================================================
              4. TWO SIDE-BY-SIDE PANELS: Top Selling Courses & Ongoing Classes
              ========================================================================== */}
          <div className="dashboard-bottom-grid">
            
            {/* Panel 1: Top Selling Courses (Donut Chart + Legend) */}
            <section className="dashboard-panel top-courses-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Top Selling Courses</h2>
                  <p className="panel-subtitle">Based on student enrollments</p>
                </div>
              </div>

              {topCourses.length ? (
                <div className="top-courses-content">
                  <div
                    className="top-courses-donut-chart"
                    style={{ background: chartSegments.background }}
                  >
                    <div className="top-courses-donut-inner">
                      <span className="donut-center-label">TOTAL</span>
                      <span className="donut-center-amount">
                        LKR {formatCurrency(chartSegments.total)}
                      </span>
                    </div>
                  </div>

                  <div className="top-courses-legend">
                    {topCourses.map((course, index) => {
                      const palette = ['#7c3aed', '#22c55e', '#0d8ecf'];
                      const color = palette[index % palette.length];
                      return (
                        <div key={course.id || index} className="top-course-legend-item">
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: color }}
                          />
                          <div className="legend-details">
                            <p className="legend-course-name">{course.name}</p>
                            <p className="legend-enrollment-count">
                              {course.enrollmentCount || 0} enrolled
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>{loading ? 'Loading chart…' : 'No enrollment data available yet.'}</p>
                </div>
              )}
            </section>

            {/* Panel 2: Ongoing Classes (View All Link + Class Cards with Navy Badges) */}
            <section className="dashboard-panel ongoing-classes-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Ongoing Classes</h2>
                  <p className="panel-subtitle">Classes that teachers are currently running</p>
                </div>
                <button
                  type="button"
                  className="view-classes-link"
                  onClick={() => navigate('/admin/classes/view')}
                >
                  View All
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {classes.length ? (
                <div className="ongoing-classes-grid">
                  {classes.slice(0, 4).map((classItem) => renderClassCard(classItem))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>{loading ? 'Loading classes…' : 'No ongoing classes at the moment.'}</p>
                </div>
              )}
            </section>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
