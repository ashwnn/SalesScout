import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import QueryContext from '@/context/QueryContext';
import DealContext from '@/context/DealContext';
import '@/styles/dashboard.css'

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { queries, loading: queriesLoading, getQueries } = useContext(QueryContext);
  const { deals, loading: dealsLoading, getDeals } = useContext(DealContext);

  useEffect(() => {
    // Only fetch if we don't have data yet
    // The contexts already handle initial loading when authenticated
    if (queries.length === 0 && !queriesLoading) {
      getQueries();
    }
    if (deals.length === 0 && !dealsLoading) {
      getDeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const activeQueries = queries.filter(query => query.isActive).length;
  
  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p>Here's what's happening with your sales scout</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Active Queries</h3>
          <div className="stat-value">{activeQueries}</div>
          <Link to="/queries" className="stat-link">View All Queries</Link>
        </div>
        
        <div className="stat-card">
          <h3>Total Deals</h3>
          <div className="stat-value">{deals.length}</div>
          <Link to="/deals" className="stat-link">View All Deals</Link>
        </div>
      </div>
      
      <div className="dashboard-recent">
        <div className="recent-section">
          <h2>Recent Deals</h2>
          {dealsLoading ? (
            <div className="loading-indicator">Loading deals...</div>
          ) : recentDeals.length > 0 ? (
            <ul className="recent-deals-list">
              {recentDeals.map(deal => (
                <li key={deal.id} className="recent-deal-item">
                  <div className="deal-title">
                    <a href={deal.url} target="_blank" rel="noopener noreferrer">
                      {deal.title}
                    </a>
                  </div>
                  <div className="deal-meta">
                    <span className="deal-date">
                      {new Date(deal.created).toLocaleDateString()}
                    </span>
                    <span className="deal-stats">
                      <span className="votes">{deal.votes} votes</span>
                      <span className="views">{deal.views} views</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No deals found. <Link to="/deals">Scrape for deals</Link></p>
          )}
          <Link to="/deals" className="view-all-link">View All Deals</Link>
        </div>
        
        <div className="recent-section">
          <h2>Your Queries</h2>
          {queriesLoading ? (
            <div className="loading-indicator">Loading queries...</div>
          ) : queries.length > 0 ? (
            <ul className="recent-queries-list">
              {queries.slice(0, 5).map(query => (
                <li key={query.id} className="query-item">
                  <Link to={`/queries/${query.id}`} className="query-link">
                    <span className="query-name">{query.name}</span>
                    <span className={`query-status ${query.isActive ? 'active' : 'inactive'}`}>
                      {query.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Link>
                  <div className="query-next-run">
                    Next run: {new Date(query.nextRun).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No queries created. <Link to="/queries/new">Create your first query</Link></p>
          )}
          <Link to="/queries" className="view-all-link">Manage Queries</Link>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <Link to="/queries/new" className="btn btn-primary">
          Create New Query
        </Link>
        <Link to="/deals" className="btn btn-secondary">
          Browse Deals
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
