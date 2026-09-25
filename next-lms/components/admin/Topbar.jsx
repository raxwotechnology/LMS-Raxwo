'use client';

import React from 'react';
import styles from './Topbar.module.css';

const Topbar = ({ userName }) => {
  const handleToggleSidebar = () => {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new Event('toggle-sidebar'));
    }
  };

  return (
    <div className={styles['topbar']}>
      <button
        type="button"
        className={styles['hamburger-btn']}
        onClick={handleToggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <span />
        <span />
        <span />
      </button>
      <div className={styles['topbar-right']}>
        <button className={styles['icon-btn']}>
          <img src="/assets/bell.png" alt="Notifications" className={styles['bell-icon']} />
        </button>
        <span className={styles['greeting']}>Welcome {(!userName || userName === 'Admin') ? 'Wisdom Admin' : userName}</span>
      </div>
    </div>
  );
};

export default Topbar;
