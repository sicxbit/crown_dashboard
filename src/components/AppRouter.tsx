import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './auth/Login';
import Dashboard from './dashboard/Dashboard';

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

export default AppRouter;