import React, { useContext, useEffect, useState, useCallback } from 'react';
import DealContext from '@/context/DealContext';
import '@/styles/deals.css';

const DealsPage: React.FC = () => {
  const { deals, filteredDeals, loading, error, getDeals, scrapeFreshDeals, filterDeals } = useContext(DealContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get unique categories from deals
  const categories = deals.length > 0 
    ? ['all', ...new Set(deals.filter(deal => deal.category).map(deal => deal.category!))]
    : ['all'];

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
  }, [searchTerm, selectedCategory, filterDeals]);

  // Apply filters whenever filter criteria change, but not on every render
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await scrapeFreshDeals();
    } catch (err) {
      console.error('Error scraping fresh deals:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
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
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-filter">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
            {sortedDeals.map(deal => (
              <div key={deal.id} className="deal-card">
                <h3 className="deal-title">
                  <a href={deal.url} target="_blank" rel="noopener noreferrer">
                    {deal.title}
                  </a>
                </h3>
                
                <div className="deal-meta">
                  <div className="deal-date">
                    Posted {new Date(deal.created).toLocaleDateString()}
                  </div>
                  
                  {deal.category && (
                    <div className="deal-category">{deal.category}</div>
                  )}
                </div>
                
                <div className="deal-stats">
                  <span className="stat votes">
                    <i className="icon-thumbs-up"></i> {deal.votes} votes
                  </span>
                  <span className="stat views">
                    <i className="icon-eye"></i> {deal.views} views
                  </span>
                  <span className="stat comments">
                    <i className="icon-comment"></i> {deal.comments} comments
                  </span>
                </div>
                
                <a 
                  href={deal.url}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="deal-link"
                >
                  View Deal
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;