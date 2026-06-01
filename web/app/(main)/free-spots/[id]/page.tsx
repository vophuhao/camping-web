/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Heart, Eye, MapPin, Navigation, User,
  ChevronLeft, ChevronRight, Share2, Trash2, Loader2, Pencil,
} from 'lucide-react';
import { getFreeSpotById, toggleLike, deleteFreeSpot, type FreeSpot } from '@/lib/free-spot-api';
import TerrainBadge from '@/components/free-spots/TerrainBadge';
import FreeSpotComments from '@/components/free-spots/FreeSpotComments';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReportButton from '@/components/forum/ui/ReportButton';

const FreeSpotMap = dynamic(() => import('@/components/free-spots/FreeSpotMap'), { ssr: false });

const AMENITY_ICONS: Record<string, string> = {
  stream_nearby: '💧 Suối gần đó',
  firewood: '🪵 Củi đốt',
  flat_ground: '⛺ Mặt đất bằng',
  toilet: '🚽 Nhà vệ sinh',
  parking: '🅿️ Bãi đỗ xe',
  shade: '🌳 Bóng cây',
  fishing: '🎣 Câu cá',
  swimming: '🏊 Bơi lội',
  viewpoint: '🔭 Điểm ngắm cảnh',
  campfire: '🔥 Đốt lửa trại',
};

export default function FreeSpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [spot, setSpot] = useState<FreeSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getFreeSpotById(id);
      const data: FreeSpot = res?.data ?? res;
      setSpot(data);
      setLikeCount(data.likeCount ?? 0);
      if (user && data.likes?.includes(user._id)) setLiked(true);
    } catch {
      toast.error('Không tìm thấy địa điểm');
      router.push('/free-spots');
    } finally {
      setLoading(false);
    }
  }, [id, router, user]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thích địa điểm');
      return;
    }
    setLikeLoading(true);
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res: any = await toggleLike(id);
      setLiked(res?.data?.liked ?? !liked);
      setLikeCount(res?.data?.likeCount ?? likeCount);
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
    setDeleting(true);
    try {
      await deleteFreeSpot(id);
      toast.success('Đã xóa địa điểm');
      router.push('/free-spots');
    } catch {
      toast.error('Không thể xóa');
      setDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết!');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ color: '#10b981', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: 'var(--muted-foreground)', fontSize: 14 }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!spot) return null;

  const coords: [number, number] = [spot.location.coordinates[0], spot.location.coordinates[1]];
  const lat = spot.location.coordinates[1];
  const lng = spot.location.coordinates[0];
  const isOwner = user && spot.author?._id === user._id;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: 80 }}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky', top: 64, zIndex: 40,
          background: 'var(--background)/90',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <Link
          href="/free-spots"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 600, color: 'var(--foreground)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--foreground)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Share2 size={13} /> Chia sẻ
          </button>

          <button
            onClick={handleLike}
            disabled={likeLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10,
              border: liked ? '1px solid #ef4444' : '1px solid var(--border)',
              background: liked ? '#fef2f2' : 'var(--card)',
              color: liked ? '#ef4444' : 'var(--foreground)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Heart size={14} fill={liked ? '#ef4444' : 'none'} />
            {likeCount}
          </button>

          {/* Report button for non-owners */}
          {!isOwner && (
            <ReportButton
              itemId={id}
              itemType="free-spot"
              className=""
            />
          )}

          {isOwner && (
            <>
              <Link
                href={`/free-spots/${id}/edit`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10,
                  border: '1px solid #3b82f6', background: '#eff6ff',
                  color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                <Pencil size={13} /> Chỉnh sửa
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10,
                  border: '1px solid #ef4444', background: '#fef2f2',
                  color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Xóa
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <TerrainBadge terrain={spot.terrain} size="md" />
            {spot.isVerified && (
              <span style={{ padding: '4px 12px', borderRadius: 99, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 700 }}>
                ✓ Đã xác minh
              </span>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-foreground)' }}>
              <Eye size={13} /> {spot.viewCount ?? 0} lượt xem
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.25, color: 'var(--foreground)' }}>
            {spot.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            <MapPin size={14} color="#10b981" />
            <span>{spot.address}{spot.city && `, ${spot.city}`}{spot.province && `, ${spot.province}`}</span>
          </div>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {spot.author?.avatarUrl ? (
              <img src={spot.author.avatarUrl} alt={spot.author.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#fff" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                {spot.author?.username}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                {new Date(spot.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {spot.images?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                background: '#000', height: 420, marginBottom: 8,
              }}
            >
              <img
                src={spot.images[activeImg]}
                alt={`${spot.title} - ảnh ${activeImg + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {spot.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + spot.images.length) % spot.images.length)}
                    style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % spot.images.length)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)',
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div
                    style={{
                      position: 'absolute', bottom: 12, right: 12,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    {activeImg + 1} / {spot.images.length}
                  </div>
                </>
              )}
            </div>
            {spot.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {spot.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      flexShrink: 0, width: 72, height: 56, borderRadius: 8, overflow: 'hidden',
                      border: i === activeImg ? '2px solid #10b981' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                      boxShadow: i === activeImg ? '0 0 0 2px #10b98144' : 'none',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div
          style={{
            padding: 24, borderRadius: 16, background: 'var(--card)',
            border: '1px solid var(--border)', marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)' }}>
            📝 Mô tả
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
            {spot.description}
          </p>
        </div>

        {/* Amenities */}
        {spot.amenities?.length > 0 && (
          <div
            style={{
              padding: 24, borderRadius: 16, background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
              🎒 Tiện ích
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {spot.amenities.map((a) => (
                <span
                  key={a}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                    background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                  }}
                >
                  {AMENITY_ICONS[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Directions */}
        {spot.directions && (
          <div
            style={{
              padding: 24, borderRadius: 16, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid #bbf7d0', marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={18} color="#10b981" /> Cách di chuyển
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: '#065f46', whiteSpace: 'pre-wrap' }}>
              {spot.directions}
            </p>
          </div>
        )}

        {/* Map */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#10b981" /> Vị trí trên bản đồ
          </h2>
          <FreeSpotMap
            spots={[spot]}
            center={coords}
            zoom={13}
            height={320}
            singleSpot
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: '#10b981', color: '#fff', textDecoration: 'none',
              }}
            >
              <Navigation size={13} /> Chỉ đường Google Maps
            </a>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} />
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Comments */}
        <FreeSpotComments spotId={id} initialCount={spot.commentCount ?? 0} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
