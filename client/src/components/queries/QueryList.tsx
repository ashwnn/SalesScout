import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import AuthContext from '@/context/AuthContext';
import { trackButton, trackDemoMode, trackQuery } from '@/utils/umami';
import '@/styles/query.css';

const QueryList: React.FC = () => {
  // Use the context
  const { queries, loading: contextLoading, error: contextError, getQueries, deleteQuery } = useContext(QueryContext);
  const { user } = useContext(AuthContext);
  
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
      trackButton('delete-query', {
        sessionType: user?.isDemo ? 'demo' : 'regular',
        queryId: id
      });
      trackQuery('deleted', id);
      if (user?.isDemo) {
        trackDemoMode('delete-query-attempt', { queryId: id });
      }
      try {
        await deleteQuery(id);
        if (user?.isDemo) {
          trackDemoMode('delete-query-success', { queryId: id });
        }
      } catch (error) {
        // Error is handled by context
        if (user?.isDemo) {
          trackDemoMode('delete-query-failed', { queryId: id });
        }
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
          <div key={query._id} className="query-card">
            <div className="query-header">
              <h3>
                <Link to={`/queries/${query._id}`}>{query.name}</Link>
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
              <Link 
                to={`/queries/${query._id}/edit`} 
                className="btn btn-secondary"
                onClick={() => {
                  trackButton('edit-query', {
                    sessionType: user?.isDemo ? 'demo' : 'regular',
                    queryId: query._id
                  });
                  if (user?.isDemo) {
                    trackDemoMode('edit-query-click', { queryId: query._id });
                  }
                }}
              >
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(query._id)} 
                className="btn btn-danger"
                disabled={isDeleting === query._id}
              >
                {isDeleting === query._id ? 'Deleting...' : 'Delete'}
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
        <Link 
          to="/queries/new" 
          className="btn btn-primary"
          onClick={() => {
            trackButton('create-new-query-header', {
              sessionType: user?.isDemo ? 'demo' : 'regular',
              from: 'query-list'
            });
            if (user?.isDemo) {
              trackDemoMode('create-query-click', { from: 'query-list-header' });
            }
          }}
        >
          Create New Query
        </Link>
      </div>

      <div className="filter-controls">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFilter('all');
            trackButton('filter-queries', {
              sessionType: user?.isDemo ? 'demo' : 'regular',
              filter: 'all'
            });
          }}
        >
          All ({queries.length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => {
            setFilter('active');
            trackButton('filter-queries', {
              sessionType: user?.isDemo ? 'demo' : 'regular',
              filter: 'active'
            });
          }}
        >
          Active ({activeCount})
        </button>
        <button
          className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
          onClick={() => {
            setFilter('inactive');
            trackButton('filter-queries', {
              sessionType: user?.isDemo ? 'demo' : 'regular',
              filter: 'inactive'
            });
          }}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default QueryList;