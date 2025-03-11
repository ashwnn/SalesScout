import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import DealContext from '@/context/DealContext';
import '@/styles/query.css';

const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { getQuery, currentQuery, updateQuery, deleteQuery, loading: queryLoading } = useContext(QueryContext);
  const { deals, loading: dealsLoading } = useContext(DealContext);
  
  // Use component state to track if a deletion or update is in progress
  const [isProcessing, setIsProcessing] = useState(false);

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
      console.error('Error updating query status:', error);
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
        console.error('Error deleting query:', error);
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
        <h1>{currentQuery.name}</h1>
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
            {isProcessing ? 'Processing...' : 'Delete'}
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
          <h3>Webhook</h3>
          <p className="webhook-url">{currentQuery.webhookUrl}</p>
        </div>
        
        <div className="detail-section">
          <h3>Schedule</h3>
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
      
      <div className="matching-deals-section">
        <h2>Matching Deals</h2>
        {dealsLoading ? (
          <div className="loading-indicator">Loading deals...</div>
        ) : matchingDeals.length === 0 ? (
          <p className="empty-message">No matching deals found.</p>
        ) : (
          <div className="deals-list">
            {matchingDeals.map(deal => (
              <div key={deal.id} className="deal-item">
                <h3 className="deal-title">
                  <a href={deal.url} target="_blank" rel="noopener noreferrer">
                    {deal.title}
                  </a>
                </h3>
                <div className="deal-meta">
                  <span className="deal-date">{new Date(deal.created).toLocaleString()}</span>
                  <div className="deal-stats">
                    <span className="votes">{deal.votes} votes</span>
                    <span className="views">{deal.views} views</span>
                    <span className="comments">{deal.comments} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="page-actions">
        <Link to="/queries" className="btn btn-secondary">
          Back to All Queries
        </Link>
      </div>
    </div>
  );
};

export default QueryDetail;