import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '@/utils/api';
import AuthContext from './AuthContext';

interface Query {
  _id: string;
  name: string;
  keywords: string[];
  categories?: string[];
  intervalMinutes: number;
  webhookUrl: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

interface QueryContextType {
  queries: Query[];
  loading: boolean;
  error: string | null;
  currentQuery: Query | null;
  getQueries: () => Promise<void>;
  getQuery: (id: string) => Promise<void>;
  createQuery: (queryData: Partial<Query>) => Promise<void>;
  updateQuery: (id: string, queryData: Partial<Query>) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  clearCurrentQuery: () => void;
}

const QueryContext = createContext<QueryContextType>({
  queries: [],
  loading: true,
  error: null,
  currentQuery: null,
  getQueries: async () => {},
  getQuery: async () => {},
  createQuery: async () => {},
  updateQuery: async () => {},
  deleteQuery: async () => {},
  clearCurrentQuery: () => {},
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<Query | null>(null);
  
  const { isAuthenticated } = useContext(AuthContext);
  const initialLoadDone = useRef(false);
  const isFetching = useRef(false);

  // Memoize the getQueries function to prevent unnecessary re-renders
  const getQueries = useCallback(async () => {
    if (isFetching.current) return; // Prevent multiple simultaneous requests
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.get('/queries');
      
      if (res.data && res.data.data) {
        setQueries(res.data.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []); // Remove loading from dependencies

  // Memoize the getQuery function to prevent unnecessary re-renders
  const getQuery = useCallback(async (id: string) => {
    if (isFetching.current) return; // Prevent multiple simultaneous requests
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.get(`/queries/${id}`);
      
      if (res.data && res.data.data) {
        setCurrentQuery(res.data.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching query details');
      console.error('Error fetching query details:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []); // Remove loading from dependencies

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      getQueries();
    } else if (!isAuthenticated) {
      setQueries([]);
      setCurrentQuery(null);
      initialLoadDone.current = false;
    }
  }, [isAuthenticated, getQueries]);

  // Memoized CRUD functions
  const createQuery = useCallback(async (queryData: Partial<Query>) => {
    if (isFetching.current) return Promise.reject('Operation in progress');
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.post('/queries', queryData);
      
      if (res.data && res.data.data) {
        setQueries(prevQueries => [...prevQueries, res.data.data]);
        setCurrentQuery(res.data.data);
        setError(null);
      }
      
      return Promise.resolve();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error creating query';
      setError(errorMessage);
      console.error('Error creating query:', err);
      return Promise.reject(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const updateQuery = useCallback(async (id: string, queryData: Partial<Query>) => {
    if (isFetching.current) return Promise.reject('Operation in progress');
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.put(`/queries/${id}`, queryData);
      
      if (res.data && res.data.data) {
        setQueries(prevQueries => 
          prevQueries.map(query => query._id === id ? res.data.data : query)
        );
        setCurrentQuery(res.data.data);
        setError(null);
      }
      
      return Promise.resolve();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error updating query';
      setError(errorMessage);
      console.error('Error updating query:', err);
      return Promise.reject(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const deleteQuery = useCallback(async (id: string) => {
    if (isFetching.current) return Promise.reject('Operation in progress');
    
    try {
      isFetching.current = true;
      setLoading(true);
      await api.delete(`/queries/${id}`);
      
      setQueries(prevQueries => prevQueries.filter(query => query._id !== id));
      
      setCurrentQuery(prev => (prev && prev._id === id) ? null : prev);
      
      setError(null);
      return Promise.resolve();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error deleting query';
      setError(errorMessage);
      console.error('Error deleting query:', err);
      return Promise.reject(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const clearCurrentQuery = useCallback(() => {
    setCurrentQuery(null);
  }, []);

  // Create a stable context value to prevent unnecessary re-renders
  const value = {
    queries,
    loading,
    error,
    currentQuery,
    getQueries,
    getQuery,
    createQuery,
    updateQuery,
    deleteQuery,
    clearCurrentQuery,
  };

  return (
    <QueryContext.Provider value={value}>
      {children}
    </QueryContext.Provider>
  );
};

export default QueryContext;