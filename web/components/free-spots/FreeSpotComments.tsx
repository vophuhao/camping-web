/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, User } from 'lucide-react';
import { getComments, addComment, type FreeSpotComment } from '@/lib/free-spot-api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface Props {
  spotId: string;
  initialCount?: number;
}

function timeAgo(date: string) {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function FreeSpotComments({ spotId, initialCount = 0 }: Props) {
  const [comments, setComments] = useState<FreeSpotComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getComments(spotId)
      .then((res: any) => {
        if (!cancelled) setComments(res?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [spotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res: any = await addComment(spotId, content.trim());
      const newComment = res?.data ?? res;
      setComments((prev) => [...prev, newComment]);
      setContent('');
      toast.success('Đã thêm bình luận!');
    } catch {
      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--foreground)',
        }}
      >
        💬 Bình luận
        <span
          style={{
            background: '#10b981',
            color: '#fff',
            borderRadius: 99,
            padding: '2px 10px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {comments.length}
        </span>
      </h3>

      {/* Comment List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--muted-foreground)',
            background: 'var(--muted)',
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có bình luận nào</div>
          <div style={{ fontSize: 13 }}>Hãy là người đầu tiên chia sẻ cảm nhận!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {comments.map((c) => (
            <div
              key={c._id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                background: 'var(--card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
              }}
            >
              {/* Avatar */}
              {c.user?.avatarUrl ? (
                <img
                  src={c.user.avatarUrl}
                  alt={c.user.username}
                  style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <User size={18} color="#fff" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>
                    {c.user?.username ?? 'Ẩn danh'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 16px',
              background: 'var(--card)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              alignItems: 'flex-end',
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <User size={18} color="#fff" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Viết bình luận của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                rows={2}
                style={{
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: content.trim() ? '#10b981' : 'var(--muted)',
                border: 'none',
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              {submitting ? (
                <Loader2 size={16} color="#fff" className="animate-spin" />
              ) : (
                <Send size={16} color={content.trim() ? '#fff' : 'var(--muted-foreground)'} />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--muted)',
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--muted-foreground)',
          }}
        >
          <Link href="/sign-in" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
            Đăng nhập
          </Link>{' '}
          để tham gia bình luận
        </div>
      )}
    </div>
  );
}
