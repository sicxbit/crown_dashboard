import React, { createContext, useContext, useState, useEffect } from 'react';

import { useTeam } from './TeamContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demo
const mockUsers: User[] = [
  { id: '1', name: 'Jemond White', email: 'admin@yourdomain.com', role: 'admin' },
  { id: '2', name: 'Natasha White', email: 'manager@yourdomain.com', role: 'manager' },
  { id: '3', name: 'Bob Agent', email: 'agent@yourdomain.com', role: 'agent' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { members } = useTeam(); // ✅ destructured
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('crmUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const foundUser = members?.find(u => u.email === email);
    if (foundUser && password.length > 0) {
      setUser(foundUser);
      localStorage.setItem('crmUser', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crmUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
