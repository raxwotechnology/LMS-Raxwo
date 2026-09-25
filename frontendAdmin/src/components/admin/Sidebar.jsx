import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useSettings } from '../../context/SettingsContext';
import { getImageUrl } from '../../utils/imageUtils';
import dashboardIcon from '../../assets/dashboard.png';
import employeeIcon from '../../assets/employee.png';
import studentsIcon from '../../assets/students.png';
import subjectsIcon from '../../assets/subjects.png';
import classIcon from '../../assets/class.png';
import expensesIcon from '../../assets/expenses.png';
import salaryIcon from '../../assets/salary.png';
import incomeIcon from '../../assets/income.png';
import extraIncomeIcon from '../../assets/extraincome.png';
import marksIcon from '../../assets/marks.png';
import examIcon from '../../assets/exam.png';
import paymentIcon from '../../assets/payment.png';
import activityIcon from '../../assets/time.png';
import logoutIcon from '../../assets/logout.png';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { instituteName, logoUrl } = useSettings();
  // Re-read the logged-in user from localStorage whenever the profile page updates it
  const [profileVersion, setProfileVersion] = useState(0);
  
  const allNavItems = [
    { name: "Dashboard", icon: dashboardIcon, path: "/admin/Dashboard" },
    { name: "Employee", icon: employeeIcon, path: "/admin/employee" },
    { name: "Students", icon: studentsIcon, path: "/admin/students" },
    { name: "Subjects", icon: subjectsIcon, path: "/admin/subjects" },
    { name: "Payment", icon: paymentIcon, path: "/admin/payment" },
    { name: "Student Activities", icon: activityIcon, path: "/admin/student-activities" },
    { name: "Class", icon: classIcon, path: "/admin/class" },
    { name: "Expenses", icon: expensesIcon, path: "/admin/expenses" },
    { name: "Salary", icon: salaryIcon, path: "/admin/salary" },
    { name: "Extra Income", icon: extraIncomeIcon, path: "/admin/extra-income" },
    { name: "Finance", icon: incomeIcon, path: "/admin/income" },
    { name: "Marks", icon: marksIcon, path: "/admin/marks" },
    { name: "Exam", icon: examIcon, path: "/admin/exam" },
    { name: "Exam Papers", icon: examIcon, path: "/admin/exam-papers" },
  ];

  // Get user type and permissions (re-read fresh on every render; profileVersion
  // forces a re-render whenever the profile page saves changes)
  void profileVersion;
  const userType = localStorage.getItem('userType');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = user.permissions || {};

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => {
    // Admin can see all items
    if (userType === 'admin') {
      return true;
    }
    // Employee can see items they have permission for
    if (item.name === 'Student Activities') {
      return userPermissions['Student Activities'] === true || userPermissions['Students'] === true || userPermissions['Payment'] === true;
    }
    return userPermissions[item.name] === true;
  });

  useEffect(() => {
    const toggleHandler = () => setIsMobileOpen((prev) => !prev);
    const closeHandler = () => setIsMobileOpen(false);
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileOpen(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('toggle-sidebar', toggleHandler);
    document.addEventListener('close-sidebar', closeHandler);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('toggle-sidebar', toggleHandler);
      document.removeEventListener('close-sidebar', closeHandler);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleProfileUpdated = () => setProfileVersion((v) => v + 1);
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    navigate(item.path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
    setIsMobileOpen(false);
  };

  return (
    <>
      <aside className={`sidebar ${isMobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-circle">
            <img src={logoUrl} alt={`${instituteName} Logo`} className="logo-image" />
          </div>
          <div className="logo-text-group">
            <span className="logo-text">{instituteName}</span>
            <span className="logo-subtitle">Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <img src={item.icon} alt={item.name} className="nav-icon" />
              <span className="nav-label">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile" onClick={() => navigate('/admin/profile')} style={{ cursor: 'pointer' }}>
            {user.profileImage ? (
              <img src={getImageUrl(user.profileImage)} alt="Profile" className="sidebar-profile-avatar sidebar-profile-avatar-img" />
            ) : (
              <div className="sidebar-profile-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user.name || 'Admin'}</span>
              <span className="sidebar-profile-role">{userType === 'admin' ? 'Administrator' : 'Staff'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <img src={logoutIcon} alt="Logout" className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;