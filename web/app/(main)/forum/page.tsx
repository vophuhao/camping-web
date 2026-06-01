/* eslint-disable @next/next/no-img-element */
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import { forumApi } from '../../../lib/forumApi';
import { toast } from 'sonner';
import { ForumPost, ForumListResponse } from '../../../types/forum';
import ScrollToTop from '../../../components/forum/ui/ScrollToTop';
import ForumPostItem from '../../../components/forum/ui/ForumPostItem';
import '../../../components/forum/style/ForumPage.css';
import "../../../components/forum/style/LoadingOverlay.css";
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import { useRouter, useSearchParams } from 'next/navigation';
import TrendingBlock from '../../../components/forum/ui/TrendingBlock';
import PostSkeleton from '../../../components/forum/ui/PostSkeleton';
import EmptyState from '../../../components/forum/ui/EmptyState';
import Loader from '../../../components/forum/ui/Loader';
import ForumFilters from '../../../components/forum/ui/ForumFilters';
import ForumCategorySection from '../../../components/forum/ui/ForumCategorySection';
import ForumPostCreateBar from '../../../components/forum/ui/ForumPostCreateBar';
import SmartSearchBox from '../../../components/forum/ui/SmartSearchBox'
import { SearchSuggestion } from '../../../components/forum/ui/SmartSearchBox'
// import { userApi } from '../../../lib/user';
import { FiMessageSquare, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store';

const POSTS_PER_PAGE = 10;

// Hàm tạo màu ngẫu nhiên cho tags - Memoized để tránh thay đổi màu mỗi render
const TAG_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5a2b'
] as const;

