'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { forumApi } from '@/lib/forumApi';
import API from '@/lib/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
  MessageSquare, Eye, Heart, Edit3, Trash2,
  Loader2, Plus, ChevronLeft, ChevronRight, Clock, Lock,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Đã đăng', color: '#15803d', bg: '#dcfce7' },
  draft: { label: 'Nháp', color: '#b45309', bg: '#fef3c7' },
  archived: { label: 'Lưu trữ', color: '#6b7280', bg: '#f3f4f6' },
  hidden: { label: 'Đã ẩn', color: '#c2410c', bg: '#ffedd5' },
  deleted: { label: 'Đã xóa', color: '#6b7280', bg: '#f3f4f6' },
  active: { label: 'Hoạt động', color: '#15803d', bg: '#dcfce7' },
};

export default function MyPostsPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.username === username;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: myPostsData, isLoading } = useQuery({
    queryKey: ['my-posts-by-user', currentUser?._id, page],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const res: any = await API.get(`/forum/${currentUser._id}/posts`, {
        params: { page, pageSize: 12 },
      });
      return res?.data ?? res;
    },
    enabled: isOwnProfile && !!currentUser?._id,
  });

  const posts: any[] = myPostsData?.data ?? myPostsData?.posts ?? [];
  const total = myPostsData?.pagination?.total ?? myPostsData?.totalPosts ?? posts.length;
  const totalPages = myPostsData?.pagination?.totalPages ?? myPostsData?.totalPages ?? (Math.ceil(total / 12) || 1);

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      await forumApi.deletePost(postId);
      toast.success('Đã xóa bài viết!');
      queryClient.invalidateQueries({ queryKey: ['my-posts-by-user'] });
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi xóa bài viết');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOwnProfile) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Lock size={40} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Riêng tư</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Bạn không thể xem bài viết của người dùng khác</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
            Bài viết của tôi
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {total} bài viết
          </p>
        </div>
        <Link
          href="/forum/create"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 10, background: '#2563eb', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}
        >
          <Plus size={15} /> Tạo bài viết
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
        }}>
          <MessageSquare size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--foreground)' }}>
            Chưa có bài viết nào
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 20 }}>
            Hãy chia sẻ kinh nghiệm cắm trại của bạn với cộng đồng!
          </p>
          <Link
            href="/forum/create"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
              borderRadius: 10, background: '#2563eb', color: '#fff',
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}
          >
            <Plus size={16} /> Viết bài đầu tiên
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post: any) => {
            const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.published;
            return (
              <div
                key={post._id}
                style={{
                  background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                }}
              >
                {/* Cover image */}
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    style={{ width: 80, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: badge.bg, color: badge.color,
                    }}>{badge.label}</span>
                    {post.subject && (
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280' }}>
                        {post.subject}
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: 15, fontWeight: 700, margin: '0 0 8px',
                    color: 'var(--foreground)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {post.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Eye size={12} /> {post.viewCount ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Heart size={12} /> {post.likeCount ?? post.likes?.length ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <MessageSquare size={12} /> {post.commentCount ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {post.slug && (
                    <Link
                      href={`/forum/${post.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)',
                        color: 'var(--foreground)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Eye size={12} /> Xem
                    </Link>
                  )}
                  <Link
                    href={`/forum/${post._id}/edit`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 8, border: '1px solid #2563eb', background: '#eff6ff',
                      color: '#1d4ed8', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Edit3 size={12} /> Sửa
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(post._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 8, border: '1px solid #ef4444', background: '#fef2f2',
                      color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>
            <ChevronLeft size={14} /> Trước
          </button>
          <span style={{ fontSize: 13 }}>Trang <strong>{page}</strong> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>
            Sau <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Xóa bài viết?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted-foreground)' }}>
              Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {deletingId ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
