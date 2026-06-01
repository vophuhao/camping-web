/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CampsiteFormModal from '@/components/modals/campsite-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  createCampsite,
  deleteCampsite,
  getAllAmenities,
  getMyCampsites,
  updateCampsite,
} from '@/lib/client-actions';
import {
  Calendar,
  Edit,
  Eye,
  Home,
  MapPin,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  tent: 'Lều cắm trại',
  rv: 'RV/Caravan',
  cabin: 'Cabin',
  glamping: 'Glamping',
  treehouse: 'Nhà trên cây',
  yurt: 'Yurt',
  other: 'Khác',
};

export default function CampsitePage() {
  const [openModal, setOpenModal] = useState(false);
  const [listCampsites, setListCampsites] = useState<Campsite[]>([]);
  const [filteredCampsites, setFilteredCampsites] = useState<Campsite[]>([]);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campsiteToDelete, setCampsiteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!openModal && !deleteDialogOpen) {
      // Khi cả 2 modal đều đóng → mở khóa scroll
      document.body.style.overflow = 'unset';
    }
  }, [openModal, deleteDialogOpen]); // Chạy mỗi khi modal mở/đóng

  // ✅ Sửa handleCloseModal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCampsite(null);
    document.body.style.overflow = 'unset'; // Mở khóa scroll
  };

  useEffect(() => {
    fetchCampsites();
  }, []);

  useEffect(() => {
    filterCampsites();
  }, [listCampsites, activeTab, sortBy]);

  function confirmDelete(campsite: Campsite) {
    setCampsiteToDelete(campsite._id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(true);

      const response = await deleteCampsite(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete campsite');
      }
      toast.success('Đã xóa địa điểm thành công!');
      setDeleteDialogOpen(false);
      setCampsiteToDelete(null);
      await fetchCampsites();
    } catch (error: any) {
      console.error('❌ Error deleting campsite:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa địa điểm');
    } finally {
      setDeleting(false);
    }
  }

  async function fetchCampsites() {
    try {
      setLoading(true);
      const response = await getMyCampsites();
      setListCampsites(response.data || []);
    } catch (error) {
      console.error('Error fetching campsites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAmenities() {
    const res = await getAllAmenities();
    if (res.success && res.data) {
      setAmenities(res.data);
    }
  }

  async function fetchData() {
    await fetchAmenities();
  }

  useEffect(() => {
    fetchData();
  }, []);

  function filterCampsites() {
    let filtered = [...listCampsites];

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    } else if (activeTab === 'instant') {
      filtered = filtered.filter(c => c.isInstantBook);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'price-high':
          return b.pricing.basePrice - a.pricing.basePrice;
        case 'price-low':
          return a.pricing.basePrice - b.pricing.basePrice;
        case 'popular':
          return b.views - a.views;
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        default:
          return 0;
      }
    });

    setFilteredCampsites(filtered);
  }

  function handleEdit(campsite: Campsite) {
    setSelectedCampsite(campsite);
    setOpenModal(true);
  }

  async function handleSubmit(data: any) {
    try {
      const mode = selectedCampsite ? 'edit' : 'create';
      console.log(`🚀 Submitting campsite (${mode} mode):`, data);
      let res;

      if (mode === 'create') {
        res = await createCampsite(data);

        if (res.success) {
          toast.success('Địa điểm cắm trại đã được tạo thành công!');
          setOpenModal(false);
          setSelectedCampsite(null);
          await fetchCampsites(); // ✅ Wait for refresh
        } else {
          toast.error(res.message || 'Có lỗi xảy ra khi tạo địa điểm');
          throw new Error(res.message);
        }
      } else {
        // Guard against null selectedCampsite before attempting update
        if (!selectedCampsite) {
          toast.error('Không tìm thấy địa điểm để cập nhật');
          return;
        }

        res = await updateCampsite(selectedCampsite._id, data);
        console.log('✅ Update response:', res);

        if (res.success) {
          toast.success('Địa điểm đã được cập nhật thành công!');
          setOpenModal(false);
          setSelectedCampsite(null);
          await fetchCampsites(); // ✅ Wait for refresh
        } else {
          toast.error(res.message || 'Có lỗi xảy ra khi cập nhật');
          throw new Error(res.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      // Toast already shown above
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  const stats = {
    total: listCampsites.length,
    active: listCampsites.filter(c => c.isActive).length,
    inactive: listCampsites.filter(c => !c.isActive).length,
    instant: listCampsites.filter(c => c.isInstantBook).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý địa điểm
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý và theo dõi các địa điểm cắm trại của bạn
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedCampsite(null);
                setOpenModal(true);
              }}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Thêm địa điểm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tổng số</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Đang hoạt động
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Đặt ngay</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.instant}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <Eye className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tạm dừng</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.inactive}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="active">Hoạt động</TabsTrigger>
              <TabsTrigger value="inactive">Tạm dừng</TabsTrigger>
              <TabsTrigger value="instant">Đặt ngay</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="price-high">Giá cao → thấp</SelectItem>
              <SelectItem value="price-low">Giá thấp → cao</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campsite List */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : filteredCampsites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Chưa có địa điểm nào
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng cách thêm địa điểm cắm trại đầu tiên của bạn
              </p>
              <Button
                onClick={() => setOpenModal(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm địa điểm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCampsites.map(campsite => (
              <Card
                key={campsite._id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative h-48 w-full md:h-auto md:w-64 lg:w-80">
                      <Image
                        src={campsite.images[0] || '/placeholder-campsite.jpg'}
                        alt={campsite.name}
                        fill
                        className="object-cover"
                      />
                      {!campsite.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Badge variant="secondary" className="text-lg">
                            Tạm dừng
                          </Badge>
                        </div>
                      )}
                      {campsite.isInstantBook && campsite.isActive && (
                        <Badge className="absolute top-4 left-4 bg-emerald-600">
                          Đặt ngay
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {campsite.name}
                            </h3>
                            {campsite.tagline && (
                              <p className="mt-1 text-sm text-gray-500">
                                {campsite.tagline}
                              </p>
                            )}
                          </div>

                          <div className="ml-4 flex items-center gap-2">
                            {campsite.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {campsite.rating.average.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({campsite.rating.count})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {PROPERTY_TYPE_LABELS[campsite.propertyType]}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="mr-1 h-3 w-3" />
                            {campsite.capacity.maxGuests} khách
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="line-clamp-1">
                            {campsite.location.address},{' '}
                            {campsite.location.city}, {campsite.location.state}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-gray-500">Lượt xem</p>
                            <p className="mt-1 font-semibold">
                              {campsite.views}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tiện nghi</p>
                            <p className="mt-1 font-semibold">
                              {campsite.amenities.length}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Giá/đêm</p>
                            <p className="mt-1 text-lg font-bold text-emerald-600">
                              {formatPrice(campsite.pricing.basePrice)}{' '}
                              {campsite.pricing.currency}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2 border-t pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(campsite)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            window.open(`/land/${campsite.slug}`, '_blank')
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => confirmDelete(campsite)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <CampsiteFormModal
          isOpen={openModal}
          onClose={handleCloseModal}
          mode={selectedCampsite ? 'edit' : 'create'}
          initialData={selectedCampsite}
          onSubmit={handleSubmit}
          amenities={amenities}
        />
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Xác nhận xóa địa điểm
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {' '}
              {/* ✅ Add asChild */}
              <div className="space-y-2">
                {' '}
                {/* ✅ Change from implicit <p> to <div> */}
                <p>Bạn có chắc chắn muốn xóa địa điểm này không?</p>
                <p className="font-semibold text-gray-900">
                  Hành động này không thể hoàn tác!
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Tất cả thông tin địa điểm sẽ bị xóa vĩnh viễn</li>
                  <li>Các booking liên quan sẽ bị hủy</li>
                  <li>Dữ liệu đánh giá và lượt xem sẽ bị mất</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campsiteToDelete && handleDelete(campsiteToDelete)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa địa điểm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
