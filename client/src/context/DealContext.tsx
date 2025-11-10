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
  const isFetching = useRef(false);

  // Memoized getDeals function to prevent unnecessary re-renders
  const getDeals = useCallback(async () => {
    if (isFetching.current) return; // Prevent concurrent requests
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.get('/deals');
      
      // Check if we have a valid response
      if (res && res.data) {
        // The API returns { success, page, count, deals }
        const dealsData = res.data.deals || res.data;
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching deals');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []); // Remove loading from dependencies

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

  const scrapeFreshDeals = useCallback(async () => {
    if (isFetching.current) return; // Prevent concurrent requests
    
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.get('/deals/scrape');
      
      // Check if the response is valid
      if (res && res.data) {
        // The scrape endpoint returns { success, message, count, deals }
        const dealsData = res.data.deals || res.data.data || res.data;
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setError(null);
        
        // Refresh the full deal list after scraping
        await getDeals();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error scraping fresh deals');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [getDeals]);

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