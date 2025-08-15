import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, requireAuth = true }) => {
  if (requireAuth && !user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  if (!requireAuth && user) {
    // User is authenticated but trying to access auth pages, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
