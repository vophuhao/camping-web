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
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
          padding: '48px 24px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(16,185,129,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 280, height: 280, borderRadius: '50%', background: 'rgba(5,150,105,0.12)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* <div style={{ fontSize: 48, marginBottom: 12 }}>🏕️</div> */}
          <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
            Địa Điểm Cắm Trại Miễn Phí
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: '0 0 28px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Khám phá & chia sẻ những bãi cắm trại miễn phí tuyệt đẹp khắp Việt Nam
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 560, margin: '0 auto 16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, thành phố..."
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: 14,
                  background: '#fff',
                  color: '#111',
                  boxSizing: 'border-box',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'background 0.2s',
              }}
            >
              Tìm kiếm
            </button>
          </form>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleNearby}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10,
                border: nearbyMode ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.4)',
                background: nearbyMode ? '#10b981' : 'rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(4px)', transition: 'all 0.2s',
              }}
            >
              {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {nearbyMode ? 'Tắt vị trí' : 'Gần tôi (50km)'}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10,
                border: showFilters ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.4)',
                background: showFilters ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(4px)', transition: 'all 0.2s',
              }}
            >
              <Filter size={14} />
              Lọc địa hình
              {terrain && <span style={{ background: '#f59e0b', borderRadius: 99, width: 8, height: 8, display: 'inline-block' }} />}
            </button>

            <button
              onClick={handleShareClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                transition: 'transform 0.15s',
              }}
            >
              <Plus size={14} />
              Chia sẻ địa điểm
            </button>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div
              style={{
                marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
              }}
            >
              {TERRAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTerrainChange(opt.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: terrain === opt.value ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.3)',
                    background: terrain === opt.value ? '#10b981' : 'rgba(255,255,255,0.15)',
                    color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)', borderBottom: '1px solid var(--border)',
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13, color: 'var(--muted-foreground)', flexWrap: 'wrap',
        }}
      >
        {nearbyMode ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Navigation size={13} color="#3b82f6" />
            <strong style={{ color: '#3b82f6' }}>Chế độ gần tôi</strong>
            {' '}— Bán kính 50km
          </span>
        ) : (
          <>
            <span>
              <strong style={{ color: 'var(--foreground)' }}>{total}</strong> địa điểm
              {search && <> phù hợp với "<em>{search}</em>"</>}
            </span>
            {terrain && (
              <span
                style={{
                  padding: '2px 10px', borderRadius: 99, background: '#dcfce7',
                  color: '#15803d', fontWeight: 600,
                }}
              >
                {TERRAIN_OPTIONS.find((t) => t.value === terrain)?.label}
                <button
                  onClick={() => handleTerrainChange('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, padding: 0 }}
                >
                  ×
                </button>
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Main layout: list + map ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 440px',
          gap: 0,
          maxWidth: 1400,
          margin: '0 auto',
          minHeight: 'calc(100vh - 280px)',
        }}
        className="free-spots-layout"
      >
        {/* Left: spot list */}
        <div ref={listRef} style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', scrollbarWidth: 'thin' }}>
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 300, borderRadius: 16, background: 'var(--muted)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : spots.length === 0 ? (
            <div
              style={{
                textAlign: 'center', padding: '64px 24px',
                color: 'var(--muted-foreground)',
              }}
            >
              {/* <div style={{ fontSize: 56, marginBottom: 16 }}>🏕️</div> */}
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--foreground)' }}>
                Chưa có địa điểm nào
              </h3>
              <p style={{ fontSize: 14, marginBottom: 24 }}>
                {nearbyMode
                  ? 'Không tìm thấy địa điểm nào trong bán kính 50km.'
                  : 'Hãy thử tìm kiếm khác hoặc chia sẻ địa điểm đầu tiên!'}
              </p>
              <button
                onClick={handleShareClick}
                style={{
                  padding: '12px 28px', borderRadius: 12, border: 'none',
                  background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}
              >
                + Chia sẻ địa điểm
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
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
              {!nearbyMode && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                      background: page === 1 ? 'var(--muted)' : 'var(--card)',
                      color: page === 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                    Trang <strong>{page}</strong> / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                      background: page === totalPages ? 'var(--muted)' : 'var(--card)',
                      color: page === totalPages ? 'var(--muted-foreground)' : 'var(--foreground)',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
                    }}
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: map */}
        <div
          style={{
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            borderLeft: '1px solid var(--border)',
            overflow: 'hidden',
          }}
          className="free-spots-map-panel"
        >
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 860px) {
          .free-spots-layout {
            grid-template-columns: 1fr !important;
          }
          .free-spots-map-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
