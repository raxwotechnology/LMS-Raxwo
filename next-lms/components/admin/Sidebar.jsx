'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const allNavItems = [
    { name: "Dashboard", icon: "/assets/dashboard.png", path: "/admin/Dashboard" },
    { name: "Employee", icon: "/assets/employee.png", path: "/admin/employee" },
    { name: "Students", icon: "/assets/students.png", path: "/admin/students" },
    { name: "Subjects", icon: "/assets/subjects.png", path: "/admin/subjects" },
    { name: "Payment", icon: "/assets/payment.png", path: "/admin/payment" },
    { name: "Class", icon: "/assets/class.png", path: "/admin/class" },
    { name: "Expenses", icon: "/assets/expenses.png", path: "/admin/expenses" },
    { name: "Salary", icon: "/assets/salary.png", path: "/admin/salary" },
    { name: "Extra Income", icon: "/assets/extraincome.png", path: "/admin/extra-income" },
    { name: "Finance", icon: "/assets/income.png", path: "/admin/income" },
    { name: "Marks", icon: "/assets/marks.png", path: "/admin/marks" },
    { name: "Exam", icon: "/assets/exam.png", path: "/admin/exam" },
  ];

  const [userType, setUserType] = useState('admin');
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const type = localStorage.getItem('userType') || 'admin';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserType(type);
      setUserPermissions(user.permissions || {});
    }
  }, []);

  const navItems = allNavItems.filter(item => {
    if (userType === 'admin') return true;
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
  }, [pathname]);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    router.push(item.path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      document.cookie = 'lms_auth_token=; Max-Age=0; path=/;';
    }
    router.push('/admin/login');
    setIsMobileOpen(false);
  };

  return (
    <>
      <aside className={`${styles['sidebar']} ${isMobileOpen ? styles['sidebar--open'] : ''}`}>
        <div className={styles['sidebar-logo']}>
          <img src="/assets/logo.png" alt="Wisdom Institute Logo" className={styles['logo-image']} />
          <span className={styles['logo-text']}>WISDOM INSTITUTE</span>
        </div>

        <nav className={styles['sidebar-nav']}>
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={`${styles['nav-item']} ${pathname === item.path ? styles['active'] : ''}`}
            >
              <img src={item.icon} alt={item.name} className={styles['nav-icon']} />
              <span className={styles['nav-label']}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className={styles['sidebar-footer']}>
          <button className={styles['logout-btn']} onClick={handleLogout}>
            <img src="/assets/logout.png" alt="Logout" className={styles['logout-icon']} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {isMobileOpen && <div className={styles['sidebar-overlay']} onClick={() => setIsMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;
