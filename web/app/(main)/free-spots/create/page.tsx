/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, X, MapPin, Navigation, Loader2, ArrowLeft,
  Mountain, Waves, TreePine, Info,
} from 'lucide-react';
import { createFreeSpot } from '@/lib/free-spot-api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FreeSpotMap = dynamic(() => import('@/components/free-spots/FreeSpotMap'), { ssr: false });

const TERRAIN_OPTIONS = [
  { value: 'mountain', label: 'Núi', emoji: '🏔️' },
  { value: 'beach', label: 'Biển', emoji: '🏖️' },
  { value: 'forest', label: 'Rừng', emoji: '🌲' },
  { value: 'river', label: 'Sông', emoji: '🏞️' },
  { value: 'lake', label: 'Hồ', emoji: '💧' },
  { value: 'field', label: 'Đồng', emoji: '🌾' },
  { value: 'other', label: 'Khác', emoji: '📍' },
];

const AMENITY_OPTIONS = [
  { value: 'stream_nearby', label: '💧 Suối gần đó' },
  { value: 'firewood', label: '🪵 Củi đốt' },
  { value: 'flat_ground', label: '⛺ Mặt đất bằng' },
  { value: 'toilet', label: '🚽 Nhà vệ sinh' },
  { value: 'parking', label: '🅿️ Bãi đỗ xe' },
  { value: 'shade', label: '🌳 Bóng cây' },
  { value: 'fishing', label: '🎣 Câu cá' },
  { value: 'swimming', label: '🏊 Bơi lội' },
  { value: 'viewpoint', label: '🔭 Điểm ngắm cảnh' },
  { value: 'campfire', label: '🔥 Đốt lửa trại' },
];

const VIETNAM_CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

