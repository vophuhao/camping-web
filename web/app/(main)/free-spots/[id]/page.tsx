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
      console.log('CLIENT FETCH - data:', data);
      console.log('CLIENT FETCH - user:', user);
      setSpot(data);
      setLikeCount(data.likeCount ?? 0);
      const isLiked = user ? !!data.likes?.includes(user._id) : false;
      console.log('CLIENT FETCH - isLiked:', isLiked, 'likes array:', data.likes);
      setLiked(isLiked);
    } catch (err) {
      console.error('CLIENT FETCH ERROR:', err);
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
    if (!spot) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    console.log('CLIENT LIKE CLICKED - next liked state (optimistic):', newLiked);
    try {
      const res: any = await toggleLike(spot._id);
      console.log('CLIENT LIKE RESPONSE:', res);
      const serverLiked = res?.data?.liked ?? res?.liked ?? newLiked;
      const serverCount = res?.data?.likeCount ?? res?.likeCount ?? (liked ? likeCount - 1 : likeCount + 1);
      console.log('CLIENT LIKE STATE UPDATED - liked:', serverLiked, 'count:', serverCount);
      setLiked(serverLiked);
      setLikeCount(serverCount);
    } catch (err) {
      console.error('CLIENT LIKE ERROR:', err);
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!spot) return;
    if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
    setDeleting(true);
    try {
      await deleteFreeSpot(spot._id);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 size={40} className="text-primary animate-spin mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm font-medium">Đang tải...</p>
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className=" top-16 z-40 bg-background/90 backdrop-blur-md  border-border py-3.5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <Link
            href="/free-spots"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden rounded-md px-2 py-1"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          {/* Quick action group on top bar */}
          {/* <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Chia sẻ địa điểm này"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition-all focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden"
            >
              <Share2 size={13} /> <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            <button
              onClick={handleLike}
              disabled={likeLoading}
              aria-label={`Thích địa điểm này. Hiện tại có ${likeCount} lượt thích`}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-hidden ${
                liked
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* ── Main layout: 2 columns ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Image Gallery, Description, Amenities, Comments */}
          <div className="lg:col-span-2 space-y-8">

            {/* Gallery */}
            {spot.images && spot.images.length > 0 ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-black shadow-sm group">
                  <img
                    src={spot.images[activeImg]}
                    alt={`${spot.title} - ảnh ${activeImg + 1}`}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {spot.images.length > 1 ? (
                    <>
                      <button
                        onClick={() => setActiveImg((i) => (i - 1 + spot.images.length) % spot.images.length)}
                        aria-label="Ảnh trước"
                        className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all backdrop-blur-xs opacity-0 group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:opacity-100 outline-hidden"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        onClick={() => setActiveImg((i) => (i + 1) % spot.images.length)}
                        aria-label="Ảnh sau"
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all backdrop-blur-xs opacity-0 group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:opacity-100 outline-hidden"
                      >
                        <ChevronRight size={22} />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md">
                        {activeImg + 1} / {spot.images.length}
                      </div>
                    </>
                  ) : null}
                </div>

                {spot.images.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {spot.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`cursor-pointer shrink-0 h-14 w-20 rounded-xl overflow-hidden border-2 transition-all focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden ${i === activeImg
                          ? 'border-primary ring-4 ring-primary/10 scale-102'
                          : 'border-transparent hover:border-border'
                          }`}
                      >
                        <img src={img} alt="" width={80} height={56} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Title & Info on Mobile (Hidden on Desktop) */}
            <div className="block lg:hidden space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <TerrainBadge terrain={spot.terrain} size="md" />
                {spot.isVerified ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    ✓ Đã xác minh
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">{spot.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                <MapPin size={15} className="text-primary/70 shrink-0" />
                <span>{spot.address}{spot.city ? `, ${spot.city}` : ''}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-foreground mb-4 border-b border-border pb-3 flex items-center gap-2">
                📝 Mô tả địa điểm
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {spot.description}
              </p>
            </div>

            {/* Amenities */}
            {spot.amenities && spot.amenities.length > 0 ? (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
                <h2 className="text-base font-extrabold text-foreground mb-4 border-b border-border pb-3 flex items-center gap-2">
                  🎒 Tiện ích dã ngoại
                </h2>
                <div className="flex flex-wrap gap-2">
                  {spot.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      {AMENITY_ICONS[a] ?? a}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Directions */}
            {spot.directions ? (
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-500/20 rounded-3xl p-6 shadow-xs">
                <h2 className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 mb-4 border-b border-emerald-500/20 pb-3 flex items-center gap-2">
                  <Navigation size={18} className="text-emerald-600 dark:text-emerald-400" /> Cách di chuyển
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-emerald-900 dark:text-emerald-300 whitespace-pre-wrap">
                  {spot.directions}
                </p>
              </div>
            ) : null}

            {/* Comments */}
            <div className="pt-6 border-t border-border">
              <FreeSpotComments spotId={spot._id} initialCount={spot.commentCount ?? 0} />
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar with Map, Navigation, Author details */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Quick Info & Action Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">

                {/* Badge and Title */}
                <div className="hidden lg:block space-y-3.5">
                  {/* <div className="flex items-center gap-2.5 flex-wrap">
                    <TerrainBadge terrain={spot.terrain} size="md" />
                    {spot.isVerified ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        ✓ Đã xác minh
                      </span>
                    ) : null}
                  </div> */}
                  <h1 className="text-xl font-extrabold text-foreground leading-snug">{spot.title}</h1>
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground font-semibold">
                    <MapPin size={14} className="text-primary/70 shrink-0 mt-0.5" />
                    <span>{spot.address}{spot.city ? `, ${spot.city}` : ''}{spot.province ? `, ${spot.province}` : ''}</span>
                  </div>
                </div>

                {/* View stats */}
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground border-b border-border pb-4">
                  <span className="flex items-center gap-1"><Eye size={14} /> {spot.viewCount ?? 0} lượt xem</span>
                  <span className="flex items-center gap-1"><Heart className='text-red-500' fill='currentColor' size={14} /> {likeCount} lượt thích</span>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  {spot.author?.avatarUrl ? (
                    <img
                      src={spot.author.avatarUrl}
                      alt={spot.author.username}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {spot.author?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    {/* <span className="text-xs text-muted-foreground">Người đăng</span> */}
                    <span className="text-sm font-extrabold text-foreground truncate">
                      {spot.author?.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(spot.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Primary Action: Google Maps Button */}
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white hover:bg-primary/95 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-md hover:scale-102 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden"
                  >
                    <Navigation size={15} /> Chỉ đường Google Maps
                  </a>
                </div>

                {/* Secondary Actions Flex Row */}
                <div className="flex items-center gap-2 border-t border-border pt-4">
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    aria-label={liked ? 'Bỏ thích địa điểm này' : 'Thích địa điểm này'}
                    className={`flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-hidden ${liked
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-extrabold'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                  >
                    <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                    <span>{liked ? 'Đã thích' : 'Thích'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    aria-label="Chia sẻ liên kết đến địa điểm này"
                    className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition-all focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden"
                  >
                    <Share2 size={13} />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                {/* Owner Actions & Report Option */}
                {isOwner ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Link
                      href={`/free-spots/${spot._id}/edit`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-500/35 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-hidden"
                    >
                      <Pencil size={13} /> Chỉnh sửa
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-hidden"
                    >
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Xóa bỏ
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border flex justify-center">
                    <ReportButton
                      itemId={spot._id}
                      itemType="free-spot"
                      className="w-full justify-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  </div>
                )}

              </div>

              {/* Map Widget */}
              <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-3">
                <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2.5">
                  <MapPin size={14} className="text-primary" /> Vị trí bản đồ
                </div>
                <div className="rounded-2xl overflow-hidden border border-border h-[220px] relative bg-muted shadow-inner">
                  <FreeSpotMap
                    spots={[spot]}
                    center={coords}
                    zoom={13}
                    height={220}
                    singleSpot
                  />
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between px-1">
                  <span>Tọa độ: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-bold"
                  >
                    Xem trên Maps
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
