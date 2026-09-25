'use client';
import styles from './page.module.css';

const safeLocalStorage = {
  getItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.getItem(key) : null),
  setItem: (key, val) => (typeof window !== 'undefined' ? window.safeLocalStorage.setItem(key, val) : undefined),
  removeItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.removeItem(key) : undefined),
};

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    basicSalary: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    basicSalary: ''
  });
  const [newRole, setNewRole] = useState('');
  const [showNewRoleInput, setShowNewRoleInput] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showEditRoleDropdown, setShowEditRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedEmployeeForPermission, setSelectedEmployeeForPermission] = useState(null);
  const [permissions, setPermissions] = useState({
    Dashboard: false,
    Employee: false,
    Students: false,
    Subjects: false,
    Payment: false,
    Class: false,
    Expenses: false,
    Salary: false,
    'Extra Income': false,
    Finance: false,
    Marks: false,
    Exam: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  const token = safeLocalStorage.getItem('adminToken');

  // Fetch employees and roles
  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select-wrapper')) {
        setShowRoleDropdown(false);
      }
      if (!event.target.closest('.custom-select-wrapper-edit')) {
        setShowEditRoleDropdown(false);
      }
    };

    if (showRoleDropdown || showEditRoleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleDropdown, showEditRoleDropdown]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/admin/employees/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetched roles data:', data);
      if (data.success) {
        console.log('Setting roles to:', data.data);
        setRoles(data.data);
        return data.data; // Return the roles array
      }
      return [];
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAddNewRole = async () => {
    if (!newRole.trim()) return;

    const roleToAdd = newRole.trim();

    try {
      const response = await fetch(`/api/admin/employees/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: roleToAdd })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Role created successfully:', data);
        
        // Set the role immediately with the name we just created
        setFormData(prev => ({ ...prev, role: roleToAdd }));
        
        // Refresh the roles list to get the updated list with the new role
        await fetchRoles();
        
        setNewRole('');
        setShowNewRoleInput(false);
        setShowRoleDropdown(false);
        setError('');
      } else {
        setError(data.message || 'Failed to create role');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/employees/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchRoles();
        if (formData.role === roleName) {
          setFormData({ ...formData, role: '' });
        }
        setShowRoleDropdown(false);
      } else {
        alert(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchEmployees();
        setFormData({ name: '', email: '', password: '', role: '', basicSalary: '' });
        setShowForm(false);
      } else {
        setError(data.message || 'Failed to add employee');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      basicSalary: employee.basicSalary || ''
    });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/employees/${editingEmployee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchEmployees();
        setEditingEmployee(null);
        setEditFormData({ name: '', email: '', password: '', role: '' });
      } else {
        setError(data.message || 'Failed to update employee');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditFormData({ name: '', email: '', password: '', role: '' });
    setShowEditRoleDropdown(false);
  };

  const handlePermission = (employee) => {
    setSelectedEmployeeForPermission(employee);
    setShowPermissionModal(true);
    // Reset permissions or load existing permissions for this employee
    setPermissions({
      Dashboard: employee.permissions?.Dashboard || false,
      Employee: employee.permissions?.Employee || false,
      Students: employee.permissions?.Students || false,
      Subjects: employee.permissions?.Subjects || false,
      Payment: employee.permissions?.Payment || false,
      Class: employee.permissions?.Class || false,
      Expenses: employee.permissions?.Expenses || false,
      Salary: employee.permissions?.Salary || false,
      'Extra Income': employee.permissions?.['Extra Income'] || false,
      Finance: employee.permissions?.Finance || employee.permissions?.Income || false, // Support both for backward compatibility
      Marks: employee.permissions?.Marks || false,
      Exam: employee.permissions?.Exam || false
    });
  };

  const handlePermissionChange = (section) => {
    setPermissions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployeeForPermission) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployeeForPermission._id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Permissions saved successfully!');
        await fetchEmployees(); // Refresh employee list
        setShowPermissionModal(false);
      } else {
        alert(data.message || 'Failed to save permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      alert('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPermission = () => {
    setShowPermissionModal(false);
    setSelectedEmployeeForPermission(null);
    setPermissions({
      Dashboard: false,
      Employee: false,
      Students: false,
      Subjects: false,
      Payment: false,
      Class: false,
      Expenses: false,
      Salary: false,
      'Extra Income': false,
      Finance: false,
      Marks: false,
      Exam: false
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchEmployees();
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return employees;
    }
    return employees.filter((employee) =>
      [employee.name, employee.email, employee.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [employees, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredEmployees.length) {
      alert('No employees available to generate a report.');
      return;
    }

    const headers = ['Name', 'Email', 'Role', 'Basic Salary (LKR)', 'Status'];
    const rows = filteredEmployees.map((employee) => [
      employee.name || '',
      employee.email || '',
      employee.role || '',
      employee.basicSalary !== undefined && employee.basicSalary !== null
        ? employee.basicSalary
        : 0,
      employee.status || 'active'
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
    link.download = `employees-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className={styles['employee-page'] || 'employee-page'}>
      <Sidebar />
      <div className={styles['employee-main-content'] || 'employee-main-content'}>
        <Topbar userName="Wisdom Admin" />
        
        <div className={styles['employee-content'] || 'employee-content'}>
          <div className={styles['employee-header'] || 'employee-header'}>
            <h1>Employees</h1>
            <div className={styles['employee-header-actions'] || 'employee-header-actions'}>
              <div className={styles['employee-search'] || 'employee-search'}>
                <input
                  type="text"
                  placeholder="Search by name, email, or role"
                  value={searchTerm}
                  onChange={handleSearchChange}
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
                disabled={filteredEmployees.length === 0}
              >
                Generate Report
              </button>
              <button 
                className={styles['add-employee-btn'] || 'add-employee-btn'} 
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancel' : '+ Add New Employee'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className={styles['employee-form-container'] || 'employee-form-container'}>
              <form onSubmit={handleSubmit} className={styles['employee-form'] || 'employee-form'}>
                {error && <div className={styles['error-message'] || 'error-message'}>{error}</div>}
                
                <div className={styles['form-row'] || 'form-row'}>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter employee name"
                      required
                    />
                  </div>

                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className={styles['form-row'] || 'form-row'}>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min 6 characters)"
                      required
                      minLength="6"
                    />
                  </div>

                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="basicSalary">Basic Salary (LKR)</label>
                    <input
                      type="number"
                      id="basicSalary"
                      name="basicSalary"
                      value={formData.basicSalary}
                      onChange={handleInputChange}
                      placeholder="Enter basic salary"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles['form-row'] || 'form-row'}>
                  <div className={styles['form-group'] || 'form-group'}>
                    <label htmlFor="role">Role</label>
                    <div className={styles['role-input-group'] || 'role-input-group'}>
                      <div className={styles['custom-select-wrapper'] || 'custom-select-wrapper'}>
                        <input
                          type="text"
                          id="role"
                          name="role"
                          value={formData.role}
                          placeholder="Select a role"
                          readOnly
                          onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                          style={{
                            flex: 1,
                            padding: '0.875rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            background: 'white'
                          }}
                          required
                        />
                        {showRoleDropdown && (
                          <div className={styles['custom-dropdown'] || 'custom-dropdown'}>
                            {roles.length === 0 ? (
                              <div className={`${styles[(styles['dropdown-item'] || 'dropdown-item')] || (styles['dropdown-item'] || 'dropdown-item')} ${styles[(styles['no-options'] || 'no-options')] || (styles['no-options'] || 'no-options')}`}>No roles available</div>
                            ) : (
                              roles.map((role) => (
                                <div
                                  key={role.id}
                                  className={styles['dropdown-item'] || 'dropdown-item'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, role: role.name });
                                    setShowRoleDropdown(false);
                                  }}
                                >
                                  <span>{role.name}</span>
                                  <button
                                    type="button"
                                    className={styles['role-delete-btn'] || 'role-delete-btn'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRole(role.id, role.name);
                                      if (formData.role === role.name) {
                                        setFormData({ ...formData, role: '' });
                                      }
                                    }}
                                    title="Delete role"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles['add-role-btn'] || 'add-role-btn'}
                        onClick={() => setShowNewRoleInput(!showNewRoleInput)}
                      >
                        + New Role
                      </button>
                    </div>

                    {showNewRoleInput && (
                      <div className={styles['new-role-input'] || 'new-role-input'}>
                        <input
                          type="text"
                          placeholder="Enter new role"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleAddNewRole}
                          className={styles['save-role-btn'] || 'save-role-btn'}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {/* Display all roles with delete option */}
                    {/* <div className={styles['roles-list'] || 'roles-list'}>
                      <label style={{ marginTop: '0.5rem', display: 'block', fontSize: '0.875rem', fontWeight: '500' }}>
                        Manage Roles:
                      </label>
                      {roles.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No roles available</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {roles.map((role) => (
                            <span
                              key={role.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#f3f4f6',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}
                            >
                              {role.name}
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  padding: '0',
                                  marginLeft: '0.25rem',
                                  fontSize: '1rem',
                                  fontWeight: 'bold'
                                }}
                                title="Delete role"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div> */}
                  </div>
                </div>

                <div className={styles['form-actions'] || 'form-actions'}>
                  <button type="submit" className={styles['submit-btn'] || 'submit-btn'} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Employee Modal */}
          {editingEmployee && (
            <div className={styles['modal-overlay'] || 'modal-overlay'}>
              <div className={styles['employee-form-container'] || 'employee-form-container'}>
                <h2>Edit Employee</h2>
                <form onSubmit={handleUpdate} className={styles['employee-form'] || 'employee-form'}>
                  {error && <div className={styles['error-message'] || 'error-message'}>{error}</div>}
                  
                  <div className={styles['form-row'] || 'form-row'}>
                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="edit-name">Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        placeholder="Enter employee name"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles['form-row'] || 'form-row'}>
                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="edit-email">Email</label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles['form-row'] || 'form-row'}>
                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="edit-password">Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        id="edit-password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        placeholder="Enter new password (optional)"
                        minLength="6"
                      />
                    </div>

                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="edit-basicSalary">Basic Salary (LKR)</label>
                      <input
                        type="number"
                        id="edit-basicSalary"
                        name="basicSalary"
                        value={editFormData.basicSalary}
                        onChange={handleEditInputChange}
                        placeholder="Enter basic salary"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles['form-row'] || 'form-row'}>
                    <div className={styles['form-group'] || 'form-group'}>
                      <label htmlFor="edit-role">Role</label>
                      <div className={styles['role-input-group'] || 'role-input-group'}>
                        <div className={styles['custom-select-wrapper-edit'] || 'custom-select-wrapper-edit'}>
                          <input
                            type="text"
                            id="edit-role"
                            name="role"
                            value={editFormData.role}
                            placeholder="Select a role"
                            readOnly
                            onClick={() => setShowEditRoleDropdown(!showEditRoleDropdown)}
                            style={{
                              flex: 1,
                              padding: '0.875rem',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              background: 'white'
                            }}
                            required
                          />
                          {showEditRoleDropdown && (
                            <div className={styles['custom-dropdown'] || 'custom-dropdown'}>
                              {roles.length === 0 ? (
                                <div className={`${styles[(styles['dropdown-item'] || 'dropdown-item')] || (styles['dropdown-item'] || 'dropdown-item')} ${styles[(styles['no-options'] || 'no-options')] || (styles['no-options'] || 'no-options')}`}>No roles available</div>
                              ) : (
                                roles.map((role) => (
                                  <div
                                    key={role.id}
                                    className={styles['dropdown-item'] || 'dropdown-item'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditFormData({ ...editFormData, role: role.name });
                                      setShowEditRoleDropdown(false);
                                    }}
                                  >
                                    <span>{role.name}</span>
                                    <button
                                      type="button"
                                      className={styles['role-delete-btn'] || 'role-delete-btn'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRole(role.id, role.name);
                                        if (editFormData.role === role.name) {
                                          setEditFormData({ ...editFormData, role: '' });
                                        }
                                      }}
                                      title="Delete role"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles['add-role-btn'] || 'add-role-btn'}
                          onClick={() => setShowNewRoleInput(!showNewRoleInput)}
                        >
                          + New Role
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles['form-actions'] || 'form-actions'}>
                    <button type="button" className={styles['cancel-btn'] || 'cancel-btn'} onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button type="submit" className={styles['submit-btn'] || 'submit-btn'} disabled={loading}>
                      {loading ? 'Updating...' : 'Update Employee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Permission Modal */}
          {showPermissionModal && selectedEmployeeForPermission && (
            <div className={styles['modal-overlay'] || 'modal-overlay'}>
              <div className={styles['permission-modal'] || 'permission-modal'}>
                <h2>Manage Permissions</h2>
                <p className={styles['permission-subtitle'] || 'permission-subtitle'}>
                  Employee: <strong>{selectedEmployeeForPermission.name}</strong> ({selectedEmployeeForPermission.email})
                </p>
                
                <div className={styles['permission-list'] || 'permission-list'}>
                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Dashboard}
                        onChange={() => handlePermissionChange('Dashboard')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Dashboard
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Employee}
                        onChange={() => handlePermissionChange('Employee')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Employee
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Students}
                        onChange={() => handlePermissionChange('Students')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Students
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Subjects}
                        onChange={() => handlePermissionChange('Subjects')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Subjects
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Payment}
                        onChange={() => handlePermissionChange('Payment')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Payment
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Class}
                        onChange={() => handlePermissionChange('Class')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Class
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Expenses}
                        onChange={() => handlePermissionChange('Expenses')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Expenses
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Salary}
                        onChange={() => handlePermissionChange('Salary')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Salary
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions['Extra Income']}
                        onChange={() => handlePermissionChange('Extra Income')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Extra Income
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Finance}
                        onChange={() => handlePermissionChange('Finance')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Finance
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Marks}
                        onChange={() => handlePermissionChange('Marks')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Marks
                    </label>
                  </div>

                  <div className={styles['permission-item'] || 'permission-item'}>
                    <label className={styles['permission-checkbox'] || 'permission-checkbox'}>
                      <input
                        type="checkbox"
                        checked={permissions.Exam}
                        onChange={() => handlePermissionChange('Exam')}
                      />
                      <span className={styles['checkmark'] || 'checkmark'}></span>
                      Exam
                    </label>
                  </div>
                </div>

                <div className={styles['permission-actions'] || 'permission-actions'}>
                  <button type="button" className={styles['cancel-btn'] || 'cancel-btn'} onClick={handleCancelPermission}>
                    Cancel
                  </button>
                  <button type="button" className={styles['submit-btn'] || 'submit-btn'} onClick={handleSavePermissions} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={styles['employees-table'] || 'employees-table'}>
            {employees.length === 0 ? (
              <div className={styles['empty-state'] || 'empty-state'}>
                <p>No employees added yet. Click "Add New Employee" to get started.</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className={styles['empty-state'] || 'empty-state'}>
                <p>No employees match your search.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Basic Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td><span className={styles['role-badge'] || 'role-badge'}>{employee.role}</span></td>
                      <td><span className={styles['salary-badge'] || 'salary-badge'}>LKR {employee.basicSalary || 0}</span></td>
                      <td>
                        <button 
                          className={styles['permission-btn'] || 'permission-btn'}
                          onClick={() => handlePermission(employee)}
                        >
                          Permission
                        </button>
                        <button 
                          className={styles['edit-btn'] || 'edit-btn'}
                          onClick={() => handleEdit(employee)}
                        >
                          Edit
                        </button>
                        <button 
                          className={styles['delete-btn'] || 'delete-btn'}
                          onClick={() => handleDelete(employee._id)}
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
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
