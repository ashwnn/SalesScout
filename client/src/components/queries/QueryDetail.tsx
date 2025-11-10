import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import DealContext from '@/context/DealContext';
import '@/styles/query.css';
import '@/styles/deals.css';

const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { getQuery, currentQuery, updateQuery, deleteQuery, loading: queryLoading } = useContext(QueryContext);
  const { deals, loading: dealsLoading } = useContext(DealContext);
  
  // Use component state to track if a deletion or update is in progress
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper functions for deal cards
  const getFreshnessIndicator = (createdDate: Date) => {
    const now = new Date();
    const created = new Date(createdDate);
    const ageInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;
    
    let status: 'fresh' | 'recent' | 'aging' | 'stale';
    let color: string;
    let label: string;
    
    if (ageInHours < 24) {
      status = 'fresh';
      color = '#22c55e';
      label = 'Fresh';
    } else if (ageInDays < 3) {
      status = 'recent';
      color = '#84cc16';
      label = 'Recent';
    } else if (ageInDays < 7) {
      status = 'aging';
      color = '#eab308';
      label = 'Aging';
    } else {
      status = 'stale';
      color = '#f59e0b';
      label = 'Stale';
    }
    
    return { status, color, label, ageInDays: Math.floor(ageInDays) };
  };

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

  useEffect(() => {
    if (id) {
      getQuery(id);
    }
  }, [id, getQuery]);

  // Use useMemo to efficiently compute matching deals only when dependencies change
  const matchingDeals = useMemo(() => {
    if (!currentQuery || deals.length === 0) return [];
    
    // Start with all deals
    let filtered = [...deals];
    
    // Filter by keywords - use predefined regexes for better performance
    if (currentQuery.keywords && currentQuery.keywords.length > 0) {
      const keywordRegexes = currentQuery.keywords.map(
        keyword => new RegExp(keyword, 'i')
      );
      
      filtered = filtered.filter(deal => 
        keywordRegexes.some(regex => 
          regex.test(deal.title) || 
          (deal.description && regex.test(deal.description))
        )
      );
    }
    
    // Filter by categories - check if deal has a category that matches any of the query categories
    if (currentQuery.categories && currentQuery.categories.length > 0) {
      filtered = filtered.filter(deal => 
        deal.category && currentQuery.categories?.includes(deal.category)
      );
    }
    
    return filtered;
  }, [currentQuery, deals]);

  const toggleActiveStatus = async () => {
    if (!currentQuery || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await updateQuery(id!, {
        isActive: !currentQuery.isActive
      });
    } catch (error) {
      // Error is handled by context
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (isProcessing) return;
    
    if (window.confirm('Are you sure you want to delete this query?')) {
      setIsProcessing(true);
      try {
        await deleteQuery(id!);
        navigate('/queries');
      } catch (error) {
        // Error is handled by context
        setIsProcessing(false);
      }
    }
  };

  if (queryLoading) {
    return <div className="loading-indicator">Loading query details...</div>;
  }

  if (!currentQuery) {
    return <div className="error-message">Query not found</div>;
  }

  return (
    <div className="query-detail-page">
      <div className="page-header">
        <div>
          <h1>{currentQuery.name}</h1>
        </div>
        <div className="header-actions">
          <Link to={`/queries/${id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button 
            onClick={toggleActiveStatus} 
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : currentQuery.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button 
            onClick={handleDelete} 
            className="btn btn-danger"
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      <div className="query-meta">
        <span className={`status-badge ${currentQuery.isActive ? 'active' : 'inactive'}`}>
          {currentQuery.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="interval">
          Checks every {currentQuery.intervalMinutes} minutes
        </span>
      </div>
      
      <div className="query-details">
        <div className="detail-section">
          <h3>Keywords</h3>
          <div className="tags">
            {currentQuery.keywords.map((keyword, index) => (
              <span key={index} className="tag">{keyword}</span>
            ))}
          </div>
        </div>
        
        {currentQuery.categories && currentQuery.categories.length > 0 && (
          <div className="detail-section">
            <h3>Categories</h3>
            <div className="tags">
              {currentQuery.categories.map((category, index) => (
                <span key={index} className="tag">{category}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="detail-section">
          <h3>Webhook URL</h3>
          <p className="webhook-url">{currentQuery.webhookUrl}</p>
        </div>
        
        <div className="detail-section">
          <h3>Schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <p>
              <strong>Next run:</strong> {new Date(currentQuery.nextRun).toLocaleString()}
            </p>
            {currentQuery.lastRun && (
              <p>
                <strong>Last run:</strong> {new Date(currentQuery.lastRun).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="matching-deals-section">
        <h2>Matching Deals ({matchingDeals.length})</h2>
        {dealsLoading ? (
          <div className="loading-indicator">Loading deals...</div>
        ) : matchingDeals.length === 0 ? (
          <p className="empty-message">No matching deals found yet.</p>
        ) : (
          <div className="deals-list">
            {matchingDeals.map(deal => {
              const freshness = getFreshnessIndicator(deal.created);
              const relativeTime = getRelativeTime(deal.created);
              return (
                <div key={deal.id} className="deal-card">
                  <div className="deal-header">
                    <h3 className="deal-title">
                      <a href={deal.url} target="_blank" rel="noopener noreferrer">
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
                  >
                    View Deal
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="page-actions">
        <Link to="/queries" className="btn btn-secondary">
          ← Back to All Queries
        </Link>
      </div>
    </div>
  );
};

export default QueryDetail;