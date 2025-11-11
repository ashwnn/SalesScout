import React, { createContext, useState, useEffect } from 'react';
import api from '@/utils/api';
import { trackSession } from '@/utils/umami';

interface User {
  id: string;
  username: string;
  email: string;
  isDemo?: boolean;
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
          const res = await api.get('/users/profile');
          setUser(res.data.user);
          setIsAuthenticated(true);
          
          // Track session type when user loads
          trackSession(
            res.data.user.isDemo ? 'demo' : 'regular',
            { 
              username: res.data.user.username,
              source: 'token-load'
            }
          );
        } catch (err) {
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
      const res = await api.post('/users/login', { username, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      api.setAuthToken(newToken);
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Track session type on login
      trackSession(
        userData.isDemo ? 'demo' : 'regular',
        { 
          username: userData.username,
          source: 'login',
          isDemo: userData.isDemo || false
        }
      );
    } catch (err) {
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await api.post('/users/register', { username, email, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      api.setAuthToken(newToken);
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Track session type on registration
      trackSession(
        'regular',
        { 
          username: userData.username,
          source: 'register'
        }
      );
    } catch (err) {
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
      const res = await api.put('/users/profile', userData);
      setUser(res.data.user);
    } catch (err) {
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