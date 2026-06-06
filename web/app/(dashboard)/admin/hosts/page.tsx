/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  CheckCircle,
  Search,
  Mail,
  Phone,
  Calendar,
  Ban,
  Shield,
  MapPin,
  Building2,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
  MapPinned,
  Lock,
  Unlock,
  Tent,
  Clock,
  ChevronRight,
  AlertTriangle,
  Home,
  LayoutGrid,
  Info,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  getAllApprovedHosts,
  blockedUser,
  getHostPropertiesWithSites,
  adminLockProperty,
  adminUnlockProperty,
  adminApprovePropertyUpdate,
  adminLockSite,
  adminUnlockSite,
} from "@/lib/client-actions";

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

interface PropertyWithSites {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive" | "blocked" | "suspended";
  isActive: boolean;
  location: { address: string; city: string; state: string };
  photos?: Array<{ url: string; isCover: boolean }>;
  stats?: { totalBookings: number; averageRating: number; totalReviews: number };
  propertyType: string;
  createdAt: string;
  sites: SiteInfo[];
}

interface SiteInfo {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive" | "blocked" | "suspended";
  isActive: boolean;
  accommodationType: string;
  pricing?: { basePrice: number };
  capacity?: { maxGuests: number };
  stats?: { totalBookings: number; averageRating: number };
  photos?: Array<{ url: string; isCover: boolean }>;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const STATUS_CONFIG = {
  active: { label: "Hoạt động", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  inactive: { label: "Tạm ẩn", color: "bg-slate-50 text-slate-600 border-slate-200", icon: Clock },
  blocked: { label: "Đã khóa", color: "bg-red-50 text-red-700 border-red-200", icon: Lock },
  suspended: { label: "Đã khóa", color: "bg-red-50 text-red-700 border-red-200", icon: Lock },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.inactive;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function AdminHostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHost, setSelectedHost] = useState<ConfirmedHost | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  // Lock dialogs
  const [lockDialog, setLockDialog] = useState<{
    open: boolean; type: "property" | "site"; id: string; name: string; propertyName?: string;
  } | null>(null);
  const [lockReason, setLockReason] = useState("");

  // Block user dialog
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; host: ConfirmedHost | null }>({
    open: false, host: null,
  });

  // Approve dialog
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean; type: "property" | "site"; id: string; name: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // ---- Queries ----
  const { data: confirmedHosts = [], isLoading: isLoadingHosts } = useQuery<ConfirmedHost[]>({
    queryKey: ["admin-confirmed-hosts"],
    queryFn: async () => {
      const response = await getAllApprovedHosts();
      return (response.data || []) as ConfirmedHost[];
    },
  });

  const { data: hostProperties = [], isLoading: isLoadingProperties, refetch: refetchProperties } = useQuery<PropertyWithSites[]>({
    queryKey: ["admin-host-properties", selectedHost?._id],
    queryFn: async () => {
      if (!selectedHost) return [];
      const res = await getHostPropertiesWithSites(selectedHost._id);
      return (res.data || []) as PropertyWithSites[];
    },
    enabled: !!selectedHost,
  });

  // ---- Mutations ----
  const blockMutation = useMutation({
    mutationFn: (hostId: string) => blockedUser(hostId),
    onSuccess: (_, hostId) => {
      const host = confirmedHosts.find((h) => h._id === hostId);
      toast.success(host?.isBlocked ? "Đã mở khóa Host" : "Đã khóa Host");
      queryClient.invalidateQueries({ queryKey: ["admin-confirmed-hosts"] });
      setBlockDialog({ open: false, host: null });
    },
    onError: () => toast.error("Có lỗi xảy ra"),
  });

