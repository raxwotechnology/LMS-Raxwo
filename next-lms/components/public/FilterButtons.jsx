'use client';

import React from 'react';
import styles from './FilterButtons.module.css';

const FilterButtons = ({ categories = [], activeCategory = "All Courses", onFilterChange }) => {
  return (
    <div className={styles['filter-buttons']}>
      {categories.map((category, index) => (
        <button
          key={index}
          className={`${styles['filter-btn']} ${category === activeCategory ? styles['active'] : ''}`}
          onClick={() => onFilterChange && onFilterChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;