// Use deterministic color based on tag name hash instead of random
const getTagColor = (tagName: string): string => {
  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  // Đã bỏ loading, chỉ dùng loadingPosts
  const [searchTerm, setSearchTerm] = useState('');
  const [actualSearch, setActualSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { addHistory } = useSearchHistory({ storageKey: 'forum_search_history', maxHistory: 5 });
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  // Thêm state cho trending và tags
  const [trending, setTrending] = useState<ForumPost[]>([]);
  const [tags, setTags] = useState<any[]>([]); // ForumTag[] nếu có type chuẩn
  // Thêm state loadingTrending
  const [loadingTrending, setLoadingTrending] = useState(true);
  // Thêm state filter
  const [selectedSort, setSelectedSort] = useState<string>('');
  // Thêm lại state topSubjects
  const [topSubjects, setTopSubjects] = useState<{ name: string; count: number }[]>([]);
  // Thêm state lưu các chủ đề đã chọn
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Thêm state lưu tag được chọn
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Chỉ fetch bài viết khi actualSearch thay đổi
  const fetchPosts = useCallback(async () => {

    try {
      setLoadingPosts(true);
      // Truyền category nếu có
      const response = await forumApi.getPosts(currentPage, POSTS_PER_PAGE, actualSearch, selectedCategories[0] || '');

      if (response?.data) {
        const data = response.data;
        // Lấy user hiện tại từ localStorage
        let currentUserId = '';
        try {

          currentUserId = user?._id || '';

        } catch { }
        // Chuẩn hóa dữ liệu post ở đây
        const normalizedPosts = data.map((post: any) => {
          const p: any = post;
          const author = {
            name: p.userId.username,
            avatarUrl: p.userId.avatarUrl
          }


          // Tính toán likeCount và isLiked
          let likeCount = 0;
          if (typeof p.likeCount === 'number' && p.likeCount >= 0) {
            likeCount = p.likeCount;
          } else if (Array.isArray(p.likes)) {
            likeCount = p.likes.length;
          }
          let isLiked = false;
          if (Array.isArray(p.likes) && currentUserId) {

            isLiked = p.likes.includes(currentUserId);
          } else if (typeof p.isLiked === 'boolean') {
            isLiked = p.isLiked;
          }
          const saveCount = typeof p.saveCount === 'number' ? p.saveCount : (Array.isArray(p.savedBy) ? p.savedBy.length : 0);
          const viewCount = typeof p.viewCount === 'number' ? p.viewCount : 0;
          const commentCount = typeof p.commentCount === 'number' ? p.commentCount : (Array.isArray(p.comments) ? p.comments.length : 0);
          // Tính toán isBookmarked
          let isBookmarked = false;
          if (typeof p.isBookmarked === 'boolean') {
            isBookmarked = p.isBookmarked;
          } else if (typeof p.isSaved === 'boolean') {
            isBookmarked = p.isSaved;
          } else if (Array.isArray(p.savedBy) && currentUserId) {
            isBookmarked = p.savedBy.includes(currentUserId);
          }
          return {
            ...post,
            id: post._id || post.id,
            author,
            likeCount,
            isLiked,
            saveCount,
            viewCount,
            commentCount,
            isBookmarked,
          };
        });
        if (currentPage === 1) {
          setPosts(normalizedPosts);
        } else {
          setPosts(prevPosts => [...prevPosts, ...normalizedPosts]);
        }
        setHasMore(data.length === POSTS_PER_PAGE);
      } else {
        toast.error('Có lỗi xảy ra khi tải danh sách bài viết');
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tải danh sách bài viết');
    } finally {
      setLoadingPosts(false);
      setInitialLoading(false);
    }
  }, [currentPage, actualSearch, selectedCategories, user]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, [currentPage, actualSearch, selectedCategories]);

  // Infinite scroll: Intersection Observer
  useEffect(() => {
    if (!hasMore || loadingPosts) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loadingPosts]);

  // Load trending và tags ban đầu khi mount
  useEffect(() => {
    const loadTrendingAndTags = async () => {
      setLoadingTrending(true);
      try {
        const trendingRes = await forumApi.getTrending();
        if (trendingRes?.data) setTrending(trendingRes.data);

        // Tạo tags mặc định ban đầu
        const defaultTags = [
          { id: '1', name: 'Lập trình', color: '#3b82f6', count: 0 },
          { id: '2', name: 'Toán học', color: '#10b981', count: 0 },
          { id: '3', name: 'AI', color: '#8b5cf6', count: 0 },
          { id: '4', name: 'Blog', color: '#f59e0b', count: 0 },
          { id: '5', name: 'Novel', color: '#ef4444', count: 0 },
          { id: '6', name: 'Anime', color: '#ec4899', count: 0 },
          { id: '7', name: 'Khác', color: '#6b7280', count: 0 }
        ];
        setTags(defaultTags);
      } catch { }
      setLoadingTrending(false);
    };
    loadTrendingAndTags();
    // eslint-disable-next-line
  }, []); // Chỉ chạy một lần khi mount

  // Cập nhật tags từ posts khi có bài viết mới
  useEffect(() => {
    if (posts.length === 0) return;

    // Lấy tags từ tất cả bài viết đã load
    const tagMap: Record<string, { id: string; name: string; color?: string; count: number }> = {};

    // Lấy tags từ posts hiện tại
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: any) => {
          const tagId = tag.id || tag.name;
          if (tagId) {
            if (!tagMap[tagId]) {
              tagMap[tagId] = {
                id: tagId,
                name: tag.name,
                color: tag.color || getTagColor(tag.name),
                count: 0
              };
            }
            tagMap[tagId].count++;
          }
        });
      }
    });

    // Sắp xếp theo số lượng xuất hiện và lấy top 10
    const sortedTags = Object.values(tagMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Cập nhật tags: nếu có tags thực tế thì dùng, không thì giữ tags mặc định
    if (sortedTags.length > 0) {
      setTags(sortedTags);
    } else {
      // Giữ lại tags mặc định nếu không có tags thực tế
      const defaultTags = [
        { id: '1', name: 'Lập trình', color: '#3b82f6', count: 0 },
        { id: '2', name: 'Toán học', color: '#10b981', count: 0 },
        { id: '3', name: 'AI', color: '#8b5cf6', count: 0 },
        { id: '4', name: 'Blog', color: '#f59e0b', count: 0 },
        { id: '5', name: 'Novel', color: '#ef4444', count: 0 },
        { id: '6', name: 'Anime', color: '#ec4899', count: 0 },
        { id: '7', name: 'Khác', color: '#6b7280', count: 0 }
      ];
      setTags(defaultTags);
    }
  }, [posts]); // Cập nhật khi posts thay đổi

  // Load top subjects khi mount
  useEffect(() => {
    forumApi.getTopSubjects().then((res: any) => {
      if (res.data) setTopSubjects(res.data);
    });
  }, []);

  // Xử lý URL parameter category và tag
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');

    if (categoryParam) {
      setSelectedCategories([categoryParam]);
      setSelectedTag(''); // Reset tag khi chọn category
      setCurrentPage(1); // Reset pagination
      setPosts([]); // Reset posts để tránh nhảy
    }

    if (tagParam) {
      setSelectedTag(tagParam);
      setSelectedCategories([]); // Reset category khi chọn tag
      setCurrentPage(1); // Reset pagination
      setPosts([]); // Reset posts để tránh nhảy
    }
  }, [searchParams]); // ❌ Bỏ posts khỏi dependency

  // XÓA useEffect map lại dữ liệu posts (phụ thuộc posts)

  // Lọc bài viết theo filter
  let filteredPosts = posts;

  // Sắp xếp theo selectedSort
  if (selectedSort === 'newest') filteredPosts = filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (selectedSort === 'oldest') filteredPosts = filteredPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (selectedSort === 'featured') filteredPosts = filteredPosts.sort((a, b) => (b.badge === 'featured' ? 1 : 0) - (a.badge === 'featured' ? 1 : 0));

  // Lọc bài viết theo selectedCategories (so sánh chuẩn hóa)
  if (selectedCategories.length > 0) {
    filteredPosts = filteredPosts.filter(post =>
      post.subject && selectedCategories.some(cat => cat.trim().toLowerCase() === String(post.subject).trim().toLowerCase())
    );
  }

  // Lọc bài viết theo selectedTag
  if (selectedTag) {
    filteredPosts = filteredPosts.filter(post => {
      if (!post.tags) return false;

      let tagsArray = post.tags;
      // Xử lý trường hợp tags là JSON string
      if (typeof post.tags === 'string') {
        try {
          tagsArray = JSON.parse(post.tags);
        } catch (e) {
          tagsArray = [post.tags];
        }
      }

      // Đảm bảo tagsArray là array
      if (!Array.isArray(tagsArray)) {
        tagsArray = [];
      }

      return tagsArray.some((tag: any) =>
        (typeof tag === 'string' ? tag : String(tag)).toLowerCase() === selectedTag.toLowerCase()
      );
    });
  }

  // Kiểm tra nếu post có thuộc tính 'featured' thì mới lọc, nếu không thì bỏ qua
  const featuredPosts = Array.isArray(filteredPosts) && filteredPosts[0] && 'featured' in filteredPosts[0]
    ? filteredPosts.filter((post: any) => post.featured)
    : [];
  const normalPosts = Array.isArray(filteredPosts) && filteredPosts[0] && 'featured' in filteredPosts[0]
    ? filteredPosts.filter((post: any) => !post.featured)
    : filteredPosts;

  // Load trending data
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const trendingRes = await forumApi.getTrending();

        if (trendingRes?.data) {
          // setTrending(trendingRes.data); // This line was removed as per the edit hint
        }
      } catch (err) {
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
      }
    };

    loadTrending();
  }, []);

  // Ref cho feed để scroll lên khi lọc
  const feedRef = useRef<HTMLDivElement>(null);


  // Thay thế handleLikePost và handleBookmarkPost bằng logic gọi API và cập nhật posts
  const handleLikePost = useCallback(async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Optimistic update - cập nhật UI ngay lập tức
      setPosts(prevPosts => prevPosts.map(p =>
        p.id === postId ? {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1
        } : p
      ));

      let response;
      if (post.isLiked) {
        response = await forumApi.unlikePost(postId);
      } else {
        response = await forumApi.likePost(postId);
      }

      if (response.data && response.data.success) {
        // Cập nhật với dữ liệu thật từ server
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isLiked: response.data.liked,
            likeCount: response.data.likeCount
          } : p
        ));
      } else {
        // Rollback nếu API thất bại
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isLiked: post.isLiked,
            likeCount: post.likeCount
          } : p
        ));
      }
    } catch (err) {
      // Rollback nếu có lỗi
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isLiked: post.isLiked,
            likeCount: post.likeCount
          } : p
        ));
      }
      toast.error('Có lỗi khi thích bài viết');
    }
  }, [posts]);

  const handleBookmarkPost = useCallback(async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Optimistic update - cập nhật UI ngay lập tức
      setPosts(prevPosts => prevPosts.map(p =>
        p.id === postId ? {
          ...p,
          isBookmarked: !p.isBookmarked,
          saveCount: p.isBookmarked ? Math.max(0, (p as any).saveCount - 1) : ((p as any).saveCount || 0) + 1
        } : p
      ));

      let response;
      if (post.isBookmarked) {
        response = await forumApi.unsavePost(postId);
      } else {
        response = await forumApi.savePost(postId);
      }

      if (response.data && response.data.success) {
        // Cập nhật với dữ liệu thật từ server - chỉ cập nhật isBookmarked, không cập nhật saveCount nữa
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isBookmarked: response.data.saved
            // Không cập nhật saveCount ở đây để tránh tăng 2 lần
          } : p
        ));
      } else {
        // Rollback nếu API thất bại
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isBookmarked: post.isBookmarked,
            saveCount: (post as any).saveCount
          } : p
        ));
      }
    } catch (err) {
      // Rollback nếu có lỗi
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            isBookmarked: post.isBookmarked,
            saveCount: (post as any).saveCount
          } : p
        ));
      }
      toast.error('Có lỗi khi lưu bài viết');
    }
  }, [posts]);

  // Khi đổi category, reset lại currentPage và posts
  const handleCategoryClick = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setSelectedTag(''); // Reset tag khi chọn category
    setCurrentPage(1);
    setPosts([]); // Reset lại danh sách bài viết để tránh nháy loading toàn trang
    requestAnimationFrame(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Xác định số cột (giả sử 3 cột, có thể responsive sau)
  const columns = 2;
  const renderPostsWithSkeleton = () => {
    const items = [];
    const shouldShowSkeleton = loadingPosts || (hasMore && !loadingPosts && currentPage > 1);

    // Khi loading toàn phần: render nhiều hàng skeleton (mỗi hàng 2 cái)
    if (loadingPosts) {
      for (let i = 0; i < 4; i++) { // 2 hàng, mỗi hàng 2 skeleton
        items.push(<PostSkeleton key={`skeleton-full-${i}`} />);
      }
      return items;
    }

    // Khi cuộn vô cực: chèn 2 skeleton nhỏ đúng vị trí hàng 2
    for (let i = 0; i < filteredPosts.length; i++) {
      items.push(
        <ForumPostItem
          key={filteredPosts[i].id || i}
          post={filteredPosts[i]}
          onLike={handleLikePost}
          onBookmark={handleBookmarkPost}
        />
      );
      if (shouldShowSkeleton && i === columns - 1) {
        for (let j = 0; j < columns; j++) {
          items.push(<PostSkeleton key={`skeleton-row2-${j}`} />);
        }
      }
    }
    return items;
  };

  // Show loader only on very first load
  if (initialLoading && posts.length === 0) {
    return (
      <div className="forum-page-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="forum-loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="forum-page-root mt-10" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingBottom: 240 }}>
        <ScrollToTop />
        {/* <div className="forum-banner">
          <h1>Diễn đàn Campo</h1>
          <p>Chia sẻ, thảo luận và học hỏi cùng cộng đồng sinh viên!</p>
        </div> */}
        <div className="forum-page-layout">
          <div className="forum-main-content">
            <SmartSearchBox
              value={searchTerm}
              placeholder="Tìm kiếm bài viết, chủ đề..."
              onSearch={(query: string) => {
                setSearchTerm(query);
                if (query.trim()) {
                  setActualSearch(query.trim());
                  setCurrentPage(1);
                  addHistory(query.trim());
                } else {
                  setActualSearch('');
                }
              }}
              onClear={() => {
                setSearchTerm('');
                setActualSearch('');
                setCurrentPage(1);
              }}
              // fetchSuggestions={async (query: string): Promise<SearchSuggestion[]> => {
              //   if (!query || query.trim().length < 1) return [];

              //   try {
              //     const [postsResult, usersResult] = await Promise.allSettled([
              //       forumApi.getPosts(1, 3, query, ''),
              //       userApi.searchUsers(query, 1, 2),
              //     ]);

              //     const suggestions: SearchSuggestion[] = [];

              //     // Post suggestions
              //     if (postsResult.status === 'fulfilled') {
              //       const posts = (postsResult.value as any)?.data?.posts || (postsResult.value as any)?.posts || [];
              //       posts.slice(0, 4).forEach((post: any) => {
              //         suggestions.push({
              //           id: `post-${post._id || post.id || post.slug}`,
              //           text: post.title || '',
              //           type: 'post',
              //           icon: <FiMessageSquare />,
              //           metadata: { type: 'post', slug: post.slug, ...post },
              //         });
              //       });
              //     }

              //     // User suggestions
              //     if (usersResult.status === 'fulfilled') {
              //       const users = (usersResult.value as any)?.users || [];
              //       users.slice(0, 2).forEach((user: any) => {
              //         suggestions.push({
              //           id: `user-${user._id || user.id || user.username}`,
              //           text: user.name || user.username || '',
              //           type: 'user',
              //           icon: <FiUser />,
              //           metadata: { type: 'user', username: user.username, ...user },
              //         });
              //       });
              //     }

              //     return suggestions.slice(0, 6);
              //   } catch {
              //     return [];
              //   }
              // }}
              enableHistory={true}
              historyStorageKey="forum_search_history"
              maxHistory={5}
              debounceMs={400}
              onSuggestionSelect={(suggestion: SearchSuggestion | string) => {
                if (typeof suggestion !== 'string' && suggestion.metadata) {
                  const { type, slug, username } = suggestion.metadata;
                  if (type === 'post' && slug) {
                    router.push(`/forum/${slug}`);
                  } else if (type === 'user' && username) {
                    router.push(`/profile/${username}`);
                  }
                }
              }}
              className="forum-smart-search"
              size="md"
            />
            <ForumPostCreateBar onCreate={() => router.push('/forum/create')} avatarUrl={undefined} />
            <ForumFilters
              sortOptions={[
                { id: '', label: 'Tất cả' },
                { id: 'newest', label: 'Mới nhất' },
                { id: 'oldest', label: 'Cũ nhất' },
                { id: 'featured', label: 'Nổi bật' },
              ]}
              selectedSort={selectedSort}
              onSortChange={(id: string) => {
                setSelectedSort(id);
                setTimeout(() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
            />
            {/* Tag filter indicator */}
            {selectedTag && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '16px 0',
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Đang lọc theo tag:
                </span>
                <span style={{
                  padding: '4px 12px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {selectedTag}
                </span>
                <button
                  onClick={() => {
                    setSelectedTag('');
                    router.push('/forum');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px',
                    marginLeft: 'auto'
                  }}
                  title="Xóa filter"
                >
                  ✕
                </button>
              </div>
            )}
            {featuredPosts.length > 0 && (
              <>
                <h2 className="section-title">✨ Bài viết nổi bật</h2>
                <div className="forum-featured-post">
                  <img src={featuredPosts[0].imageUrl || '/default-featured.jpg'} alt={featuredPosts[0].title} className="forum-featured-img" />
                  <span className="forum-featured-badge">Featured</span>
                  <div className="forum-featured-title">{featuredPosts[0].title}</div>
                  <div className="forum-featured-meta">
                    {(featuredPosts[0].author && featuredPosts[0].author.name) || 'Tác giả'}
                    {' • '}
                    {featuredPosts[0].createdAt && new Date(featuredPosts[0].createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </>
            )}
            <div className="latest">
              {loadingPosts ? (
                <div className="forum-feed-grid" ref={feedRef}>
                  {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
              ) : normalPosts.length === 0 ? (
                <EmptyState

                  title="Không có bài viết nào phù hợp"
                  description="Hãy thử từ khóa khác hoặc tạo bài viết mới để chia sẻ cùng cộng đồng!"
                >

                </EmptyState>
              ) : (
                <div className="forum-feed-grid" ref={feedRef}>
                  {renderPostsWithSkeleton()}
                  {hasMore && !loadingPosts && (
                    <div ref={loaderRef} style={{ height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gridColumn: '1/-1' }}>
                      <span>Đang tải thêm...</span>
                    </div>
                  )}
                  {!hasMore && !loadingPosts && (
                    <div style={{ height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gridColumn: '1/-1', color: '#888', fontSize: 15, fontStyle: 'italic' }}>
                      Đã hết bài viết
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <aside className="forum-trending-block">
            <TrendingBlock trending={trending} tags={tags} loading={loadingTrending} />
            <ForumCategorySection
              categories={topSubjects.map(s => ({ id: s.name, name: s.name, count: s.count }))}
              selectedCategories={selectedCategories}
              onCategoryClick={handleCategoryClick}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;