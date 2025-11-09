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
              {recentDeals.map(deal => {
                const freshness = getFreshnessIndicator(deal.created);
                return (
                  <li key={deal.id} className="recent-deal-item">
                    <div className="deal-title">
                      <a href={deal.url} target="_blank" rel="noopener noreferrer">
                        {deal.title}
                      </a>
                      <span 
                        className={`freshness-indicator ${freshness.status}`}
                        style={{ backgroundColor: freshness.color }}
                        title={`${freshness.label} - ${freshness.ageInDays} day${freshness.ageInDays !== 1 ? 's' : ''} old`}
                      >
                        {freshness.label}
                      </span>
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
                );
              })}
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
