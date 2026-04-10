/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ForumPost } from '../../../types/forum';
import { FiHeart, FiBookmark, FiMessageCircle, FiEye } from 'react-icons/fi';
import { FaHeart, FaBookmark } from 'react-icons/fa';
import { useRouter } from "next/navigation";
import { formatViewCount, formatLikeCount, formatCommentCount } from '../../../utils/formatUtils';
import '../style/ForumPostItem.css';

interface ForumPostItemProps {
  post: ForumPost;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
}

const ForumPostItem: React.FC<ForumPostItemProps> = ({ post, onLike, onBookmark }) => {
  const router = useRouter();
  const author = post.author;
  const avatarUrl = author?.avatarUrl || '/default-avatar.png';
  const authorName = author?.name || 'User';

  // Helper: lấy tên chủ đề tiếng Việt
  const getCategoryName = (cat?: string) => {
    switch (cat) {
      case 'math': return 'Toán học';
      case 'programming': return 'Lập trình';
      case 'economics': return 'Kinh tế';
      default: return cat || 'Chủ đề khác';
    }
  };

  // Helper: render badge
  const renderBadge = () => {
    if (!post.badge) return null;
    
    const badgeLabels: Record<string, string> = {
      'new': 'Mới',
      'hot': 'Nổi bật',
      'ai': 'AI',
      'featured': 'Chọn lọc',
      'meme': 'Meme',
      'quote': 'Quote'
    };
    
    return (
      <span className={`post-badge badge-${post.badge}`}>
        {badgeLabels[post.badge] || post.badge.toUpperCase()}
      </span>
    );
  };
  

  return (
    <article
      className="post-card"
      onClick={() => router.push(`/forum/${post.slug || post.id}`)}
    >
      {post.subject && (
        <span className={`post-subject-pill post-subject-corner ${post.subject}`}>{getCategoryName(post.subject)}</span>
      )}
      <div className="post-top">
        <img src={avatarUrl} alt={authorName} className="post-avatar" width={32} height={32} />
        <div className="post-author">
          <span className="post-author-name">{authorName}</span>
          <span className="post-date">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
        {/* <div className="post-meta">
          {(post.tags && post.tags.length > 0) && post.tags.map((tag, idx) => (
            <span className="post-tag-pill" key={tag.id || tag.name || idx}>{tag.name}</span>
          ))}
          {renderBadge()}
        </div> */}
      </div>
      <div className="post-title-row">
        <h2 className="post-title post-title-clamp">{post.title}</h2>
        {renderBadge()}
      </div>
      {post.imageUrl && (
        <div className="post-image-ui">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="post-image"
            loading="lazy"
            width={320}
            height={180}
          />
        </div>
      )}
      {/* <div>
        {post.summary}
      </div> */}
      <div className="post-footer">
        <div className="post-footer-left">
          <button
            className={`post-action${post.isLiked ? ' liked' : ''}`}
            onClick={e => {
              e.stopPropagation();
              if (onLike) onLike(post.id);
            }}
          >
            {post.isLiked ? <FaHeart /> : <FiHeart />} {formatLikeCount(post.likeCount)}
          </button>
          <button
            className={`post-action${post.isBookmarked ? ' bookmarked' : ''}`}
            onClick={e => {
              e.stopPropagation();
              if (onBookmark) onBookmark(post.id);
            }}
          >
            {post.isBookmarked ? <FaBookmark /> : <FiBookmark />} {(post as any).saveCount}
          </button>
          <span className="post-action">
            <FiMessageCircle /> {formatCommentCount(post.commentCount)}
          </span>
        </div>
        <div className="post-footer-right">
          <span className="post-view-count">
            <FiEye style={{marginRight: 3, verticalAlign: 'middle'}} /> {formatViewCount(post.viewCount || 0)}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ForumPostItem; 