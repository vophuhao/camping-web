import React from 'react';
import '../style/PostSkeleton.css';

const PostSkeleton: React.FC = () => (
  <div className="post-skeleton-ui">
    <div className="post-skeleton-image shimmer" />
    <div className="post-skeleton-content">
      <div className="post-skeleton-avatar shimmer" />
      <div className="post-skeleton-lines">
        <div className="post-skeleton-line shimmer" />
        <div className="post-skeleton-line shimmer" />
      </div>
      <div className="post-skeleton-badge shimmer" />
    </div>
    <div className="post-skeleton-title shimmer" />
    <div className="post-skeleton-summary shimmer" />
    <div className="post-skeleton-footer">
      <div className="post-skeleton-footer-btn shimmer" />
      <div className="post-skeleton-footer-btn shimmer" />
      <div className="post-skeleton-footer-btn shimmer" />
      <div className="post-skeleton-footer-btn shimmer" />
    </div>
  </div>
);

export default PostSkeleton; 