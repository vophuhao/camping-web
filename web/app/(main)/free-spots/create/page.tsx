/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, X, Navigation, Loader2, ArrowLeft, Info,
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Banner */}
      <div className="py-10 px-6 md:px-10 ">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <Link
            href="/free-spots"
            className="inline-flex items-center gap-2 text-sm font-bold  transition-colors focus-visible:ring-2 focus-visible:ring-white/50 outline-hidden rounded-md px-2 py-1 w-fit"
          >
            <ArrowLeft size={16} color="black" /> Quay lại danh sách
          </Link>

        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Basic Info, Location picker, Directions */}
          <div className="lg:col-span-2 space-y-8">

            {/* Basic Info Section */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
                📝 Thông tin cơ bản
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Tên địa điểm *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Bãi cắm trại bờ hồ Tuyền Lâm"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Mô tả *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết về cảnh quan, đường đi, đặc điểm nổi bật, lưu ý an toàn..."
                    rows={5}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all resize-none"
                    maxLength={2000}
                  />
                  <div className="text-right text-[10px] text-muted-foreground mt-1 font-semibold">
                    {description.length}/2000
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Địa chỉ *</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="VD: Phân khu 18, khu du lịch hồ Tuyền Lâm"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Tỉnh/Thành phố *</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="">-- Chọn tỉnh/thành phố --</option>
                      {VIETNAM_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Map & Location Section */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
                🗺️ Vị trí trên bản đồ
              </h2>

              <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 rounded-2xl p-4 flex gap-2.5 text-xs font-medium">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="line-height-relaxed">
                  Bấm trực tiếp vào bản đồ để chọn tọa độ, hoặc kéo marker đến vị trí mong muốn. Tọa độ (Vĩ độ/Kinh độ) sẽ được cập nhật tự động.
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border h-[320px] bg-muted shadow-inner relative">
                <FreeSpotMap
                  spots={mapSpot as any}
                  height={320}
                  interactive
                  onLocationChange={handleLocationChange}
                  center={longitude !== '' && latitude !== '' ? [longitude as number, latitude as number] : undefined}
                  zoom={5}
                />
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="VD: 11.9404"
                    step="0.000001"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="VD: 108.4358"
                    step="0.000001"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm hover:bg-amber-500/20 active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50 outline-hidden"
                >
                  {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={15} />}
                  Lấy vị trí của tôi
                </button>
              </div>
            </div>

            {/* Directions Section */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
                🧭 Chỉ dẫn di chuyển
              </h2>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Cách di chuyển (tùy chọn)</label>
                <textarea
                  value={directions}
                  onChange={(e) => setDirections(e.target.value)}
                  placeholder="VD: Từ chợ Đà Lạt đi theo hướng đèo Prenn, rẽ vào đường Tuyền Lâm, đi tiếp 3km qua khỏi khu Resort..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all resize-none"
                  maxLength={3000}
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Terrain, Amenities, Image Uploader, Submit */}
          <div className="space-y-8 lg:col-span-1">

            {/* Terrain & Amenities Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">

              {/* Terrain options */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-foreground border-b border-border pb-2.5">
                  🏔️ Loại địa hình
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TERRAIN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTerrain(opt.value)}
                      className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-amber-500/50 outline-hidden ${terrain === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                      <span className="mr-1">{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities options */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-foreground border-b border-border pb-2.5">
                  🎒 Tiện ích dã ngoại
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((opt) => {
                    const isSelected = amenities.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleAmenity(opt.value)}
                        className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-amber-500/50 outline-hidden ${isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Images Uploader Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
                📷 Ảnh chụp địa điểm
              </h2>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer bg-muted/50 hover:bg-muted transition-all hover:border-amber-500/50 group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                  handleImageSelect({ target: { files } } as any);
                }}
              >
                <Upload size={28} className="text-muted-foreground group-hover:text-amber-500 transition-colors mx-auto mb-2.5" />
                <div className="text-xs font-bold text-foreground mb-1">
                  Chọn ảnh chụp hoặc kéo thả
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold">
                  Chấp nhận PNG, JPG, WebP — Tối đa 8 ảnh
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Previews grid */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {previews.map((url, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-square bg-muted border border-border group"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Xóa ảnh này"
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center border-none cursor-pointer hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 outline-hidden"
                      >
                        <X size={10} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action Card */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer w-full bg-primary hover:bg-amber-600 text-white text-base font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500/50 outline-hidden disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang chia sẻ địa điểm...
                  </>
                ) : (
                  <>🏕️ Chia sẻ địa điểm</>
                )}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
