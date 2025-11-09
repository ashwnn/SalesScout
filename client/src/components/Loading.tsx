import React from 'react';
import '@/styles/skeleton.css';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
    </div>
  );
};

export const SkeletonStat: React.FC = () => {
  return (
    <div className="skeleton-stat">
      <div className="skeleton skeleton-label"></div>
      <div className="skeleton skeleton-value"></div>
      <div className="skeleton skeleton-link"></div>
    </div>
  );
};

export const SkeletonDeal: React.FC = () => {
  return (
    <div className="skeleton-deal">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-meta"></div>
    </div>
  );
};

export const SkeletonQuery: React.FC = () => {
  return (
    <div className="skeleton-query">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-footer"></div>
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="page-loader">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};
