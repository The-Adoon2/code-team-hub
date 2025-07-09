
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database - in a real app this would be in a backend
const mockUsers: Record<string, User> = {
  '10101': { code: '10101', name: 'Permanent Admin', role: 'Team Captain', isAdmin: true },
  '12345': { code: '12345', name: 'John Smith', role: 'Programmer', isAdmin: false },
  '54321': { code: '54321', name: 'Sarah Johnson', role: 'Designer', isAdmin: false },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('frc-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (code: string): boolean => {
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      return false;
    }

    const foundUser = mockUsers[code];
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('frc-user', JSON.stringify(foundUser));
      return true;
    }

    // Create new user for valid codes not in database
    const newUser: User = {
      code,
      name: `User ${code}`,
      role: 'Team Member',
      isAdmin: false
    };
    
    mockUsers[code] = newUser;
    setUser(newUser);
    localStorage.setItem('frc-user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('frc-user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
