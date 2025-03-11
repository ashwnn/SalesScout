import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import '@/styles/query.css';

const QueryList: React.FC = () => {
  // Use the context
  const { queries, loading: contextLoading, error: contextError, getQueries, deleteQuery } = useContext(QueryContext);
  
  // Component state
  const [filter, setFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use a ref to track if data has been fetched to prevent repeated fetches
  const dataFetched = useRef(false);

  // Single effect to fetch data once
  useEffect(() => {
    // Only fetch if we haven't already
    if (!dataFetched.current) {
      dataFetched.current = true;
      getQueries().finally(() => {
        setIsLoaded(true);
      });
    }
    
    // Cleanup function
    return () => {
      dataFetched.current = false;
    };
  }, []); // Empty dependency array - run once on mount

  // Handle delete with specific ID tracking
  const handleDelete = async (id: string) => {
    if (isDeleting) return; // Prevent multiple deletes
    
    if (window.confirm('Are you sure you want to delete this query?')) {
      setIsDeleting(id);
      try {
        await deleteQuery(id);
      } catch (error) {
        console.error('Error deleting query:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Filter queries based on selected filter
  const filteredQueries = () => {
    switch(filter) {
      case 'active':
        return queries.filter(query => query.isActive);
      case 'inactive':
        return queries.filter(query => !query.isActive);
      default:
        return queries;
    }
  };
  
  // Calculate counts once
  const activeCount = queries.filter(query => query.isActive).length;
  const inactiveCount = queries.filter(query => !query.isActive).length;

  // Determine what to render based on loading state
  const renderContent = () => {
    // Initial loading state
    if (!isLoaded && contextLoading) {
      return <div className="loading-indicator">Loading queries...</div>;
    }
    
    // Error state
    if (contextError) {
      return <div className="error-message">{contextError}</div>;
    }
    
    // Empty state after loading
    if (filteredQueries().length === 0) {
      return (
        <div className="empty-state">
          <p>
            {filter === 'all' 
              ? 'No queries found. Create your first query to get started!' 
              : `No ${filter} queries found.`}
          </p>
          {filter === 'all' && (
            <Link to="/queries/new" className="btn btn-primary">
              Create New Query
            </Link>
          )}
        </div>
      );
    }
    
    // Content loaded successfully
    return (
      <div className="queries-list">
        {filteredQueries().map(query => (
          <div key={query.id} className="query-card">
            <div className="query-header">
              <h3>
                <Link to={`/queries/${query.id}`}>{query.name}</Link>
              </h3>
              <span className={`status-badge ${query.isActive ? 'active' : 'inactive'}`}>
                {query.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="query-info">
              <div className="info-item">
                <span className="label">Keywords:</span>
                <span className="value">
                  {query.keywords.join(', ')}
                </span>
              </div>
              
              <div className="info-item">
                <span className="label">Check Interval:</span>
                <span className="value">Every {query.intervalMinutes} minutes</span>
              </div>
              
              <div className="info-item">
                <span className="label">Next Run:</span>
                <span className="value">
                  {new Date(query.nextRun).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="query-actions">
              <Link to={`/queries/${query.id}`} className="btn btn-secondary">
                View Details
              </Link>
              <Link to={`/queries/${query.id}/edit`} className="btn btn-secondary">
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(query.id)} 
                className="btn btn-danger"
                disabled={isDeleting === query.id}
              >
                {isDeleting === query.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="queries-page">
      <div className="page-header">
        <h1>Your Queries</h1>
        <Link to="/queries/new" className="btn btn-primary">
          Create New Query
        </Link>
      </div>

      <div className="filter-controls">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({queries.length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </button>
        <button
          className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilter('inactive')}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default QueryList;