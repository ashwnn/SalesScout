import React, { createContext, useState, useEffect } from 'react';
import api from '@/utils/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Load user details on initial render or token change
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        api.setAuthToken(token);
        try {
          const res = await api.get('/api/users/profile');
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error loading user', err);
          localStorage.removeItem('token');
          api.setAuthToken(null);
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/users/login', { username, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      api.setAuthToken(newToken);
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await api.post('/api/users/register', { username, email, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      api.setAuthToken(newToken);
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const res = await api.put('/api/users/profile', userData);
      setUser(res.data.user);
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;