import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import { trackDemoMode, trackButton } from '@/utils/umami';

const DemoBanner: React.FC = () => {
  const { user } = useContext(AuthContext);

  // Track demo banner view
  useEffect(() => {
    if (user?.isDemo) {
      trackDemoMode('banner-shown', { username: user.username });
    }
  }, [user]);

  if (!user?.isDemo) {
    return null;
  }

  const handleCreateAccountClick = () => {
    trackDemoMode('create-account-click', { 
      source: 'demo-banner',
      username: user.username 
    });
    trackButton('demo-banner-create-account', {
      sessionType: 'demo'
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
      borderBottom: '1px solid #f59e0b',
      padding: '0.75rem 1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#92400e'
    }}>
      <span style={{ marginRight: '0.5rem' }}>⚠️</span>
      You are using a <strong>demo account</strong>. Changes cannot be saved.{' '}
      <Link 
        to="/register" 
        onClick={handleCreateAccountClick}
        style={{ 
          color: '#b45309', 
          textDecoration: 'underline',
          fontWeight: '600'
        }}
      >
        Create your own account
      </Link>
      {' '}to use all features.
    </div>
  );
};

export default DemoBanner;
