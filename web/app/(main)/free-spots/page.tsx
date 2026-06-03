/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Navigation, Plus, X, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { getFreeSpots, getNearbySpots, type FreeSpot } from '@/lib/free-spot-api';
import FreeSpotCard from '@/components/free-spots/FreeSpotCard';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const FreeSpotMap = dynamic(() => import('@/components/free-spots/FreeSpotMap'), { ssr: false });

const TERRAIN_OPTIONS = [
  { value: '', label: 'Tất cả địa hình' },
  { value: 'mountain', label: 'Núi' },
  { value: 'beach', label: 'Biển' },
  { value: 'forest', label: 'Rừng' },
  { value: 'river', label: 'Sông' },
  { value: 'lake', label: 'Hồ' },
  { value: 'field', label: 'Đồng bằng' },
  { value: 'other', label: 'Khác' },
];

const LIMIT = 12;

export default function FreeSpotsPage() {
  const [spots, setSpots] = useState<FreeSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [terrain, setTerrain] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getFreeSpots({ page, limit: LIMIT, search: search || undefined, terrain: terrain || undefined });
      setSpots(res?.data ?? []);
      setTotal(res?.pagination?.total ?? 0);
      setTotalPages(res?.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Không thể tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  }, [page, search, terrain]);

  useEffect(() => {
    if (!nearbyMode) fetchSpots();
  }, [fetchSpots, nearbyMode]);

  // GPS nearby search
  const handleNearby = () => {
    if (nearbyMode) {
      setNearbyMode(false);
      setUserLocation(null);
      fetchSpots();
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setLocating(false);
        setNearbyMode(true);
        setLoading(true);
        try {
          const res: any = await getNearbySpots(lat, lng, 50);
          setSpots(res?.data ?? []);
          setTotalPages(1);
          setTotal(res?.data?.length ?? 0);
        } catch {
          toast.error('Không thể tìm địa điểm gần đây');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.');
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    if (nearbyMode) {
      setNearbyMode(false);
      setUserLocation(null);
    }
  };

  const handleTerrainChange = (val: string) => {
    setTerrain(val);
    setPage(1);
    if (nearbyMode) { setNearbyMode(false); setUserLocation(null); }
  };

  const handleMarkerClick = (id: string) => {
    setHighlightedId(id);
    const card = document.getElementById(`spot-card-${id}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleShareClick = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để chia sẻ địa điểm');
      router.push('/sign-in');
      return;
    }
    router.push('/free-spots/create');
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-10 px-6 md:px-10 text-center text-black">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full  blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-64 w-64 rounded-full  blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-3">
            Địa Điểm Cắm Trại Tự Do & Miễn Phí
          </h1>
          {/* <p className="text-sm md:text-base text-black/90 max-w-xl mx-auto mb-8 leading-relaxed">
            Khám phá và chia sẻ những bãi cắm trại hoang sơ, tuyệt đẹp và hoàn toàn miễn phí trên khắp Việt Nam.
          </p> */}

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, thành phố…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-5 py-3.5 pl-12 text-sm text-foreground placeholder-muted-foreground outline-none shadow-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden transition-all"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden rounded-md p-0.5"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleNearby}
              disabled={locating}
              className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden hover:scale-102 ${nearbyMode
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-card text-foreground border-border hover:bg-muted shadow-sm'
                }`}
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={15} />}
              {nearbyMode ? 'Tắt vị trí' : 'Gần tôi (50km)'}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden hover:scale-102 ${showFilters
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-card text-foreground border-border hover:bg-muted shadow-sm'
                }`}
            >
              <Filter size={15} />
              Lọc địa hình

            </button>

            <button
              onClick={handleShareClick}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/95 transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden"
            >
              <Plus size={15} />
              Chia sẻ địa điểm
            </button>
          </div>

          {/* Filter row */}
          {showFilters ? (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {TERRAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTerrainChange(opt.value)}
                  className={`cursor-pointer px-4 py-2 rounded-full text-xs font-bold border transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden hover:scale-102 ${terrain === opt.value
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'bg-card border-border text-foreground hover:bg-muted shadow-xs'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div className=" px-6 py-3.5 flex items-center justify-between text-sm text-muted-foreground">
        {nearbyMode ? (
          <span className="flex items-center gap-2">
            <Navigation size={14} className="text-primary animate-pulse-subtle" />
            <strong className="text-primary font-bold">Chế độ gần tôi</strong>
            <span>— Đang hiển thị địa điểm trong bán kính 50km</span>
          </span>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {/* <span>
              Tìm thấy <strong className="text-foreground font-bold">{total}</strong> địa điểm cắm trại
              {search && <> khớp với từ khóa "<em>{search}</em>"</>}
            </span> */}
            {terrain ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {TERRAIN_OPTIONS.find((t) => t.value === terrain)?.label}
                <button
                  onClick={() => handleTerrainChange('')}
                  aria-label="Xóa lọc địa hình"
                  className="hover:text-emerald-700 dark:hover:text-emerald-300 font-bold ml-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/50 outline-hidden rounded-xs px-0.5"
                >
                  ×
                </button>
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Main layout: list + map ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_440px] max-w-7xl mx-auto min-h-[calc(100vh-280px)]">
        {/* Left: spot list */}
        <div ref={listRef} className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : spots.length === 0 ? (
            <div className="text-center py-16 px-6 max-w-md mx-auto">
              <div className="text-5xl mb-4">🏕️</div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                Chưa tìm thấy địa điểm nào
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {nearbyMode
                  ? 'Không tìm thấy địa điểm cắm trại tự do nào trong bán kính 50km quanh bạn.'
                  : 'Hãy thử tìm kiếm từ khóa khác hoặc chia sẻ địa điểm cắm trại tự do đầu tiên!'}
              </p>
              <button
                onClick={handleShareClick}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/95 transition-all"
              >
                + Chia sẻ địa điểm
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {spots.map((spot) => (
                  <div key={spot._id} id={`spot-card-${spot._id}`}>
                    <FreeSpotCard
                      spot={spot}
                      highlighted={highlightedId === spot._id}
                      onHover={setHighlightedId}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {!nearbyMode && totalPages > 1 ? (
                <div className="flex justify-center items-center gap-4 py-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden ${page === 1
                      ? 'bg-muted border-transparent text-muted-foreground cursor-not-allowed'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                      }`}
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Trang <strong className="text-foreground font-bold">{page}</strong> / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-hidden ${page === totalPages
                      ? 'bg-muted border-transparent text-muted-foreground cursor-not-allowed'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                      }`}
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Right: map */}
        <div className="hidden lg:block sticky top-16 h-[calc(100vh-64px)] border-l border-border overflow-hidden">
          <FreeSpotMap
            spots={spots}
            highlightedId={highlightedId}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
            nearbyRadius={nearbyMode ? 50 : undefined}
            height={9999}
          />
        </div>
      </div>
    </div>
  )
}
