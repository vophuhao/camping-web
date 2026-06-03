import React from 'react';
import { ForumPost, ForumTag } from '../../../types/forum';
import Link from "next/link";
import TrendingSkeleton from './TrendingSkeleton'
import '../style/TrendingBlock.css';
import EmptyState from './EmptyState';

interface TrendingBlockProps {
  trending: ForumPost[];
  tags: ForumTag[];
  loading?: boolean;
}

const TrendingBlock: React.FC<TrendingBlockProps> = ({ trending, loading }) => {
  if (loading) return <TrendingSkeleton />;
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
        <span>🔥</span> Đang thịnh hành
      </div>
      <div className="space-y-3">
        {trending && trending.length > 0 ? (
          trending.slice(0, 5).map((post, idx) => {
            const postSlug = post.slug;
            const postId = post.id || post._id;
            const postLink = postSlug ? `/forum/${postSlug}` : `/forum/${postId}`;
            
            if (!postId && !postSlug) return null;
            
            const badgeLabels: Record<string, string> = {
              'new': 'Mới',
              'hot': 'Nổi bật',
              'ai': 'AI',
              'featured': 'Chọn lọc',
            };

            const badgeBg: Record<string, string> = {
              'new': 'bg-emerald-500 text-white',
              'hot': 'bg-rose-500 text-white',
              'ai': 'bg-indigo-500 text-white',
              'featured': 'bg-amber-500 text-white',
            };

            const badgeClass = badgeBg[post.badge || ''] || 'bg-gray-500 text-white';

            return (
              <Link 
                href={postLink} 
                className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200" 
                key={postId || postSlug}
              >
                <span className="font-extrabold text-sm text-primary/70 shrink-0 mt-0.5 group-hover:text-primary transition-colors">
                  #{idx + 1}
                </span>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </span>
                  {post.badge && (
                    <span className={`self-start text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm ${badgeClass}`}>
                      {badgeLabels[post.badge] || post.badge.toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <EmptyState
            icon={<span role="img" aria-label="no-trending">📉</span>}
            title="Chưa có bài viết thịnh hành"
            description="Hãy là người đầu tiên tạo bài viết nổi bật!"
          />
        )}
      </div>
    </section>
  );
};

export default TrendingBlock; 