  const lockPropertyMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminLockProperty(id, reason),
    onSuccess: () => {
      toast.success("Đã khóa property thành công");
      refetchProperties();
      setLockDialog(null);
      setLockReason("");
    },
    onError: () => toast.error("Có lỗi xảy ra khi khóa property"),
  });

  const unlockPropertyMutation = useMutation({
    mutationFn: (id: string) => adminUnlockProperty(id),
    onSuccess: () => {
      toast.success("Đã mở khóa property thành công");
      refetchProperties();
    },
    onError: () => toast.error("Có lỗi xảy ra khi mở khóa property"),
  });

  const approvePropertyMutation = useMutation({
    mutationFn: (id: string) => adminApprovePropertyUpdate(id),
    onSuccess: () => {
      toast.success("Đã duyệt và mở khóa property");
      refetchProperties();
      setApproveDialog(null);
    },
    onError: () => toast.error("Có lỗi khi duyệt property"),
  });

  const lockSiteMutation = useMutation({
    mutationFn: ({ id, reason, propertyName }: { id: string; reason: string; propertyName?: string }) =>
      adminLockSite(id, reason, propertyName),
    onSuccess: () => {
      toast.success("Đã khóa site thành công");
      refetchProperties();
      setLockDialog(null);
      setLockReason("");
    },
    onError: () => toast.error("Có lỗi xảy ra khi khóa site"),
  });

  const unlockSiteMutation = useMutation({
    mutationFn: ({ id, propertyName }: { id: string; propertyName?: string }) =>
      adminUnlockSite(id, propertyName),
    onSuccess: () => {
      toast.success("Đã mở khóa site thành công");
      refetchProperties();
    },
    onError: () => toast.error("Có lỗi xảy ra khi mở khóa site"),
  });

  // ---- Helpers ----
  const filteredHosts = useMemo(() => {
    if (!searchTerm) return confirmedHosts;
    const term = searchTerm.toLowerCase();
    return confirmedHosts.filter(
      (h) =>
        h.username?.toLowerCase().includes(term) ||
        h.email?.toLowerCase().includes(term) ||
        h.phone?.toLowerCase().includes(term)
    );
  }, [confirmedHosts, searchTerm]);

  const stats = useMemo(() => ({
    total: confirmedHosts.length,
    active: confirmedHosts.filter((h) => !h.isBlocked).length,
    totalLocations: confirmedHosts.reduce((s, h) => s + (h.locationCount || 0), 0),
    totalRevenue: confirmedHosts.reduce((s, h) => s + (h.totalRevenue || 0), 0),
  }), [confirmedHosts]);

  const pendingCount = 0;

  const handleLockConfirm = useCallback(() => {
    if (!lockDialog || !lockReason.trim()) return;
    if (lockDialog.type === "property") {
      lockPropertyMutation.mutate({ id: lockDialog.id, reason: lockReason });
    } else {
      lockSiteMutation.mutate({ id: lockDialog.id, reason: lockReason, propertyName: lockDialog.propertyName });
    }
  }, [lockDialog, lockReason, lockPropertyMutation, lockSiteMutation]);

  const handleSelectHost = (host: ConfirmedHost) => {
    setSelectedHost(host);
    setActiveTab("info");
  };

  if (isLoadingHosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {/* Header + Stats */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">
          Quản lý Host & Địa điểm
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Xem thông tin host, quản lý property và site, khóa/mở khi vi phạm.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng Host", value: stats.total, icon: Shield, color: "text-primary bg-primary/10" },
          { label: "Đang hoạt động", value: stats.active, icon: Activity, color: "text-emerald-600 bg-emerald-50" },
          { label: "Địa điểm", value: stats.totalLocations, icon: MapPin, color: "text-amber-600 bg-amber-50" },
          { label: "Doanh thu", value: `${fmt(stats.totalRevenue)}₫`, icon: DollarSign, color: "text-primary bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Split View */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* LEFT: Host list */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredHosts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy host</div>
            ) : (
              filteredHosts.map((host) => (
                <button
                  key={host._id}
                  onClick={() => handleSelectHost(host)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedHost?._id === host._id
                      ? "bg-primary/10 border-primary/20 shadow-sm text-primary"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={host.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {host.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-slate-800 truncate">{host.username}</span>
                        {host.isBlocked && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" title="Đã khóa tài khoản" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{host.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-600">{host.locationCount || 0}</p>
                      <p className="text-[10px] text-slate-400">địa điểm</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        <div className="flex-1 min-w-0">
          {!selectedHost ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Eye className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm">Chọn một host để xem chi tiết</p>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-3 overflow-hidden">
              {/* Host header */}
              <Card className="border-0 shadow-sm flex-shrink-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={selectedHost.avatarUrl} />
                      <AvatarFallback className="bg-primary text-white text-xl font-bold">
                        {selectedHost.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-lg text-slate-800">{selectedHost.username}</h2>
                        <Badge variant="outline" className="text-xs bg-primary text-white border-primary">
                          <Shield className="w-3 h-3 mr-1" /> Host
                        </Badge>
                        {selectedHost.isBlocked ? (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            <Ban className="w-3 h-3 mr-1" /> Tài khoản bị khóa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Activity className="w-3 h-3 mr-1" /> Đang hoạt động
                          </Badge>
                        )}
                        {/* pendingCount removed */}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{selectedHost.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBlockDialog({ open: true, host: selectedHost })}
                        className={selectedHost.isBlocked
                          ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          : "text-red-700 border-red-200 hover:bg-red-50"
                        }
                      >
                        {selectedHost.isBlocked ? (
                          <><Unlock className="w-4 h-4 mr-1.5" /> Mở khóa TK</>
                        ) : (
                          <><Ban className="w-4 h-4 mr-1.5" /> Khóa TK</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex-shrink-0 w-fit">
                  <TabsTrigger value="info" className="gap-1.5 text-xs">
                    <Info className="w-3.5 h-3.5" /> Thông tin
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="gap-1.5 text-xs">
                    <Home className="w-3.5 h-3.5" /> Properties
                  </TabsTrigger>
                  <TabsTrigger value="sites" className="gap-1.5 text-xs">
                    <Tent className="w-3.5 h-3.5" /> Sites
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Thông tin */}
                <TabsContent value="info" className="flex-1 overflow-y-auto mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Stats */}
                    {[
                      { label: "Địa điểm", value: selectedHost.locationCount ?? 0, icon: Building2, color: "text-primary bg-primary/10" },
                      { label: "Đơn đặt chỗ", value: selectedHost.totalBookings || 0, icon: Users, color: "text-primary bg-primary/10" },
                      { label: "Doanh thu", value: `${fmt(selectedHost.totalRevenue || 0)}₫`, icon: DollarSign, color: "text-primary bg-primary/10" },
                      { label: "Đánh giá TB", value: selectedHost.rating ? selectedHost.rating.toFixed(1) + "⭐" : "—", icon: Star, color: "text-amber-600 bg-amber-50" },
                    ].map((s) => (
                      <Card key={s.label} className="border shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg ${s.color} flex items-center justify-center`}>
                            <s.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">{s.label}</p>
                            <p className="font-bold text-slate-800">{s.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Card className="border shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" /> Liên hệ
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {selectedHost.email}
                          </div>
                          {selectedHost.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {selectedHost.phone}
                            </div>
                          )}
                          {selectedHost.address && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPinned className="w-3.5 h-3.5 text-slate-400" />
                              {selectedHost.address}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" /> Tài khoản
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Tham gia: {fmtDate(selectedHost.createdAt)}
                          </div>
                          {selectedHost.verifiedAt && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Xác minh: {fmtDate(selectedHost.verifiedAt)}
                            </div>
                          )}
                          {selectedHost.rating && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              Rating: {selectedHost.rating.toFixed(1)}/5.0
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* TAB: Properties */}
                <TabsContent value="properties" className="flex-1 overflow-y-auto mt-3">
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : hostProperties.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm">Host chưa có property nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hostProperties.map((property) => {
                        const coverPhoto = property.photos?.find((p) => p.isCover) || property.photos?.[0];
                        const isBlocked = property.status === "blocked" || property.status === "suspended";
                        return (
                          <Card key={property._id} className={`border shadow-sm transition-all ${isBlocked ? "border-red-100" : ""}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                  {coverPhoto ? (
                                    <img src={coverPhoto.url} alt={property.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Building2 className="w-6 h-6 text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h3 className="font-semibold text-sm text-slate-800 truncate">{property.name}</h3>
                                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {property.location?.city}, {property.location?.state}
                                      </p>
                                    </div>
                                    <StatusBadge status={property.status} />
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Tent className="w-3 h-3" /> {property.sites?.length || 0} sites
                                    </span>
                                    {property.stats?.totalBookings !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> {property.stats.totalBookings} đặt chỗ
                                      </span>
                                    )}
                                    {property.stats?.averageRating ? (
                                      <span className="flex items-center gap-1 text-amber-600">
                                        <Star className="w-3 h-3 fill-amber-400" /> {property.stats.averageRating.toFixed(1)}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2 mt-3">
                                    {isBlocked ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        onClick={() => unlockPropertyMutation.mutate(property._id)}
                                        disabled={unlockPropertyMutation.isPending}
                                      >
                                        <Unlock className="w-3 h-3 mr-1" /> Mở khóa
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                        onClick={() => {
                                          setLockReason("");
                                          setLockDialog({ open: true, type: "property", id: property._id, name: property.name });
                                        }}
                                      >
                                        <Lock className="w-3 h-3 mr-1" /> Khóa
                                      </Button>
                                    )}
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                      {fmtDate(property.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Sites */}
                <TabsContent value="sites" className="flex-1 overflow-y-auto mt-3">
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : hostProperties.flatMap((p) => p.sites).length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Tent className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm">Host chưa có site nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostProperties.map((property) =>
                        property.sites?.length > 0 ? (
                          <div key={property._id}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                                <Building2 className="w-4 h-4 text-primary" />
                                {property.name}
                              </div>
                              <StatusBadge status={property.status} />
                              <span className="text-xs text-slate-400">{property.sites.length} sites</span>
                            </div>
                            <div className="space-y-2 pl-5 border-l-2 border-slate-100">
                              {property.sites.map((site) => {
                                const siteCover = site.photos?.find((p) => p.isCover) || site.photos?.[0];
                                const isSiteBlocked = site.status === "blocked" || site.status === "suspended";
                                return (
                                  <Card key={site._id} className={`border shadow-sm ${isSiteBlocked ? "border-red-100" : ""}`}>
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                          {siteCover ? (
                                            <img src={siteCover.url} alt={site.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Tent className="w-4 h-4 text-slate-300" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-800 truncate">{site.name}</span>
                                            <StatusBadge status={site.status} />
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span>{site.accommodationType}</span>
                                            {site.pricing?.basePrice && (
                                              <span className="text-emerald-600 font-medium">{fmt(site.pricing.basePrice)}₫/đêm</span>
                                            )}
                                            {site.capacity?.maxGuests && (
                                              <span>{site.capacity.maxGuests} khách</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {isSiteBlocked ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                              onClick={() => unlockSiteMutation.mutate({ id: site._id, propertyName: property.name })}
                                              disabled={unlockSiteMutation.isPending}
                                            >
                                              <Unlock className="w-3 h-3 mr-1" /> Mở khóa
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                              onClick={() => {
                                                setLockReason("");
                                                setLockDialog({ open: true, type: "site", id: site._id, name: site.name, propertyName: property.name });
                                              }}
                                            >
                                              <Lock className="w-3 h-3 mr-1" /> Khóa
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Lock Property/Site with reason */}
      <Dialog open={!!lockDialog} onOpenChange={(o) => !o && setLockDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Lock className="w-5 h-5" />
              Khóa {lockDialog?.type === "property" ? "Property" : "Site"}
            </DialogTitle>
            <DialogDescription>
              Bạn đang khóa <strong>{lockDialog?.name}</strong>. Host sẽ nhận được thông báo và không thể hiển thị đến khách.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lock-reason" className="text-sm font-medium">
                Lý do khóa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="lock-reason"
                placeholder="Ví dụ: Nội dung vi phạm chính sách, hình ảnh không phù hợp..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                          Sau khi bị khóa, chỉ có Admin mới có quyền mở khóa để chuyển trạng thái từ Đã khóa sang Hoạt động.
                                        </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLockDialog(null)}>Hủy</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLockConfirm}
              disabled={!lockReason.trim() || lockPropertyMutation.isPending || lockSiteMutation.isPending}
            >
              <Lock className="w-4 h-4 mr-1.5" />
              {lockPropertyMutation.isPending || lockSiteMutation.isPending ? "Đang xử lý..." : "Xác nhận khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve pending changes dialog removed */}

      {/* Dialog: Block/Unblock host account */}
      <AlertDialog open={blockDialog.open} onOpenChange={(o) => setBlockDialog({ ...blockDialog, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockDialog.host?.isBlocked ? "Mở khóa tài khoản Host?" : "Khóa tài khoản Host?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockDialog.host?.isBlocked
                ? `Mở khóa tài khoản cho host ${blockDialog.host?.username}. Host có thể đăng nhập và quản lý địa điểm bình thường.`
                : `Khóa tài khoản host ${blockDialog.host?.username}. Host sẽ không thể đăng nhập và quản lý địa điểm.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={blockDialog.host?.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              onClick={() => blockDialog.host && blockMutation.mutate(blockDialog.host._id)}
            >
              {blockDialog.host?.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
