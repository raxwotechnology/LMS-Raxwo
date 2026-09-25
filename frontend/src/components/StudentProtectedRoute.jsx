import React from 'react';
import { Navigate } from 'react-router-dom';

const StudentProtectedRoute = ({ children }) => {
  const student = localStorage.getItem('studentUser');
  const token = localStorage.getItem('studentToken');

  if (!student || !token) {
    // Redirect to student login if not authenticated
    return <Navigate to="/student/login" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
