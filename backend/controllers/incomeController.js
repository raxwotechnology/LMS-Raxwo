import Expense from '../models/Expense.js';
import Employee from '../models/Employee.js';
import Student from '../models/Student.js';
import ExtraIncome from '../models/ExtraIncome.js';
import Payment from '../models/Payment.js';

// @desc    Get income statistics
// @route   GET /api/income/statistics
// @access  Private
export const getIncomeStatistics = async (req, res) => {
  try {
    // Get month filter from query parameters
    const { months, year } = req.query;
    let monthFilter = {};
    let yearFilter = {};

    // Parse months filter (can be single month or comma-separated months)
    if (months) {
      const monthArray = Array.isArray(months) ? months : months.split(',');
      monthFilter = { month: { $in: monthArray.map(m => m.trim()) } };
    }

    // Parse year filter
    if (year) {
      yearFilter = { year: String(year) };
    }

    // Calculate total expenses (filtered by month/year if provided)
    const expenseQuery = { ...monthFilter, ...yearFilter };
    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.price || 0), 0);

    // Calculate total salary (sum of all employees' basic salary + commission)
    // Note: Salary is not month-specific, so we include it in all cases
    const employees = await Employee.find();
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.basicSalary || 0) + (emp.commission || 0), 0);

    // Calculate total student payments directly from Payment collection (filtered by month/year if provided)
    let paymentQuery = {};
    const paymentAndConditions = [];

    // Filter by year if provided
    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        const startOfYear = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0));
        const endOfYear = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
        paymentAndConditions.push({ paymentDate: { $gte: startOfYear, $lte: endOfYear } });
      }
    }

    // Filter by month(s) if provided
    if (months) {
      const monthArray = Array.isArray(months) ? months : months.split(',');
      const monthRegex = monthArray.map(m => {
        const trimmedMonth = m.trim();
        const escapedMonth = trimmedMonth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|,\\s*)${escapedMonth}(\\s*,|$)`, 'i');
      });
      paymentAndConditions.push({ $or: monthRegex.map(regex => ({ month: { $regex: regex } })) });
    }

    if (paymentAndConditions.length === 1) {
      paymentQuery = paymentAndConditions[0];
    } else if (paymentAndConditions.length > 1) {
      paymentQuery = { $and: paymentAndConditions };
    }

    const payments = await Payment.find(paymentQuery)
      .populate('studentId', 'name studentId email')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1, createdAt: -1 });

    const totalStudentClassPayments = payments.reduce((sum, payment) => sum + (Number(payment.totalAmount) || 0), 0);

    // Calculate total registration fees from Student collection (filtered by month/year if provided)
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    const allStudents = await Student.find().sort({ registrationDate: -1, createdAt: -1 });

    const filteredStudents = allStudents.filter(student => {
      const regDate = student.registrationDate ? new Date(student.registrationDate) : (student.createdAt ? new Date(student.createdAt) : null);
      if (!regDate || isNaN(regDate.getTime())) return !months && !year;

      if (year) {
        if (regDate.getFullYear() !== parseInt(year, 10)) {
          return false;
        }
      }

      if (months) {
        const monthArray = (Array.isArray(months) ? months : months.split(',')).map(m => m.trim().toLowerCase());
        const studentMonth = monthNames[regDate.getMonth()];
        if (!monthArray.includes(studentMonth)) {
          return false;
        }
      }

      return true;
    });

    const registrationFeeDetails = filteredStudents
      .map(student => {
        const fee = Number(
          student.totalFee !== undefined && student.totalFee !== null
            ? student.totalFee
            : ((student.admissionFee || 0) + (student.monthlyClassFee || 0) || student.totalPrice || 0)
        );
        return {
          _id: student._id,
          studentIdNumber: student.studentId || '-',
          studentName: student.name || '',
          admissionFee: Number(student.admissionFee) || 0,
          monthlyClassFee: Number(student.monthlyClassFee) || 0,
          totalFee: fee,
          registrationDate: student.registrationDate || student.createdAt,
          paymentStatus: student.paymentStatus || 'Pending'
        };
      })
      .filter(item => item.totalFee > 0);

    const totalRegistrationFee = registrationFeeDetails.reduce((sum, item) => sum + item.totalFee, 0);

    // Total Student Payments = Class Payments (from Payment collection) + Registration Fees (from Student collection)
    const totalStudentPayments = totalStudentClassPayments + totalRegistrationFee;

    // Calculate total extra income (filtered by month/year if provided)
    const extraIncomeQuery = { ...monthFilter, ...yearFilter };
    const extraIncomes = await ExtraIncome.find(extraIncomeQuery);
    const totalExtraIncome = extraIncomes.reduce((sum, extra) => sum + (extra.amount || 0), 0);

    // Calculate total revenue (student payments + extra income)
    const totalRevenue = totalStudentPayments + totalExtraIncome;

    // Calculate net income (total revenue - expenses - salary)
    const netIncome = totalRevenue - totalExpenses - totalSalary;

    // Get detailed breakdown
    const expenseBreakdown = expenses.reduce((acc, expense) => {
      const type = expense.type || 'Other';
      acc[type] = (acc[type] || 0) + (expense.price || 0);
      return acc;
    }, {});

    const expenseDetails = Object.entries(expenseBreakdown).map(([type, amount]) => ({
      type,
      amount
    }));

    // Get extra income breakdown
    const extraIncomeDetails = extraIncomes.map(extra => ({
      title: extra.title,
      amount: extra.amount,
      year: extra.year,
      month: extra.month
    }));

    // Get student class payments breakdown for Finance overview
    const paymentDetails = payments.map(payment => ({
      _id: payment._id,
      studentIdNumber: payment.studentIdNumber || payment.studentId?.studentId || '-',
      studentName: payment.studentId?.name || '',
      month: payment.month,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      totalAmount: payment.totalAmount || 0,
      subjects: (payment.subjects || []).map(s => (typeof s === 'object' ? s.name : s)).filter(Boolean)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        totalSalary,
        totalStudentPayments,
        totalStudentClassPayments,
        totalRegistrationFee,
        totalExtraIncome,
        totalRevenue,
        netIncome,
        expenseDetails,
        extraIncomeDetails,
        paymentDetails,
        registrationFeeDetails,
        expenseCount: expenses.length,
        salaryCount: employees.length,
        paymentCount: payments.length,
        registrationCount: registrationFeeDetails.length,
        studentCount: new Set([
          ...payments.map(p => p.studentIdNumber || p.studentId?._id?.toString() || p.studentId?.toString()),
          ...registrationFeeDetails.map(r => r.studentIdNumber)
        ].filter(Boolean)).size,
        extraIncomeCount: extraIncomes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

