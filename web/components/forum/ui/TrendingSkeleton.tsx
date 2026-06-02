import React from 'react';
import '../style/TrendingSkeleton.css';

const TrendingSkeleton: React.FC = () => (
  <div className="trending-skeleton-ui">
    <div className="trending-skeleton-header shimmer" />
    <div className="trending-skeleton-list">
      {[...Array(3)].map((_, i) => (
        <div className="trending-skeleton-item shimmer" key={i} />
      ))}
    </div>
    <div className="trending-skeleton-tag-header shimmer" />
    <div className="trending-skeleton-tag-list">
      {[...Array(5)].map((_, i) => (
        <div className="trending-skeleton-tag shimmer" key={i} />
      ))}
    </div>
  </div>
);

export default TrendingSkeleton; 