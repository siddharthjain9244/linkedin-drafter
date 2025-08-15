import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, auth } from './authService';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

// The main App component handles user authentication state and routing.
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l1-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Redirect root to appropriate page */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        
        {/* Auth routes - only accessible when not logged in */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <SignupPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - only accessible when logged in */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user} requireAuth={true}>
              <DashboardPage user={user} />
            </ProtectedRoute>
          } 
        />
        
        {/* Logout route - immediately logs out and redirects */}
        <Route 
          path="/logout" 
          element={<LogoutRoute />} 
        />
        
        {/* Catch all route - redirect to appropriate page */}
        <Route 
          path="*" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
};

// Component to handle logout route
const LogoutRoute = () => {
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout error:", error);
      }
    };
    
    handleLogout();
  }, []);

  return <Navigate to="/login" replace />;
};

export default App;
