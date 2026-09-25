'use client';
import styles from './page.module.css';

const safeLocalStorage = {
  getItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.getItem(key) : null),
  setItem: (key, val) => (typeof window !== 'undefined' ? window.safeLocalStorage.setItem(key, val) : undefined),
  removeItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.removeItem(key) : undefined),
};

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
const revenueIcon = '/assets/revenue.png';
const expensesIcon = '/assets/expenses (2).png';
const employeeSalaryIcon = '/assets/employeeSalary.png';
const netIncomeIcon = '/assets/netincome.png';

const IncomePage = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const token = safeLocalStorage.getItem('adminToken');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchIncomeStatistics();
  }, [selectedMonths]);

  const handleMonthToggle = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedMonths([]);
  };

  const fetchIncomeStatistics = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedMonths.length > 0) {
        params.append('months', selectedMonths.join(','));
      }

      const url = `/api/income/statistics${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch income statistics');
      }
    } catch (err) {
      console.error('Error fetching income statistics:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const summaryRows = React.useMemo(() => {
    if (!statistics) {
      return [];
    }

    return [
      {
        label: 'Total Student Payments',
        amount: statistics.totalStudentPayments || 0
      },
      {
        label: 'Total Extra Income',
        amount: statistics.totalExtraIncome || 0
      },
      {
        label: 'Total Expenses',
        amount: statistics.totalExpenses || 0
      },
      {
        label: 'Total Employee Salary',
        amount: statistics.totalSalary || 0
      },
      {
        label: 'Total Revenue',
        amount: statistics.totalRevenue || 0
      }
    ];
  }, [statistics]);

  const filteredSummaryRows = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return summaryRows;
    }
    return summaryRows.filter((row) =>
      [row.label, row.amount?.toString()]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [summaryRows, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredSummaryRows.length) {
      alert('No finance summary records available to generate a report.');
      return;
    }

    const headers = ['Metric', 'Amount (LKR)'];
    const rows = filteredSummaryRows.map((row) => [
      row.label,
      row.amount ?? 0
    ]);

    const csvContent = [
      `Finance Report - ${new Date().toISOString().slice(0, 10)}`,
      ...headers,
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateFilteredReport = () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month to generate a filtered report.');
      return;
    }

    if (!filteredSummaryRows.length) {
      alert('No finance summary records available to generate a report.');
      return;
    }

    // Build filter info for report
    const filterText = `\nFiltered by: Months: ${selectedMonths.join(', ')}\n`;

    const headers = ['Metric', 'Amount (LKR)'];
    const rows = filteredSummaryRows.map((row) => [
      row.label,
      row.amount ?? 0
    ]);

    const csvContent = [
      `Finance Report - Filtered by Month(s) - ${new Date().toISOString().slice(0, 10)}${filterText}`,
      ...headers,
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `finance-report-filtered-${selectedMonths.join('-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles['income-page'] || 'income-page'}>
        <Sidebar />
        <div className={styles['income-main-content'] || 'income-main-content'}>
          <Topbar userName="Wisdom Admin" />
          <div className={styles['income-content'] || 'income-content'}>
            <div className={styles['loading-state'] || 'loading-state'}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className={styles['income-page'] || 'income-page'}>
        <Sidebar />
        <div className={styles['income-main-content'] || 'income-main-content'}>
          <Topbar userName="Wisdom Admin" />
          <div className={styles['income-content'] || 'income-content'}>
            <div className={styles['error-state'] || 'error-state'}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['income-page'] || 'income-page'}>
      <Sidebar />
      <div className={styles['income-main-content'] || 'income-main-content'}>
        <Topbar userName="Wisdom Admin" />
        
        <div className={styles['income-content'] || 'income-content'}>
          <div className={styles['income-header'] || 'income-header'}>
            <h1>Income Overview</h1>
            <div className={styles['income-header-actions'] || 'income-header-actions'}>
              <div className={styles['income-search'] || 'income-search'}>
                <input
                  type="text"
                  placeholder="Search finance summary"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={styles['search-clear-btn'] || 'search-clear-btn'}
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className={styles['filter-toggle-btn'] || 'filter-toggle-btn'}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Filter'}
              </button>
              <button
                type="button"
                className={styles['report-btn'] || 'report-btn'}
                onClick={handleGenerateReport}
                disabled={filteredSummaryRows.length === 0}
              >
                Generate Report
              </button>
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className={styles['filtered-report-btn'] || 'filtered-report-btn'}
                  onClick={handleGenerateFilteredReport}
                  disabled={filteredSummaryRows.length === 0}
                >
                  Generate Filtered Report
                </button>
              )}
            </div>
          </div>

          {/* Month Filter Section */}
          {showFilters && (
            <div className={styles['filter-section'] || 'filter-section'}>
            <div className={styles['filter-header-row'] || 'filter-header-row'}>
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className={styles['clear-filter-btn'] || 'clear-filter-btn'}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className={styles['filter-group'] || 'filter-group'}>
              <label>Select Month(s)</label>
              <div className={styles['months-filter'] || 'months-filter'}>
                <div className={styles['months-checkbox-grid'] || 'months-checkbox-grid'}>
                  {months.map((month, index) => (
                    <label key={index} className={styles['month-checkbox-label'] || 'month-checkbox-label'}>
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month)}
                        onChange={() => handleMonthToggle(month)}
                      />
                      <span>{month}</span>
                    </label>
                  ))}
                </div>
                {selectedMonths.length > 0 && (
                  <div className={styles['selected-months-info'] || 'selected-months-info'}>
                    <span>{selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected: {selectedMonths.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {statistics && (
            <>
              {/* Summary Cards */}
              <div className={styles['income-cards'] || 'income-cards'}>
                <div className={`${styles[(styles['income-card'] || 'income-card')] || (styles['income-card'] || 'income-card')} ${styles[(styles['revenue'] || 'revenue')] || (styles['revenue'] || 'revenue')}`}>
                  <div className={styles['card-icon'] || 'card-icon'}>
                    <img src={revenueIcon} alt="Revenue" />
                  </div>
                  <div className={styles['card-content'] || 'card-content'}>
                    <h3>Total Revenue</h3>
                    <p className={`${styles[(styles['card-value'] || 'card-value')] || (styles['card-value'] || 'card-value')} ${styles[(styles['positive'] || 'positive')] || (styles['positive'] || 'positive')}`}>LKR {formatCurrency(statistics.totalRevenue || statistics.totalStudentPayments)}</p>
                    <p className={styles['card-label'] || 'card-label'}>Student Payments + Extra Income</p>
                  </div>
                </div>

                <div className={`${styles[(styles['income-card'] || 'income-card')] || (styles['income-card'] || 'income-card')} ${styles[(styles['expense'] || 'expense')] || (styles['expense'] || 'expense')}`}>
                  <div className={styles['card-icon'] || 'card-icon'}>
                    <img src={expensesIcon} alt="Expenses" />
                  </div>
                  <div className={styles['card-content'] || 'card-content'}>
                    <h3>Total Expenses</h3>
                    <p className={`${styles[(styles['card-value'] || 'card-value')] || (styles['card-value'] || 'card-value')} ${styles[(styles['negative'] || 'negative')] || (styles['negative'] || 'negative')}`}>LKR {formatCurrency(statistics.totalExpenses)}</p>
                    <p className={styles['card-label'] || 'card-label'}>{statistics.expenseCount} expense{statistics.expenseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className={`${styles[(styles['income-card'] || 'income-card')] || (styles['income-card'] || 'income-card')} ${styles[(styles['salary'] || 'salary')] || (styles['salary'] || 'salary')}`}>
                  <div className={styles['card-icon'] || 'card-icon'}>
                    <img src={employeeSalaryIcon} alt="Employee Salary" />
                  </div>
                  <div className={styles['card-content'] || 'card-content'}>
                    <h3>Total Employee Salary</h3>
                    <p className={`${styles[(styles['card-value'] || 'card-value')] || (styles['card-value'] || 'card-value')} ${styles[(styles['negative'] || 'negative')] || (styles['negative'] || 'negative')}`}>LKR {formatCurrency(statistics.totalSalary)}</p>
                    <p className={styles['card-label'] || 'card-label'}>{statistics.salaryCount} employee{statistics.salaryCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className={`${styles[(styles['income-card'] || 'income-card')] || (styles['income-card'] || 'income-card')} ${styles[(styles['net'] || 'net')] || (styles['net'] || 'net')}`}>
                  <div className={styles['card-icon'] || 'card-icon'}>
                    <img src={netIncomeIcon} alt="Net Income" />
                  </div>
                  <div className={styles['card-content'] || 'card-content'}>
                    <h3>Net Income</h3>
                    <p className={`${styles['card-value'] || 'card-value'} ${statistics.netIncome >= 0 ? (styles['positive'] || 'positive') : (styles['negative'] || 'negative')}`}>
                      LKR {formatCurrency(statistics.netIncome)}
                    </p>
                    <p className={styles['card-label'] || 'card-label'}>Revenue - Expenses - Salary</p>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className={styles['income-breakdown'] || 'income-breakdown'}>
                <h2>Income Calculation</h2>
                <div className={styles['breakdown-card'] || 'breakdown-card'}>
                  <div className={styles['breakdown-row'] || 'breakdown-row'}>
                    <span className={styles['breakdown-label'] || 'breakdown-label'}>Total Student Payments:</span>
                    <span className={`${styles[(styles['breakdown-value'] || 'breakdown-value')] || (styles['breakdown-value'] || 'breakdown-value')} ${styles[(styles['positive'] || 'positive')] || (styles['positive'] || 'positive')}`}>+ LKR {formatCurrency(statistics.totalStudentPayments)}</span>
                  </div>
                  {statistics.totalExtraIncome > 0 && (
                    <div className={styles['breakdown-row'] || 'breakdown-row'}>
                      <span className={styles['breakdown-label'] || 'breakdown-label'}>Total Extra Income:</span>
                      <span className={`${styles[(styles['breakdown-value'] || 'breakdown-value')] || (styles['breakdown-value'] || 'breakdown-value')} ${styles[(styles['positive'] || 'positive')] || (styles['positive'] || 'positive')}`}>+ LKR {formatCurrency(statistics.totalExtraIncome || 0)}</span>
                    </div>
                  )}
                  <div className={styles['breakdown-row'] || 'breakdown-row'}>
                    <span className={styles['breakdown-label'] || 'breakdown-label'}>Total Expenses:</span>
                    <span className={`${styles[(styles['breakdown-value'] || 'breakdown-value')] || (styles['breakdown-value'] || 'breakdown-value')} ${styles[(styles['negative'] || 'negative')] || (styles['negative'] || 'negative')}`}>- LKR {formatCurrency(statistics.totalExpenses)}</span>
                  </div>
                  <div className={styles['breakdown-row'] || 'breakdown-row'}>
                    <span className={styles['breakdown-label'] || 'breakdown-label'}>Total Employee Salary:</span>
                    <span className={`${styles[(styles['breakdown-value'] || 'breakdown-value')] || (styles['breakdown-value'] || 'breakdown-value')} ${styles[(styles['negative'] || 'negative')] || (styles['negative'] || 'negative')}`}>- LKR {formatCurrency(statistics.totalSalary)}</span>
                  </div>
                  <div className={styles['breakdown-divider'] || 'breakdown-divider'}></div>
                  <div className={`${styles[(styles['breakdown-row'] || 'breakdown-row')] || (styles['breakdown-row'] || 'breakdown-row')} ${styles[(styles['total'] || 'total')] || (styles['total'] || 'total')}`}>
                    <span className={styles['breakdown-label'] || 'breakdown-label'}>Net Income:</span>
                    <span className={`${styles['breakdown-value'] || 'breakdown-value'} ${statistics.netIncome >= 0 ? (styles['positive'] || 'positive') : (styles['negative'] || 'negative')}`}>
                      LKR {formatCurrency(statistics.netIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extra Income Breakdown */}
              {statistics.extraIncomeDetails && statistics.extraIncomeDetails.length > 0 && (
                <div className={`${styles[(styles['expense-breakdown'] || 'expense-breakdown')] || (styles['expense-breakdown'] || 'expense-breakdown')} ${styles[(styles['extra-income-breakdown'] || 'extra-income-breakdown')] || (styles['extra-income-breakdown'] || 'extra-income-breakdown')}`}>
                  <h2>Extra Income Breakdown</h2>
                  <div className={styles['expense-list'] || 'expense-list'}>
                    {statistics.extraIncomeDetails.map((extra, index) => (
                      <div key={index} className={`${styles[(styles['expense-item'] || 'expense-item')] || (styles['expense-item'] || 'expense-item')} ${styles[(styles['extra-income-item'] || 'extra-income-item')] || (styles['extra-income-item'] || 'extra-income-item')}`}>
                        <div>
                          <span className={styles['expense-type'] || 'expense-type'}>{extra.title}</span>
                          <span className={styles['expense-date'] || 'expense-date'}>{extra.month} {extra.year}</span>
                        </div>
                        <span className={`${styles[(styles['expense-amount'] || 'expense-amount')] || (styles['expense-amount'] || 'expense-amount')} ${styles[(styles['extra-income-amount'] || 'extra-income-amount')] || (styles['extra-income-amount'] || 'extra-income-amount')}`}>LKR {formatCurrency(extra.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Breakdown by Type */}
              {statistics.expenseDetails && statistics.expenseDetails.length > 0 && (
                <div className={styles['expense-breakdown'] || 'expense-breakdown'}>
                  <h2>Expense Breakdown by Type</h2>
                  <div className={styles['expense-list'] || 'expense-list'}>
                    {statistics.expenseDetails.map((expense, index) => (
                      <div key={index} className={styles['expense-item'] || 'expense-item'}>
                        <span className={styles['expense-type'] || 'expense-type'}>{expense.type}</span>
                        <span className={styles['expense-amount'] || 'expense-amount'}>LKR {formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finance Summary Table */}
              <div className={styles['finance-summary'] || 'finance-summary'}>
                <h2>Finance Summary Details</h2>
                {filteredSummaryRows.length === 0 ? (
                  <div className={`${styles[(styles['empty-state'] || 'empty-state')] || (styles['empty-state'] || 'empty-state')} ${styles[(styles['compact'] || 'compact')] || (styles['compact'] || 'compact')}`}>
                    <p>No summary entries match your search.</p>
                  </div>
                ) : (
                  <div className={styles['finance-summary-table-wrapper'] || 'finance-summary-table-wrapper'}>
                    <table className={styles['finance-summary-table'] || 'finance-summary-table'}>
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Amount (LKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSummaryRows.map((row) => (
                          <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>LKR {formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomePage;

