'use client';

import React from 'react';
import { getImageUrlWithFallback } from '@/utils/imageUtils';
import styles from './CourseCard.module.css';

const CourseCard = ({ 
  course = {
    id: 1,
    name: "Course Title",
    title: "Course Title",
    description: "Course description goes here...",
    image: "/placeholder-course.jpg",
    teacher: "Teacher Name",
    featured: false
  }
}) => {
  const courseTitle = course.name || course.title;
  const courseImage =
    course.image ||
    course.imageUrl ||
    course.thumbnail ||
    (course.media && course.media.url);
  
  return (
    <div className={styles['course-card']}>
      <div className={styles['course-image-container']}>
        <img 
          src={getImageUrlWithFallback(courseImage, "https://via.placeholder.com/300x200?text=Course+Image")}
          alt={courseTitle} 
          className={styles['course-image']} 
        />
      </div>

      <div className={styles['course-content']}>
        <h3 className={styles['course-title']}>{courseTitle}</h3>
        {(course.teacher || course.conductedBy) && (
          <p className={styles['course-teacher']}>
            <span className={styles['teacher-label']}>Conducted by:</span>
            <span className={styles['teacher-name']}>{course.teacher || course.conductedBy?.name || course.conductedBy}</span>
          </p>
        )}
        <p className={styles['course-description']}>{course.description}</p>
      </div>
    </div>
  );
};

export default CourseCard;
