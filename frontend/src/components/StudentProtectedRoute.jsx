import React from 'react';
import { Navigate } from 'react-router-dom';

const StudentProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('studentToken');
  const userStr = localStorage.getItem('studentUser');

  let isAuthenticated = false;
  if (token && token !== 'undefined' && token !== 'null' && userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed._id || parsed.studentId || parsed.email)) {
        isAuthenticated = true;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    return <Navigate to="/student/login" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
