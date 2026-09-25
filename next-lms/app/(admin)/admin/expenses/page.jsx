'use client';
import styles from './page.module.css';

const safeLocalStorage = {
  getItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.getItem(key) : null),
  setItem: (key, val) => (typeof window !== 'undefined' ? window.safeLocalStorage.setItem(key, val) : undefined),
  removeItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.removeItem(key) : undefined),
};

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';

const API_BASE = `/api/expenses`;

const monthOptions = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

const defaultForm = { year: '', month: '', type: '', price: '' };

const ExpensesPage = () => {
  const [bills, setBills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [customType, setCustomType] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = safeLocalStorage.getItem('adminToken');
    (async () => {
      try {
        const res = await fetch(API_BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setBills(data.data);
      } catch (_) {}
    })();
  }, []);

  const total = useMemo(() => bills.reduce((sum, b) => sum + Number(b.price || 0), 0), [bills]);

  const filteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return bills;
    }
    return bills.filter((bill) =>
      [bill.year, bill.month, bill.type, bill.price]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [bills, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredBills.length) {
      alert('No expenses available to generate a report.');
      return;
    }

    const headers = ['Year', 'Month', 'Type', 'Price (LKR)'];
    const rows = filteredBills.map((bill) => [
      bill.year || '',
      bill.month || '',
      bill.type || '',
      bill.price !== undefined && bill.price !== null ? bill.price : 0
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear custom type when switching away from "Other"
    if (name === 'type' && value !== 'Other') {
      setCustomType('');
    }
    setError('');
  };

  const handleCustomTypeChange = (e) => {
    setCustomType(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { year, month, type, price } = formData;
    
    // Validate fields
    if (!year || !month || !type || !price) {
      setError('Please fill all fields.');
      return;
    }
    
    // If type is "Other", require custom type
    if (type === 'Other' && !customType.trim()) {
      setError('Please enter a custom bill type.');
      return;
    }
    
    // Use custom type if "Other" is selected, otherwise use the selected type
    const finalType = type === 'Other' ? customType.trim() : type;
    
    const token = safeLocalStorage.getItem('adminToken');
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ year, month, type: finalType, price })
        });
        const data = await res.json();
        if (data.success) {
          setBills(bills.map(b => b._id === editingId ? data.data : b));
        }
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ year, month, type: finalType, price })
        });
        const data = await res.json();
        if (data.success) setBills([data.data, ...bills]);
      }
    } catch (_) {}
    setFormData(defaultForm);
    setCustomType('');
    setEditingId('');
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    const token = safeLocalStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBills(bills.filter((b) => b._id !== id));
    } catch (_) {}
  };

  const handleEdit = (bill) => {
    // Check if the bill type is one of the predefined types
    const predefinedTypes = ['Water', 'Electricity', 'Internet', 'Maintenance', 'Other'];
    const isPredefinedType = predefinedTypes.includes(bill.type);
    
    // If it's not a predefined type, treat it as "Other" with custom type
    if (!isPredefinedType) {
      setFormData({ year: bill.year, month: bill.month, type: 'Other', price: String(bill.price) });
      setCustomType(bill.type);
    } else {
      setFormData({ year: bill.year, month: bill.month, type: bill.type, price: String(bill.price) });
      setCustomType('');
    }
    setEditingId(bill._id);
    setShowForm(true);
    setError('');
  };

  return (
    <div className={styles['expenses-page'] || 'expenses-page'}>
      <Sidebar />
      <div className={styles['expenses-main-content'] || 'expenses-main-content'}>
        <Topbar userName="Wisdom Admin" />

        <div className={styles['expenses-content'] || 'expenses-content'}>
          <div className={styles['expenses-header'] || 'expenses-header'}>
            <h1>Expenses</h1>
            <div className={styles['expenses-header-actions'] || 'expenses-header-actions'}>
              <div className={styles['expenses-search'] || 'expenses-search'}>
                <input
                  type="text"
                  placeholder="Search by year, month, type, or amount"
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
                className={styles['report-btn'] || 'report-btn'}
                onClick={handleGenerateReport}
                disabled={filteredBills.length === 0}
              >
                Generate Report
              </button>
              <button className={styles['add-expense-btn'] || 'add-expense-btn'} onClick={() => { setShowForm(!showForm); setFormData(defaultForm); setCustomType(''); setEditingId(''); setError(''); }}>
                {showForm ? 'Cancel' : editingId ? 'Edit Bill' : '+ Add Bill'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className={styles['expense-form-container'] || 'expense-form-container'}>
              <form className={styles['expense-form'] || 'expense-form'} onSubmit={handleSubmit}>
                {error && <div className={styles['error-message'] || 'error-message'}>{error}</div>}

                <div className={styles['form-row'] || 'form-row'}>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="year">Year</label>
                    <input
                      id="year"
                      name="year"
                      type="number"
                      placeholder="e.g. 2025"
                      value={formData.year}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="month">Month</label>
                    <select
                      id="month"
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select month</option>
                      {monthOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['form-row'] || 'form-row'}>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="type">Type of bill</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select type</option>
                      <option value="Water">Water</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Internet">Internet</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="price">Price (LKR)</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="e.g. 4500"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {formData.type === 'Other' && (
                  <div className={styles['form-row'] || 'form-row'}>
                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="customType">Enter bill type *</label>
                      <input
                        id="customType"
                        name="customType"
                        type="text"
                        placeholder="e.g. Phone, Rent, Supplies, etc."
                        value={customType}
                        onChange={handleCustomTypeChange}
                        required
                      />
                    </div>
                    <div className={styles['form-group'] || 'form-group'}>
                      {/* Empty div to maintain layout */}
                    </div>
                  </div>
                )}

                <div className={styles['form-actions'] || 'form-actions'}>
                  <button type="button" className={styles['cancel-btn'] || 'cancel-btn'} onClick={() => { setShowForm(false); setFormData(defaultForm); setCustomType(''); setEditingId(''); setError(''); }}>Cancel</button>
                  <button type="submit" className={styles['submit-btn'] || 'submit-btn'}>{editingId ? 'Update Bill' : 'Add Bill'}</button>
                </div>
              </form>
            </div>
          )}

          <div className={styles['expenses-table-container'] || 'expenses-table-container'}>
            {bills.length === 0 ? (
              <div className={styles['empty-state'] || 'empty-state'}>
                <p>No bills added yet. Click "+ Add Bill" to create one.</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className={styles['empty-state'] || 'empty-state'}>
                <p>No expenses match your search.</p>
              </div>
            ) : (
              <table className={styles['expenses-table'] || 'expenses-table'}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Month</th>
                    <th>Type</th>
                    <th>Price (LKR)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b._id}>
                      <td>{b.year}</td>
                      <td>{b.month}</td>
                      <td>{b.type}</td>
                      <td>{b.price.toLocaleString()}</td>
                      <td>
                        <button className={styles['edit-btn'] || 'edit-btn'} onClick={() => handleEdit(b)}>Edit</button>
                        <button className={styles['delete-btn'] || 'delete-btn'} onClick={() => handleDelete(b._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={styles['total-row'] || 'total-row'}>
                    <td colSpan="3">Total</td>
                    <td>{total.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;


