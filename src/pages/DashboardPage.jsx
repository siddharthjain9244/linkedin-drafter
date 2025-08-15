import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, auth } from '../authService';
import MainApp from '../components/MainApp';

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return <MainApp onLogout={handleLogout} user={user} />;
};

export default DashboardPage;
