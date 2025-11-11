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
      let errorMessage = 'Error fetching queries. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
      let errorMessage = 'Error fetching query details. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Query not found. It may have been deleted.';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'You do not have permission to view this query.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
      let errorMessage = 'Error creating query. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Invalid query data. Please check your input and try again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to create queries.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
      let errorMessage = 'Error updating query. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Invalid query data. Please check your input and try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Query not found. It may have been deleted.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to update this query.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
      let errorMessage = 'Error deleting query. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Query not found. It may have already been deleted.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this query.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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