import React from 'react';
import { Navigate } from 'react-router-dom';
import { isStoredAdminValid, clearAdminAuth } from '../utils/authStorage';

const ProtectedRoute = ({ children }) => {
  const isValid = isStoredAdminValid();

  if (!isValid) {
    clearAdminAuth();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
