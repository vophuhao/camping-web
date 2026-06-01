'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getFreeSpots, deleteFreeSpot } from '@/lib/free-spot-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  MapPin, Eye, Heart, Edit3, Trash2, Loader2,
  Plus, ChevronLeft, ChevronRight, Clock, Lock, ShieldCheck,
} from 'lucide-react';

const TERRAIN_LABELS: Record<string, string> = {
  mountain: '🏔️ Núi', beach: '🏖️ Biển', forest: '🌲 Rừng',
  river: '🏞️ Sông', lake: '💧 Hồ', field: '🌾 Đồng', other: '📍 Khác',
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Hoạt động', color: '#15803d', bg: '#dcfce7' },
  pending: { label: 'Chờ duyệt', color: '#b45309', bg: '#fef3c7' },
  hidden: { label: 'Đã ẩn', color: '#c2410c', bg: '#ffedd5' },
};

export default function MySpotsPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.username === username;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: mySpots, isLoading } = useQuery({
    queryKey: ['my-free-spots', currentUser?._id, page],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const res: any = await getFreeSpots({ page, limit: 12, author: currentUser._id } as any);
      return res?.data ?? res;
    },
    enabled: isOwnProfile && !!currentUser?._id,
  });

  const spots: any[] = mySpots?.data ?? mySpots?.spots ?? [];
  const total = mySpots?.pagination?.total ?? mySpots?.total ?? spots.length;
  const totalPages = mySpots?.pagination?.totalPages ?? (Math.ceil(total / 12) || 1);

  const handleDelete = async (spotId: string) => {
    setDeletingId(spotId);
    try {
      await deleteFreeSpot(spotId);
      toast.success('Đã xóa địa điểm!');
      queryClient.invalidateQueries({ queryKey: ['my-free-spots'] });
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi xóa địa điểm');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOwnProfile) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Lock size={40} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Riêng tư</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Bạn không thể xem địa điểm của người dùng khác</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
            Địa điểm của tôi
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {total} địa điểm đã chia sẻ
          </p>
        </div>
        <Link
          href="/free-spots/create"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 10, background: '#10b981', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={15} /> Thêm địa điểm
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={32} style={{ color: '#10b981', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : spots.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
        }}>
          <MapPin size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--foreground)' }}>
            Chưa có địa điểm nào
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 20 }}>
            Hãy chia sẻ những địa điểm cắm trại tuyệt vời bạn đã khám phá!
          </p>
          <Link
            href="/free-spots/create"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
              borderRadius: 10, background: '#10b981', color: '#fff',
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}
          >
            <Plus size={16} /> Chia sẻ địa điểm đầu tiên
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {spots.map((spot: any) => {
            const badge = STATUS_BADGE[spot.status] ?? STATUS_BADGE.active;
            return (
              <div
                key={spot._id}
                style={{
                  background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
                  overflow: 'hidden', transition: 'box-shadow 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: 160, background: '#f3f4f6' }}>
                  {spot.images?.[0] ? (
                    <img
                      src={spot.images[0]}
                      alt={spot.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                      🏕️
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: badge.bg, color: badge.color,
                    }}>{badge.label}</span>
                  </div>
                  {spot.isVerified && (
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                        borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: '#dbeafe', color: '#1d4ed8',
                      }}>
                        <ShieldCheck size={10} /> Đã xác minh
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                    {TERRAIN_LABELS[spot.terrain] ?? spot.terrain}
                  </div>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, margin: '0 0 6px',
                    color: 'var(--foreground)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {spot.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                    <MapPin size={11} /> {spot.city}
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Eye size={12} /> {spot.viewCount ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Heart size={12} /> {spot.likeCount ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Clock size={12} /> {new Date(spot.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/free-spots/${spot._id}`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--card)', color: 'var(--foreground)',
                        fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Eye size={12} /> Xem
                    </Link>
                    <Link
                      href={`/free-spots/${spot._id}/edit`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '7px 0', borderRadius: 8, border: '1px solid #10b981',
                        background: '#f0fdf4', color: '#065f46',
                        fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Edit3 size={12} /> Sửa
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(spot._id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '7px 0', borderRadius: 8, border: '1px solid #ef4444',
                        background: '#fef2f2', color: '#dc2626',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}
          >
            <ChevronLeft size={14} /> Trước
          </button>
          <span style={{ fontSize: 13 }}>Trang <strong>{page}</strong> / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}
          >
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
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Xóa địa điểm?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted-foreground)' }}>
              Địa điểm sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {deletingId ? 'Đang xóa...' : 'Xóa địa điểm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
