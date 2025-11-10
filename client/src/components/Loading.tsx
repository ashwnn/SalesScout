import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      Loading...
    </div>
  );
};

export const SkeletonStat: React.FC = () => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      Loading...
    </div>
  );
};

export const SkeletonDeal: React.FC = () => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      Loading...
    </div>
  );
};

export const SkeletonQuery: React.FC = () => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      Loading...
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};
