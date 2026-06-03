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
    if (!cat) return 'Chủ đề khác';
    const names: Record<string, string> = {
      'camping-experience': 'Kinh nghiệm cắm trại',
      'camping-gear': 'Đồ dùng dã ngoại',
      'beautiful-places': 'Địa điểm đẹp',
      'outdoor-cuisine': 'Ẩm thực ngoài trời',
      'trip-sharing': 'Chia sẻ hành trình',
      'qna-support': 'Hỏi đáp & Hỗ trợ',
      'other': 'Khác',
      'kinh nghiệm cắm trại': 'Kinh nghiệm cắm trại',
      'đồ dùng dã ngoại': 'Đồ dùng dã ngoại',
      'địa điểm đẹp': 'Địa điểm đẹp',
      'ẩm thực ngoài trời': 'Ẩm thực ngoài trời',
      'chia sẻ hành trình': 'Chia sẻ hành trình',
      'hỏi đáp & hỗ trợ': 'Hỏi đáp & Hỗ trợ',
      'khác': 'Khác'
    };
    return names[cat.toLowerCase()] || cat;
  };

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

    const bgColors: Record<string, string> = {
      'new': 'bg-emerald-500 text-white',
      'hot': 'bg-rose-500 text-white',
      'ai': 'bg-indigo-500 text-white',
      'featured': 'bg-amber-500 text-white',
    };

    const badgeClass = bgColors[post.badge] || 'bg-gray-500 text-white';

    return (
      <span className={`shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs ${badgeClass}`}>
        {badgeLabels[post.badge] || post.badge.toUpperCase()}
      </span>
    );
  };

  return (
    <article
      tabIndex={0}
      role="link"
      aria-label={`Bài viết: ${post.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/forum/${post.slug || post.id}`);
        }
      }}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative min-h-[220px] h-full hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-primary/20 outline-hidden"
      onClick={() => router.push(`/forum/${post.slug || post.id}`)}
    >
      {post.subject ? (
        <span className="absolute top-4 right-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-xs uppercase tracking-wider">
          {getCategoryName(post.subject)}
        </span>
      ) : null}
      
      <div>
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={avatarUrl} 
            alt={authorName} 
            className="h-10 w-10 rounded-full object-cover border-2 border-primary/20 bg-muted" 
            width={40} 
            height={40} 
          />
          <div className="flex flex-col min-w-0 pr-24">
            <span className="font-bold text-foreground hover:text-primary transition-colors text-sm truncate">
              {authorName}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-3">
          <h2 className="text-base font-bold text-foreground line-clamp-2 leading-snug flex-1 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {renderBadge()}
        </div>

        {post.imageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted mb-4">
            <img
              src={post.imageUrl}
              alt={post.title}
              width={640}
              height={360}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-103"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <button
            className={`flex items-center gap-1.5 font-semibold transition-colors hover:text-rose-500 ${
              post.isLiked ? 'text-rose-500' : ''
            }`}
            onClick={e => {
              e.stopPropagation();
              if (onLike) onLike(post.id);
            }}
          >
            {post.isLiked ? <FaHeart className="text-rose-500" /> : <FiHeart />}
            <span>{formatLikeCount(post.likeCount)}</span>
          </button>
          
          <button
            className={`flex items-center gap-1.5 font-semibold transition-colors hover:text-amber-500 ${
              post.isBookmarked ? 'text-amber-500' : ''
            }`}
            onClick={e => {
              e.stopPropagation();
              if (onBookmark) onBookmark(post.id);
            }}
          >
            {post.isBookmarked ? <FaBookmark className="text-amber-500" /> : <FiBookmark />}
            <span>{(post as any).saveCount}</span>
          </button>

          <span className="flex items-center gap-1.5 font-semibold">
            <FiMessageCircle />
            <span>{formatCommentCount(post.commentCount)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <FiEye className="h-3.5 w-3.5" />
          <span>{formatViewCount(post.viewCount || 0)}</span>
        </div>
      </div>
    </article>
  );
};

export default ForumPostItem; 