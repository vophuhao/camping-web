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
    <section className="trending-block-ui">
      <div className="trending-header-ui">🔥 Đang thịnh hành</div>
      <div className="trending-list-ui">
        {trending && trending.length > 0 ? (
          trending.slice(0, 5).map((post, idx) => {
            // Ưu tiên dùng slug, fallback về ID
            const postSlug = post.slug;
            const postId = post.id || post._id;
            const postLink = postSlug ? `/forum/${postSlug}` : `/forum/${postId}`;
            
            if (!postId && !postSlug) return null;
            return (
              <Link href={postLink} className="trending-item-ui" key={postId || postSlug}>
                <span className="trending-rank-ui">#{idx + 1}</span>
                <span className="trending-title-ui">{post.title}</span>
                {post.badge && <span className={`trending-badge-ui badge-${post.badge}`}>{post.badge === 'new' ? 'Mới' : post.badge === 'hot' ? 'Nổi bật' : post.badge === 'ai' ? 'AI' : 'Chọn lọc'}</span>}
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