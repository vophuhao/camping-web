/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteProperty, getMyProperties } from '@/lib/client-actions';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Eye,
  Filter,
  Grid3x3,
  Home,
  List,
  MapPin,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  X,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  const { data: properties, isLoading, refetch } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const response = await getMyProperties();
      return response.data.properties;
    },
  });

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteProperty(propertyToDelete);
      toast.success('Xóa property thành công!');
      refetch();
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa property');
    }
  };

  const filteredProperties = properties?.filter((property: any) => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: properties?.length || 0,
    active: properties?.filter((p: any) => p.status === 'active').length || 0,
    totalSites: properties?.reduce((sum: number, p: any) => sum + (p.stats?.totalSites || 0), 0) || 0,
    totalBookings: properties?.reduce((sum: number, p: any) => sum + (p.stats?.totalBookings || 0), 0) || 0,
  };

  const statusConfig: any = {
    active: { label: 'Hoạt động', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '✓' },
    inactive: { label: 'Không hoạt động', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: '◯' },
    pending_approval: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⏳' },
    suspended: { label: 'Tạm ngưng', color: 'bg-red-100 text-red-800 border-red-300', icon: '⊗' },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Khu cắm trại</h1>

            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => router.push('/host/properties/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm khu mới
            </Button>
          </div>

          {/* Quick Stats */}
          {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-slate-600 font-medium">Tổng khu</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-slate-600 font-medium">Hoạt động</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-slate-600 font-medium">Địa điểm</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalSites}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-slate-600 font-medium">Bookings</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalBookings}</p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 p-6">
        {/* Sidebar Filters */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Bộ lọc</h3>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                  <SelectItem value="suspended">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
              {[
                { label: 'Tất cả', count: stats.total, color: 'from-slate-500 to-slate-600' },
                { label: 'Hoạt động', count: stats.active, color: 'from-emerald-500 to-emerald-600' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setStatusFilter(item.label === 'Tất cả' ? 'all' : 'active')}
                  className="w-full text-left text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">{item.label}</span>
                    <span className={`text-xs font-bold bg-gradient-to-r ${item.color} text-white px-2 py-1 rounded`}>
                      {item.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 min-w-0">
          {/* Search & View Controls */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm khu cắm trại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 h-10 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-605' : 'text-slate-600 hover:text-slate-900'}`}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-605' : 'text-slate-600 hover:text-slate-900'}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Empty State */}
          {!filteredProperties || filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                <Home className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {searchQuery || statusFilter !== 'all' ? 'Không tìm thấy khu nào' : 'Chưa có khu cắm trại nào'}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {searchQuery || statusFilter !== 'all' ? 'Thử thay đổi bộ lọc' : 'Tạo khu cắm trại đầu tiên'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => router.push('/host/properties/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo khu mới
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((property: any) => (
                <PropertyGridCard
                  key={property._id}
                  property={property}
                  statusConfig={statusConfig}
                  onEdit={(id: string) => router.push(`/host/properties/${id}`)}
                  onViewSites={(id: string) => router.push(`/host/properties/${id}/sites`)}
                  onAddSite={(id: string) => router.push(`/host/properties/${id}/sites/new`)}
                  onDelete={(id: string) => {
                    setPropertyToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Khu cắm trại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Địa điểm</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">Sites</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">Bookings</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">Đánh giá</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredProperties.map((property: any) => (
                      <PropertyListRow
                        key={property._id}
                        property={property}
                        statusConfig={statusConfig}
                        onEdit={(id: string) => router.push(`/host/properties/${id}`)}
                        onViewSites={(id: string) => router.push(`/host/properties/${id}/sites`)}
                        onAddSite={(id: string) => router.push(`/host/properties/${id}/sites/new`)}
                        onDelete={(id: string) => {
                          setPropertyToDelete(id);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khu cắm trại?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Khu chỉ có thể xóa khi không còn site nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Grid Card Component
function PropertyGridCard({ property, statusConfig, onEdit, onViewSites, onAddSite, onDelete }: any) {
  const config = statusConfig[property.status] || statusConfig.inactive;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
        <Image
          src={property.photos?.[0]?.url || '/placeholder.jpg'}
          alt={property.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge className={`${config.color} border text-xs font-semibold`}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
          {property.name}
        </h3>
        <div className="flex items-start gap-1 text-sm text-slate-600 mb-3 line-clamp-1">
          <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-indigo-600" />
          <span className="line-clamp-1">{property.location?.city}, {property.location?.state}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-600">Sites</p>
            <p className="text-lg font-bold text-indigo-600">{property.stats?.totalSites || 0}</p>
          </div>
          <div className="text-center border-l border-r border-slate-200">
            <p className="text-xs text-slate-600">Bookings</p>
            <p className="text-lg font-bold text-blue-600">{property.stats?.totalBookings || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600">Rating</p>
            <p className="text-lg font-bold text-amber-600">{property.stats?.averageRating?.toFixed(1) || '0'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-4 border-t border-slate-200">
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => onViewSites(property._id)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Sites
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="border-slate-200">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg">
              <DropdownMenuItem onClick={() => onEdit(property._id)} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSite(property._id)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Thêm site
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(property._id)} className="cursor-pointer text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// List Row Component
function PropertyListRow({ property, statusConfig, onEdit, onViewSites, onAddSite, onDelete }: any) {
  const config = statusConfig[property.status] || statusConfig.inactive;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
            <Image
              src={property.photos?.[0]?.url || '/placeholder.jpg'}
              alt={property.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{property.name}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-indigo-600" />
          {property.location?.city}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
          {property.stats?.totalSites || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
          {property.stats?.totalBookings || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="font-semibold text-slate-900 text-sm">
            {property.stats?.averageRating?.toFixed(1) || '0'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge className={`${config.color} border text-xs font-semibold`}>
          {config.label}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onViewSites(property._id)}
            title="View sites"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg">
              <DropdownMenuItem onClick={() => onEdit(property._id)} className="cursor-pointer text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSite(property._id)} className="cursor-pointer text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm site
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(property._id)} className="cursor-pointer text-red-600 text-sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
