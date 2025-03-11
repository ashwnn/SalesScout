import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '@/utils/api';
import AuthContext from './AuthContext';

interface Deal {
  id: string;
  title: string;
  url: string;
  description: string;
  created: Date;
  last_replied: Date;
  comments: number;
  votes: number;
  views: number;
  replies: number;
  category?: string;
}

interface DealContextType {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  getDeals: () => Promise<void>;
  scrapeFreshDeals: () => Promise<void>;
  filterDeals: (searchTerm: string, category?: string) => void;
  filteredDeals: Deal[];
}

const DealContext = createContext<DealContextType>({
  deals: [],
  loading: false,
  error: null,
  getDeals: async () => {},
  scrapeFreshDeals: async () => {},
  filterDeals: () => {},
  filteredDeals: [],
});

export const DealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useContext(AuthContext);
  const initialLoadDone = useRef(false);

  // Memoized getDeals function to prevent unnecessary re-renders
  const getDeals = useCallback(async () => {
    if (loading) return; // Prevent concurrent requests
    
    try {
      setLoading(true);
      const res = await api.get('/api/deals');
      
      // Check if we have a valid response
      if (res && res.data) {
        // The API returns deals directly, not within a data property
        setDeals(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err.response?.data?.message || 'Error fetching deals');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Load deals once when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      getDeals();
    } else if (!isAuthenticated) {
      setDeals([]);
      setFilteredDeals([]);
      initialLoadDone.current = false;
    }
  }, [isAuthenticated, getDeals]);

  // Update filtered deals when deals change
  useEffect(() => {
    setFilteredDeals(deals);
  }, [deals]);

  const scrapeFreshDeals = async () => {
    if (loading) return; // Prevent concurrent requests
    
    try {
      setLoading(true);
      const res = await api.get('/api/deals/scrape');
      
      // Check if the response is valid
      if (res && res.data) {
        // The scrape endpoint might return differently, check both formats
        const dealsData = res.data.data || res.data;
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error scraping fresh deals:', err);
      setError(err.response?.data?.message || 'Error scraping fresh deals');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filterDeals function
  const filterDeals = useCallback((searchTerm: string, category?: string) => {
    let filtered = [...deals];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(term) || 
        (deal.description && deal.description.toLowerCase().includes(term))
      );
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(deal => deal.category === category);
    }
    
    setFilteredDeals(filtered);
  }, [deals]);

  // Create stable context value
  const contextValue = {
    deals,
    loading,
    error,
    getDeals,
    scrapeFreshDeals,
    filterDeals,
    filteredDeals,
  };

  return (
    <DealContext.Provider value={contextValue}>
      {children}
    </DealContext.Provider>
  );
};

export default DealContext;