export default function CreateFreeSpotPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để chia sẻ địa điểm');
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [terrain, setTerrain] = useState('other');
  const [directions, setDirections] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(parseFloat(lat.toFixed(6)));
    setLongitude(parseFloat(lng.toFixed(6)));
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 8) {
      toast.error('Tối đa 8 ảnh');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const toggleAmenity = (val: string) => {
    setAmenities((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  };

  const handleGetLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocating(false);
        toast.success('Đã lấy vị trí hiện tại!');
      },
      () => {
        setLocating(false);
        toast.error('Không thể lấy vị trí');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error('Vui lòng nhập tên địa điểm');
    if (!description.trim()) return toast.error('Vui lòng nhập mô tả');
    if (!address.trim()) return toast.error('Vui lòng nhập địa chỉ');
    if (!city.trim()) return toast.error('Vui lòng chọn thành phố');
    if (latitude === '' || longitude === '') return toast.error('Vui lòng chọn vị trí trên bản đồ');

    setSubmitting(true);
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('address', address.trim());
    fd.append('city', city.trim());
    if (province.trim()) fd.append('province', province.trim());
    fd.append('latitude', String(latitude));
    fd.append('longitude', String(longitude));
    fd.append('terrain', terrain);
    if (directions.trim()) fd.append('directions', directions.trim());
    if (amenities.length) fd.append('amenities', amenities.join(','));
    images.forEach((img) => fd.append('images', img));

    try {
      const res: any = await createFreeSpot(fd);
      toast.success('Chia sẻ địa điểm thành công! 🎉');
      const newId = res?.data?._id ?? res?._id;
      router.push(newId ? `/free-spots/${newId}` : '/free-spots');
    } catch (err: any) {
      toast.error(err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const mapSpot =
    latitude !== '' && longitude !== ''
      ? [{
        _id: 'preview',
        title: title || 'Vị trí đã chọn',
        location: { type: 'Point' as const, coordinates: [longitude as number, latitude as number] },
        images: [], description: '', address, city, terrain: terrain as any,
        amenities: [], likes: [], likeCount: 0, viewCount: 0, commentCount: 0,
        slug: '', isVerified: false, status: 'active' as const, createdAt: '',
        author: { _id: '', username: '' },
      }]
      : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: 60 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          padding: '28px 24px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link
            href="/free-spots"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </Link>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
            Chia sẻ địa điểm cắm trại
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Giúp cộng đồng khám phá những điểm cắm trại miễn phí tuyệt đẹp
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Basic info */}
          <Section title="Thông tin cơ bản">
            <FormField label="Tên địa điểm *">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bãi cắm trại bờ hồ Tuyền Lâm"
                style={inputStyle}
                maxLength={120}
              />
            </FormField>

            <FormField label="Mô tả *">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về địa điểm, cảnh đẹp, đặc điểm nổi bật..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                maxLength={2000}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                {description.length}/2000
              </div>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Địa chỉ *">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số thôn, xã, huyện..."
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Tỉnh/Thành phố *">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {VIETNAM_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </Section>

          {/* Terrain */}
          <Section title="Loại địa hình">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TERRAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTerrain(opt.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: terrain === opt.value ? '2px solid #10b981' : '2px solid var(--border)',
                    background: terrain === opt.value ? '#f0fdf4' : 'var(--card)',
                    color: terrain === opt.value ? '#065f46' : 'var(--foreground)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Location picker */}
          <Section title="Vị trí trên bản đồ *">
            <div
              style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13,
              }}
            >
              <Info size={15} color="#2563eb" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ color: '#1e40af', lineHeight: 1.5 }}>
                Click vào bản đồ để đặt marker, hoặc kéo marker đến vị trí chính xác.
                Bạn cũng có thể nhập tọa độ thủ công bên dưới.
              </span>
            </div>

            <FreeSpotMap
              spots={mapSpot as any}
              height={300}
              interactive
              onLocationChange={handleLocationChange}
              center={longitude !== '' && latitude !== ''
                ? [longitude as number, latitude as number]
                : undefined}
              zoom={5}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="VD: 11.9404"
                  step="0.000001"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>Kinh độ (Longitude)</label>
                <input
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="VD: 108.4358"
                  step="0.000001"
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                  borderRadius: 10, border: '1px solid #2563eb', background: '#eff6ff',
                  color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                Vị trí của tôi
              </button>
            </div>
          </Section>

          {/* Amenities */}
          <Section title="Tiện ích có sẵn">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {AMENITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAmenity(opt.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: amenities.includes(opt.value) ? '2px solid #10b981' : '2px solid var(--border)',
                    background: amenities.includes(opt.value) ? '#f0fdf4' : 'var(--card)',
                    color: amenities.includes(opt.value) ? '#065f46' : 'var(--foreground)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Directions */}
          <Section title="Hướng dẫn di chuyển">
            <textarea
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              placeholder="Mô tả cách đến địa điểm: xuất phát từ đâu, đi theo hướng nào, các mốc đặc biệt trên đường..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
              maxLength={3000}
            />
          </Section>

          {/* Images */}
          <Section title="📷 Hình ảnh (tối đa 8 ảnh)">
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: 12,
                padding: 32, textAlign: 'center', cursor: 'pointer',
                background: 'var(--muted)', marginBottom: previews.length ? 16 : 0,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                const fakeEvent = { target: { files: { ...files, length: files.length } } } as any;
                handleImageSelect({ target: { files } } as any);
              }}
            >
              <Upload size={32} color="#9ca3af" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
                Click để chọn ảnh hoặc kéo thả vào đây
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                PNG, JPG, WebP — Tối đa 8 ảnh
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
            </div>

            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {previews.map((url, i) => (
                  <div
                    key={i}
                    style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#e5e7eb' }}
                  >
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: '50%', border: 'none',
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span
                        style={{
                          position: 'absolute', bottom: 4, left: 4,
                          background: '#10b981', color: '#fff',
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        }}
                      >
                        ẢNH CHÍNH
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 20px rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Đang chia sẻ...</>
            ) : (
              <>🏕️ Chia sẻ địa điểm</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Helper subcomponents ──────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--foreground)',
  marginBottom: 6,
};
