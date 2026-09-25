import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const userStr = localStorage.getItem('user');

  let isAuthenticated = false;
  if (token && token !== 'undefined' && token !== 'null' && userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed._id || parsed.role || parsed.type || parsed.email)) {
        isAuthenticated = true;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    // Clear any broken/expired tokens
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
