import React, { useContext, useEffect, useState, useCallback } from 'react';
import DealContext from '@/context/DealContext';
import AuthContext from '@/context/AuthContext';
import { trackDeal, trackInteraction, trackButton, trackDemoMode } from '@/utils/umami';
import '@/styles/deals.css';

const DealsPage: React.FC = () => {
  const { deals, filteredDeals, loading, error, getDeals, scrapeFreshDeals, filterDeals } = useContext(DealContext);
  const { user } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get unique categories from deals
  const categories = deals.length > 0 
    ? ['all', ...new Set(deals.filter(deal => deal.category).map(deal => deal.category!))]
    : ['all'];

  // Calculate freshness indicator
  const getFreshnessIndicator = (createdDate: Date) => {
    const now = new Date();
    const created = new Date(createdDate);
    const ageInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;
    
    let status: 'fresh' | 'recent' | 'aging' | 'stale';
    let color: string;
    let label: string;
    
    if (ageInHours < 24) {
      // Less than 1 day - Fresh (bright green)
      status = 'fresh';
      color = '#22c55e'; // green-500
      label = 'Fresh';
    } else if (ageInDays < 3) {
      // 1-3 days - Recent (light green)
      status = 'recent';
      color = '#84cc16'; // lime-500
      label = 'Recent';
    } else if (ageInDays < 7) {
      // 3-7 days - Aging (yellow-green)
      status = 'aging';
      color = '#eab308'; // yellow-500
      label = 'Aging';
    } else {
      // Over 7 days - Stale (yellow/orange)
      status = 'stale';
      color = '#f59e0b'; // amber-500
      label = 'Stale';
    }
    
    return { status, color, label, ageInDays: Math.floor(ageInDays) };
  };

  // Format relative time
  const getRelativeTime = (createdDate: Date) => {
    const now = new Date();
    const created = new Date(createdDate);
    const ageInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;
    
    if (ageInHours < 1) {
      return 'Less than 1 hr ago';
    } else if (ageInHours < 24) {
      const hours = Math.floor(ageInHours);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (ageInDays < 30) {
      const days = Math.floor(ageInDays);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return '30+ days ago';
    }
  };

  // Only fetch deals once when the component mounts
  useEffect(() => {
    getDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the filter function to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    filterDeals(
      searchTerm, 
      selectedCategory === 'all' ? undefined : selectedCategory
    );
    
    // Track filter application
    if (searchTerm || selectedCategory !== 'all') {
      trackDeal('filtered', {
        searchTerm: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    }
  }, [searchTerm, selectedCategory, filterDeals]);

  // Apply filters whenever filter criteria change, but not on every render
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    trackInteraction('button-click', { button: 'refresh-deals' });
    trackButton('refresh-deals', {
      sessionType: user?.isDemo ? 'demo' : 'regular',
      from: 'deals-page'
    });
    if (user?.isDemo) {
      trackDemoMode('refresh-deals');
    }
    try {
      await scrapeFreshDeals();
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    trackDeal('searched', { searchTerm });
    trackButton('search-deals', {
      sessionType: user?.isDemo ? 'demo' : 'regular',
      searchTerm
    });
    if (user?.isDemo) {
      trackDemoMode('search-deals', { searchTerm });
    }
    applyFilters();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    trackInteraction('button-click', { button: 'reset-filters' });
    trackButton('reset-filters', {
      sessionType: user?.isDemo ? 'demo' : 'regular'
    });
    if (user?.isDemo) {
      trackDemoMode('reset-filters');
    }
    // Don't call filterDeals directly here
    // It will be called by the useEffect when state changes
  };

  // Sort deals based on sortBy value
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      case 'oldest':
        return new Date(a.created).getTime() - new Date(b.created).getTime();
      case 'most_votes':
        return b.votes - a.votes;
      case 'most_views':
        return b.views - a.views;
      case 'most_comments':
        return b.comments - a.comments;
      default:
        return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
  });

  return (
    <div className="deals-page">
      {/* Rest of component remains the same */}
      <div className="page-header">
        <h1>Browse Deals</h1>
        <button 
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Deals'}
        </button>
      </div>
      
      <div className="filters-section">
        <form className="filters-form" onSubmit={handleSearch}>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
          </div>
          
          <div className="filter-row">
            <div className="category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  trackButton('filter-category', {
                    sessionType: user?.isDemo ? 'demo' : 'regular',
                    category: e.target.value
                  });
                  if (user?.isDemo) {
                    trackDemoMode('filter-category', { category: e.target.value });
                  }
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-filter">
              <select 
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value);
                  trackDeal('sorted', { sortBy: e.target.value });
                  trackButton('sort-deals', {
                    sessionType: user?.isDemo ? 'demo' : 'regular',
                    sortBy: e.target.value
                  });
                  if (user?.isDemo) {
                    trackDemoMode('sort-deals', { sortBy: e.target.value });
                  }
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_votes">Most Votes</option>
                <option value="most_views">Most Views</option>
                <option value="most_comments">Most Comments</option>
              </select>
            </div>
            
            <button type="button" className="reset-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Loading deals...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : sortedDeals.length === 0 ? (
        <div className="empty-state">
          <p>No deals found. Try adjusting your filters or refresh to get the latest deals.</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Refresh Deals
          </button>
        </div>
      ) : (
        <div className="deals-container">
          <div className="deals-count">
            Showing {sortedDeals.length} deals {searchTerm && `containing "${searchTerm}"`}
          </div>
          
          <div className="deals-list">
            {sortedDeals.map(deal => {
              const freshness = getFreshnessIndicator(deal.created);
              const relativeTime = getRelativeTime(deal.created);
              return (
                <div key={deal.id} className="deal-card">
                  <div className="deal-header">
                    <h3 className="deal-title">
                      <a 
                        href={deal.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => trackDeal('clicked', { 
                          dealTitle: deal.title, 
                          category: deal.category,
                          url: deal.url 
                        })}
                      >
                        {deal.title}
                      </a>
                    </h3>
                    
                  <div className="deal-date">{relativeTime}</div>
                  </div>
                  
                  <div className="deal-meta">
                    <div className="deal-meta-left">
                      {deal.category && (
                        <span className="deal-category">{deal.category}</span>
                      )}
                    </div>
                    <div className="deal-meta-right">
                      <span 
                        className={`freshness-indicator ${freshness.status}`}
                        style={{ backgroundColor: freshness.color }}
                        title={`${freshness.label} - ${freshness.ageInDays} day${freshness.ageInDays !== 1 ? 's' : ''} old`}
                      >
                        {freshness.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="deal-stats">
                    <span className="stat votes">
                      <strong>{deal.votes}</strong> votes
                    </span>
                    <span className="stat-separator">-</span>
                    <span className="stat views">
                      <strong>{deal.views}</strong> views
                    </span>
                    <span className="stat-separator">-</span>
                    <span className="stat comments">
                      <strong>{deal.comments}</strong> comments
                    </span>
                  </div>
                  
                  <a 
                    href={deal.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="deal-link btn btn-primary"
                    onClick={() => trackDeal('external-link', { 
                      dealTitle: deal.title, 
                      category: deal.category 
                    })}
                  >
                    View Deal
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;