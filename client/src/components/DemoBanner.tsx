import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';

const DemoBanner: React.FC = () => {
  const { user } = useContext(AuthContext);

  if (!user?.isDemo) {
    return null;
  }

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
