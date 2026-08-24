import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  prototypeLogin: (email: string, role: UserRole, fullName?: string) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy persistent storage so the login page opens first
  useEffect(() => {
    localStorage.removeItem('mplads_auth_token');
    localStorage.removeItem('mplads_auth_user');
    localStorage.removeItem('mplads_auth_role');
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('mplads_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState<UserRole>(() => {
    return (sessionStorage.getItem('mplads_auth_role') as UserRole) || 'INVESTIGATOR';
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('mplads_auth_token');
  });

  const saveAuthSession = (authData: AuthResponse) => {
    const newUser: User = {
      id: authData.user_id,
      email: authData.email,
      full_name: authData.full_name,
      role: authData.role,
      is_active: true,
    };
    setUser(newUser);
    setRole(authData.role);
    setToken(authData.access_token);
    sessionStorage.setItem('mplads_auth_token', authData.access_token);
    sessionStorage.setItem('mplads_auth_user', JSON.stringify(newUser));
    sessionStorage.setItem('mplads_auth_role', authData.role);
  };

  const login = async (email: string, password: string = '') => {
    const res = await api.login(email, password);
    saveAuthSession(res);
  };

  const prototypeLogin = async (email: string, targetRole: UserRole, fullName?: string) => {
    const res = await api.prototypeLogin(email, targetRole, fullName);
    saveAuthSession(res);
  };

  const handleDemoLogin = async (targetRole: UserRole) => {
    const res = await api.demoLogin(targetRole);
    saveAuthSession(res);
  };

  const logout = () => {
    setUser(null);
    setRole('INVESTIGATOR');
    setToken(null);
    sessionStorage.removeItem('mplads_auth_token');
    sessionStorage.removeItem('mplads_auth_user');
    sessionStorage.removeItem('mplads_auth_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token && !!user,
        login,
        prototypeLogin,
        demoLogin: handleDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
