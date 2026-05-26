/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  Ban,
  Shield,
  MapPin,
  Building2,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
  MapPinned,
} from "lucide-react";
import { getAllApprovedHosts, blockedUser } from "@/lib/client-actions";

interface ConfirmedHost {
  _id: string;
  email: string;
  username: string;
  full_name?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  locationCount?: number;
  totalBookings?: number;
  totalRevenue?: number;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
  verifiedAt?: string;
  role?: string;
  isBlocked?: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function AdminHostsPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(10);

  const [hostDetailDialog, setHostDetailDialog] = useState<{
    open: boolean;
    host: ConfirmedHost | null;
  }>({ open: false, host: null });

  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    host: ConfirmedHost | null;
  }>({ open: false, host: null });

  const queryClient = useQueryClient();

  const { data: confirmedHosts = [], isLoading: isLoadingHosts } = useQuery<ConfirmedHost[]>({
    queryKey: ["admin-confirmed-hosts"],
    queryFn: async () => {
      const response = await getAllApprovedHosts();
      return (response.data || []) as ConfirmedHost[];
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (hostId: string) => {
      const response = await blockedUser(hostId);
      if (!response.success) throw new Error("Failed to block/unblock");
      return response.data;
    },
    onSuccess: (_, hostId) => {
      const host = confirmedHosts.find(h => h._id === hostId);
      const isBlocked = host?.isBlocked;
      toast.success(isBlocked ? "Đã mở khóa Host thành công" : "Đã khóa Host thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-confirmed-hosts"] });
      setBlockDialog({ open: false, host: null });
      setHostDetailDialog({ open: false, host: null });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi thực hiện thao tác");
    },
  });

  const getFilteredHosts = (data: ConfirmedHost[]) => {
    let filtered = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.username?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term) ||
          item.full_name?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-az":
          return a.username.localeCompare(b.username);
        case "name-za":
          return b.username.localeCompare(a.username);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredHosts = getFilteredHosts(confirmedHosts);
  const displayedData = filteredHosts.slice(0, displayCount);
  const hasMore = displayCount < filteredHosts.length;

  const stats = useMemo(() => {
    const totalHosts = confirmedHosts.length;
    const activeHosts = confirmedHosts.filter(h => !h.isBlocked).length;
    const totalLocations = confirmedHosts.reduce((sum, h) => sum + (h.locationCount || 0), 0);
    const totalRevenue = confirmedHosts.reduce((sum, h) => sum + (h.totalRevenue || 0), 0);
    return {
      totalHosts,
      activeHosts,
      totalLocations,
      totalRevenue,
    };
  }, [confirmedHosts]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenHostDetail = (host: ConfirmedHost) => {
    setHostDetailDialog({ open: true, host });
  };

  const handleBlockHost = (host: ConfirmedHost) => {
    setBlockDialog({ open: true, host });
  };

  const handleConfirmBlock = async () => {
    if (!blockDialog.host) return;
    await blockMutation.mutateAsync(blockDialog.host._id);
  };

  if (isLoadingHosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Quản lý Host hệ thống
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Xem thông tin về host, số lượng địa điểm, tổng doanh thu và quản lý trạng thái hoạt động của host.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/30">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tổng số Host</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalHosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Host đang hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.activeHosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950/30">
                  <MapPin className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tổng địa điểm</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.totalLocations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Doanh thu hệ thống</p>
                  <p className="text-2xl font-bold text-emerald-650 dark:text-emerald-400">{fmt(stats.totalRevenue)}₫</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Danh sách Host ({stats.totalHosts})</h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm kiếm host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="name-az">Tên A-Z</SelectItem>
                <SelectItem value="name-za">Tên Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {filteredHosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Chưa có Host nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Không tìm thấy Host phù hợp với từ khóa"
                  : "Danh sách Host đã hoạt động sẽ hiển thị ở đây"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {displayedData.map((host: ConfirmedHost) => {
                return (
                  <Card
                    key={host._id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-indigo-200"
                    onClick={() => handleOpenHostDetail(host)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={host.avatarUrl} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                              {host.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                                {host.username}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Host
                              </Badge>
                              {host.isBlocked ? (
                                <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30">
                                  <Ban className="w-3 h-3 mr-1" />
                                  Đã khóa
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Hoạt động
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                {host.email}
                              </span>
                              {host.phone && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="hidden sm:flex items-center gap-1 flex-shrink-0">
                                    <Phone className="h-3 w-3" />
                                    {host.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 text-sm text-slate-500">
                          <div>Địa điểm: <strong className="text-slate-700 dark:text-slate-200 font-extrabold">{host.locationCount || 0}</strong></div>
                          <div>Doanh thu: <strong className="text-emerald-600 dark:text-emerald-450 font-extrabold">{fmt(host.totalRevenue || 0)}₫</strong></div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount((prev) => prev + 10)}
                  className="w-full sm:w-auto"
                >
                  Xem thêm ({filteredHosts.length - displayCount} host)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={hostDetailDialog.open}
        onOpenChange={(open) => setHostDetailDialog({ ...hostDetailDialog, open })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Thông tin chi tiết Host</DialogTitle>
            <DialogDescription>Xem đầy đủ thông tin về Host, địa điểm và hoạt động kinh doanh</DialogDescription>
          </DialogHeader>

          {hostDetailDialog.host && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-indigo-100 dark:border-slate-800">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-lg">
                  <AvatarImage src={hostDetailDialog.host.avatarUrl} />
                  <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
                    {hostDetailDialog.host.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-2xl text-gray-900 dark:text-slate-100">{hostDetailDialog.host.username}</h3>
                      {hostDetailDialog.host.full_name && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{hostDetailDialog.host.full_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant="outline"
                          className="bg-indigo-600 text-white border-indigo-750"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Host chính thức
                        </Badge>
                        {hostDetailDialog.host.isBlocked ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Ban className="w-3 h-3 mr-1" />
                            Đã khóa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Activity className="w-3 h-3 mr-1" />
                            Đang hoạt động
                          </Badge>
                        )}
                      </div>
                    </div>
                    {hostDetailDialog.host.rating && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-6 w-6 fill-yellow-600" />
                          <span className="text-2xl font-bold">{hostDetailDialog.host.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Đánh giá trung bình</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900/50 dark:to-slate-900 border-blue-200 dark:border-blue-900/30">
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-10 w-10 mx-auto text-blue-600 mb-2" />
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                      {hostDetailDialog.host.locationCount ?? 0}
                    </p>
                    <p className="text-sm text-blue-700 font-medium dark:text-blue-300">Địa điểm</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-900/50 dark:to-slate-900 border-indigo-200 dark:border-indigo-900/30">
                  <CardContent className="p-4 text-center">
                    <Users className="h-10 w-10 mx-auto text-indigo-600 mb-2" />
                    <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-400">
                      {hostDetailDialog.host.totalBookings || 0}
                    </p>
                    <p className="text-sm text-indigo-700 font-medium dark:text-indigo-300">Đơn đặt chỗ</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-900/50 dark:to-slate-900 border-purple-200 dark:border-purple-900/30">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-10 w-10 mx-auto text-purple-600 mb-2" />
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-400">
                      {fmt(hostDetailDialog.host.totalRevenue || 0)}₫
                    </p>
                    <p className="text-sm text-purple-700 font-medium dark:text-purple-300">Doanh thu</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-900/50 dark:to-slate-900 border-orange-200 dark:border-orange-900/30">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-10 w-10 mx-auto text-orange-600 mb-2" />
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-400">
                      {hostDetailDialog.host.totalBookings && hostDetailDialog.host.locationCount
                        ? ((hostDetailDialog.host.totalBookings / hostDetailDialog.host.locationCount) || 0).toFixed(1)
                        : '0'}
                    </p>
                    <p className="text-sm text-orange-700 font-medium dark:text-orange-300">TB/Địa điểm</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Mail className="h-5 w-5 text-indigo-650" />
                    Thông tin liên hệ
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Email</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-slate-200">{hostDetailDialog.host.email}</span>
                      </div>
                    </div>

                    {hostDetailDialog.host.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Số điện thoại</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-slate-200">{hostDetailDialog.host.phone}</span>
                        </div>
                      </div>
                    )}

                    {hostDetailDialog.host.address && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Địa chỉ</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                          <MapPinned className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-slate-200">{hostDetailDialog.host.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Calendar className="h-5 w-5 text-indigo-650" />
                    Thông tin tài khoản
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Ngày tham gia
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-slate-200">
                          {formatDate(hostDetailDialog.host.createdAt)}
                        </span>
                      </div>
                    </div>

                    {hostDetailDialog.host.verifiedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Ngày xác minh
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm text-gray-900 dark:text-slate-200">
                            {formatDate(hostDetailDialog.host.verifiedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {hostDetailDialog.host.updatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Cập nhật lần cuối
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-slate-200">
                            {formatDate(hostDetailDialog.host.updatedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Vai trò
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-slate-200 uppercase">
                          {hostDetailDialog.host.role || 'HOST'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setHostDetailDialog({ open: false, host: null })}
            >
              Đóng
            </Button>
            {hostDetailDialog.host && (
              <Button
                variant="outline"
                className={hostDetailDialog.host.isBlocked ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200" : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"}
                onClick={() => handleBlockHost(hostDetailDialog.host!)}
              >
                <Ban className="w-4 h-4 mr-2" />
                {hostDetailDialog.host.isBlocked ? "Mở khóa Host" : "Khóa Host"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog({ ...blockDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockDialog.host?.isBlocked ? 'Xác nhận mở khóa Host' : 'Xác nhận khóa Host'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {blockDialog.host?.isBlocked ? 'mở khóa' : 'khóa'} Host{" "}
              <strong>{blockDialog.host?.username}</strong>?
              {!blockDialog.host?.isBlocked && " Host sẽ không thể quản lý các địa điểm của mình khi bị khóa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className={blockDialog.host?.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {blockDialog.host?.isBlocked ? 'Mở khóa' : 'Khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
