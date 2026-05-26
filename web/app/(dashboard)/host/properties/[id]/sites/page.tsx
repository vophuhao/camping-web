/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  ArrowLeft,
  Settings,
  Eye,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  DollarSign,
  Users,
  Car,
  Calendar,
  Home,
  Tent,
  MapPin,
  Star,
  Map as MapIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getPropertyById,
  deleteSite,
  getSitesByProperty,
} from '@/lib/client-actions';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import SiteMap
const SiteMap = dynamic(
  () => import('@/components/property/site-map').then(mod => mod.SiteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
          <p className="text-sm text-gray-500">Đang tải bản đồ...</p>
        </div>
      </div>
    ),
  },
);

export default function PropertySitesPage() {
  const params = useParams() as any;
  const router = useRouter();
  const propertyId = params?.id ?? params?.propertyId;

  const [property, setProperty] = useState<any | null>(null);
  const [sites, setSites] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Map states
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [hoveredSite, setHoveredSite] = useState<any | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let mounted = true;

    setLoading(true);
    (async () => {
      try {
        const p = await getPropertyById(propertyId);
        if (mounted && p?.success) setProperty(p.data ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [propertyId]);

  const fetchSites = async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await getSitesByProperty(propertyId);

      if (res?.success) setSites(res.data.sites ?? []);
      else setSites([]);
    } catch (err) {
      console.error(err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleDeleteSite = async () => {
    if (!siteToDelete || !propertyId) return;
    try {
      await deleteSite(propertyId, siteToDelete.id);
      toast.success(`Đã xóa site "${siteToDelete.name}" thành công!`);
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
      await fetchSites();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Có lỗi xảy ra khi xóa site');
    }
  };

  const filteredSites = useMemo(() => {
    if (!sites) return [];
    return sites.filter(site => {
      const matchesSearch =
        !searchQuery ||
        (site.name ?? '')
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        site.bookingSettings?.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || site.accommodationType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [sites, searchQuery, statusFilter, typeFilter]);

  const statusConfig = {
    available: {
      label: 'Sẵn sàng',
      color: 'bg-green-100 text-green-800 border-green-200',
      dot: 'bg-green-500',
    },
    unavailable: {
      label: 'Không khả dụng',
      color: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-500',
    },
    maintenance: {
      label: 'Bảo trì',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
    },
  };

  const siteTypeLabels: any = {
    tent: 'Tent Site',
    rv: 'RV Site',
    cabin: 'Cabin',
    glamping: 'Glamping',
    group: 'Group Site',
    yurt: 'Yurt',
    treehouse: 'Treehouse',
    vehicle: 'Vehicle',
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!sites) return null;
    const totalSites = sites.length;
    const activeSites = sites.filter(s => s.isActive).length;
    const availableSites = sites.filter(
      s => s.bookingSettings?.status === 'available',
    ).length;
    const totalRevenue = sites.reduce(
      (sum, s) => sum + (s.stats?.totalRevenue || 0),
      0,
    );
    const totalBookings = sites.reduce(
      (sum, s) => sum + (s.stats?.totalBookings || 0),
      0,
    );

    return {
      totalSites,
      activeSites,
      availableSites,
      totalRevenue,
      totalBookings,
    };
  }, [sites]);

  // Full site card for list view
  const renderFullSiteCard = (site: any) => {
    const statusKey = (site.bookingSettings?.status ??
      'available') as keyof typeof statusConfig;
    const status = statusConfig[statusKey] || statusConfig.available;

    return (
      <Card
        key={site._id}
        className={`overflow-hidden rounded-2xl transition-all duration-300 border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md ${selectedSite?._id === site._id
          ? 'shadow-lg ring-2 ring-emerald-500 translate-y-0'
          : 'shadow-sm hover:shadow-xl hover:-translate-y-1'
          }`}
        onMouseEnter={() => setHoveredSite(site)}
        onMouseLeave={() => setHoveredSite(null)}
        onClick={() => setSelectedSite(site)}
      >
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="relative h-56 w-full flex-shrink-0 bg-gray-100 lg:h-auto lg:w-80">
            <Image
              src={site.photos?.[0]?.url || '/placeholder.jpg'}
              alt={site.name}
              fill
              className="object-cover"
              unoptimized
            />

            {/* Badges on Image */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <Badge variant="secondary" className="shadow-lg">
                {siteTypeLabels[site.accommodationType] ??
                  site.accommodationType ??
                  'Site'}
              </Badge>
              {site.bookingSettings?.instantBook && (
                <Badge className="bg-orange-600 shadow-lg">
                  ⚡ Instant Book
                </Badge>
              )}
            </div>

            <div className="absolute right-3 top-3">
              <Badge className={`${status.color} border shadow-lg`}>
                <div
                  className={`mr-1.5 h-2 w-2 rounded-full ${status.dot}`}
                />
                {status.label}
              </Badge>
            </div>

            {site.photos && site.photos.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                +{site.photos.length - 1} ảnh
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              {/* Title & Stats Row */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {site.name}
                  </h3>
                  {/* {site.stats?.averageRating && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {site.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({site.stats.totalReviews || 0} đánh giá)
                      </span>
                    </div>
                  )} */}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        router.push(
                          `/host/properties/${propertyId}/sites/${site._id}`,
                        );
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        router.push(
                          `/host/properties/${propertyId}/sites/${site._id}/edit`,
                        );
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        setSiteToDelete({
                          id: site._id,
                          name: site.name,
                        });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa site
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                {site.description}
              </p>

              {/* Capacity Grid */}
              <div className="mb-4 grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Khách</p>
                  <p className="font-semibold text-gray-900">
                    {site.capacity?.maxGuests || 0}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <Car className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Xe</p>
                  <p className="font-semibold text-gray-900">
                    {site.capacity?.maxVehicles || 0}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <Tent className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Lều</p>
                  <p className="font-semibold text-gray-900">
                    {site.capacity?.maxTents ?? '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <Calendar className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Bookings</p>
                  <p className="font-semibold text-gray-900">
                    {site.stats?.totalBookings || 0}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              {/* {site.stats && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        notation: 'compact',
                      }).format(site.stats.totalRevenue || 0)}
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    {site.stats.upcomingBookings || 0} booking sắp tới
                  </span>
                </div>
              )} */}
            </div>

            <Separator className="my-4" />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Giá/đêm</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(site.pricing?.basePrice || 0)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/host/properties/${propertyId}/sites/${site._id}`}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Link>
                </Button>

                <Button size="sm" asChild>
                  <Link
                    href={`/host/properties/${propertyId}/sites/${site._id}`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Compact site card for map view
  const renderCompactSiteCard = (site: any) => {
    const statusKey = (site.bookingSettings?.status ??
      'available') as keyof typeof statusConfig;
    const status = statusConfig[statusKey] || statusConfig.available;

    return (
      <Card
        key={site._id}
        className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md ${selectedSite?._id === site._id
          ? 'shadow-md ring-2 ring-emerald-500 translate-y-0'
          : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
          }`}
        onMouseEnter={() => setHoveredSite(site)}
        onMouseLeave={() => setHoveredSite(null)}
        onClick={() => setSelectedSite(site)}
      >
        <div className="flex gap-3 p-3">
          {/* Compact Image */}
          <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={site.photos?.[0]?.url || '/placeholder.jpg'}
              alt={site.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
            {site.photos && site.photos.length > 1 && (
              <div className="absolute bottom-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                +{site.photos.length - 1}
              </div>
            )}
          </div>

          {/* Compact Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-gray-900">
                  {site.name}
                </h4>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
                  <Badge variant="secondary" className="text-xs">
                    {siteTypeLabels[site.accommodationType] ??
                      site.accommodationType}
                  </Badge>
                  <Badge className={`${status.color} border text-xs`}>
                    <div
                      className={`mr-1 h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      router.push(
                        `/host/properties/${propertyId}/sites/${site._id}`,
                      );
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      router.push(
                        `/host/properties/${propertyId}/sites/${site._id}/edit`,
                      );
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      setSiteToDelete({
                        id: site._id,
                        name: site.name,
                      });
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa site
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Compact Stats */}
            <div className="mt-auto flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {site.capacity?.maxGuests || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {site.capacity?.maxVehicles || 0}
                </span>
                {site.stats?.averageRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {site.stats.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="font-semibold text-emerald-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  notation: 'compact',
                }).format(site.pricing?.basePrice || 0)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading && sites === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900/50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Link
                href="/host/properties"
                className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách
              </Link>

              {property && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
                      <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {property.name}
                      </h1>
                      {/* <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {property.location?.city}, {property.location?.state}
                        </span>
                        {property.stats?.averageRating && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {property.stats.averageRating.toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}
                      </div> */}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl px-5 shadow-md shadow-emerald-500/20 dark:shadow-none hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              onClick={() =>
                router.push(`/host/properties/${propertyId}/sites/new`)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Site mới
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}


        {/* Filters */}
        <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên site..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Tent className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="tent">Tent Site</SelectItem>
                    <SelectItem value="rv">RV Site</SelectItem>
                    <SelectItem value="cabin">Cabin</SelectItem>
                    <SelectItem value="glamping">Glamping</SelectItem>
                    <SelectItem value="group">Group Site</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="available">Sẵn sàng</SelectItem>
                    <SelectItem value="unavailable">Không khả dụng</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <Tent className="h-4 w-4" />
                    Danh sách
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-2">
                    <MapIcon className="h-4 w-4" />
                    Bản đồ
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Content - List or Map View */}
        {viewMode === 'list' ? (
          // List View - Full cards
          filteredSites && filteredSites.length > 0 ? (
            <div className="space-y-4">
              {filteredSites.map(site => renderFullSiteCard(site))}
            </div>
          ) : (
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
              <CardContent className="py-16 text-center">
                <Tent className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {searchQuery ||
                    statusFilter !== 'all' ||
                    typeFilter !== 'all'
                    ? 'Không tìm thấy site nào'
                    : 'Chưa có site nào'}
                </h3>
                <p className="mb-6 text-sm text-gray-600">
                  {searchQuery ||
                    statusFilter !== 'all' ||
                    typeFilter !== 'all'
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Bắt đầu bằng cách tạo site đầu tiên cho property này'}
                </p>
                {!searchQuery &&
                  statusFilter === 'all' &&
                  typeFilter === 'all' && (
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl px-5 shadow-md shadow-emerald-500/20 dark:shadow-none hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      onClick={() =>
                        router.push(`/host/properties/${propertyId}/sites/new`)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo Site mới
                    </Button>
                  )}
              </CardContent>
            </Card>
          )
        ) : (
          // Map View - Split layout with compact cards
          <div className="flex min-h-0 gap-6">
            {/* Sites List - Scrollable with compact cards */}
            <div className="w-2/5 min-w-0">
              <div className="h-[calc(100vh-400px)] min-h-[600px] space-y-3 overflow-y-auto pr-4">
                {filteredSites && filteredSites.length > 0 ? (
                  filteredSites.map(site => renderCompactSiteCard(site))
                ) : (
                  <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                    <CardContent className="py-16 text-center">
                      <Tent className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        Không tìm thấy site nào
                      </h3>
                      <p className="text-sm text-gray-600">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Map - Fixed */}
            <div className="w-3/5 min-w-0">
              <div className="sticky top-24 h-[calc(100vh-400px)] min-h-[600px] overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
                {property && filteredSites && (
                  <SiteMap
                    sites={filteredSites}
                    property={property}
                    selectedSite={selectedSite}
                    hoveredSite={hoveredSite}
                    onSiteSelect={setSelectedSite}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa site</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa site{' '}
              <span className="font-semibold">
                &quot;{siteToDelete?.name}&quot;
              </span>
              ? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên
              quan (bookings, reviews, ...).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}