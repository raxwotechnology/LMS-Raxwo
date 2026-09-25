import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Expense from '@/lib/models/Expense';
import Employee from '@/lib/models/Employee';
import Student from '@/lib/models/Student';
import ExtraIncome from '@/lib/models/ExtraIncome';
import Payment from '@/lib/models/Payment';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = searchParams.get('months');
    const year = searchParams.get('year');

    await connectDB();

    let monthFilter = {};
    let yearFilter = {};

    if (months) {
      const monthArray = months.includes(',') ? months.split(',') : [months];
      monthFilter = { month: { $in: monthArray.map(m => m.trim()) } };
    }

    if (year) {
      yearFilter = { year: String(year) };
    }

    const expenseQuery = { ...monthFilter, ...yearFilter };
    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.price || 0), 0);

    const employees = await Employee.find();
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.basicSalary || 0) + (emp.commission || 0), 0);

    let totalStudentPayments = 0;
    let students = [];
    if (months) {
      const monthArray = months.includes(',') ? months.split(',') : [months];
      const monthRegex = monthArray.map(m => {
        const trimmedMonth = m.trim();
        const escapedMonth = trimmedMonth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|,\\s*)${escapedMonth}(\\s*,|$)`, 'i');
      });
      const payments = await Payment.find({ 
        $or: monthRegex.map(regex => ({ month: { $regex: regex } }))
      });
      totalStudentPayments = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    } else {
      students = await Student.find();
      totalStudentPayments = students.reduce((sum, student) => sum + (student.totalPrice || 0), 0);
    }

    const extraIncomeQuery = { ...monthFilter, ...yearFilter };
    const extraIncomes = await ExtraIncome.find(extraIncomeQuery);
    const totalExtraIncome = extraIncomes.reduce((sum, extra) => sum + (extra.amount || 0), 0);

    const totalRevenue = totalStudentPayments + totalExtraIncome;
    const netIncome = totalRevenue - totalExpenses - totalSalary;

    const expenseBreakdown = expenses.reduce((acc, expense) => {
      const type = expense.type || 'Other';
      acc[type] = (acc[type] || 0) + (expense.price || 0);
      return acc;
    }, {});

    const expenseDetails = Object.entries(expenseBreakdown).map(([type, amount]) => ({
      type,
      amount
    }));

    const extraIncomeDetails = extraIncomes.map(extra => ({
      title: extra.title,
      amount: extra.amount,
      year: extra.year,
      month: extra.month
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalExpenses,
        totalSalary,
        totalStudentPayments,
        totalExtraIncome,
        totalRevenue,
        netIncome,
        expenseDetails,
        extraIncomeDetails,
        expenseCount: expenses.length,
        salaryCount: employees.length,
        studentCount: students.length,
        extraIncomeCount: extraIncomes.length
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
