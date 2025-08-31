import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryContext';
import { TeamProvider } from './contexts/TeamContext';
import AppRouter from './components/AppRouter';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <TeamProvider>
          <AppRouter />
        </TeamProvider>
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;