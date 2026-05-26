/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Package,
  ShoppingCart,
  Home,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/client-actions";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardPage() {
  // Fetch all dashboard data
  const { data: overviewStats, isLoading: loadingOverview } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const response = await getDashboardStats("overview");
      return response.data;
    },
  });

  const { data: revenueStats, isLoading: loadingRevenue } = useQuery({
    queryKey: ["admin-dashboard-revenue"],
    queryFn: async () => {
      const response = await getDashboardStats("revenue");
      return response.data;
    },
  });

  const { data: bookingStats, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin-dashboard-bookings"],
    queryFn: async () => {
      const response = await getDashboardStats("bookings");
      return response.data;
    },
  });

  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-dashboard-orders"],
    queryFn: async () => {
      const response = await getDashboardStats("orders");
      return response.data;
    },
  });

  const { data: topProperties, isLoading: loadingProperties } = useQuery({
    queryKey: ["admin-dashboard-top-properties"],
    queryFn: async () => {
      const response = await getDashboardStats("top-properties");
      return response.data;
    },
  });

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-dashboard-top-products"],
    queryFn: async () => {
      const response = await getDashboardStats("top-products");
      return response.data;
    },
  });

  const { data: topHosts, isLoading: loadingHosts } = useQuery({
    queryKey: ["admin-dashboard-top-hosts"],
    queryFn: async () => {
      const response = await getDashboardStats("top-hosts");
      return response.data;
    },
  });


  const { data: growthStats, isLoading: loadingGrowth } = useQuery({
    queryKey: ["admin-dashboard-growth"],
    queryFn: async () => {
      const response = await getDashboardStats("growth");
      return response.data;
    },
  });

  const { data: adminBookingStats, isLoading: loadingAdminBookingStats } = useQuery({
    queryKey: ["admin-booking-stats-extended"],
    queryFn: async () => {
      const response: any = await apiClient.get('/bookings/admin/stats');
      return response.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const getGrowthBadge = (growth: number) => {
    if (growth > 0) {
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-1 w-fit shadow-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          +{growth.toFixed(1)}%
        </Badge>
      );
    } else if (growth < 0) {
      return (
        <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 flex items-center gap-1 w-fit shadow-xs">
          <TrendingDown className="w-3.5 h-3.5" />
          {growth.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200/60 dark:border-slate-800">
        0%
      </Badge>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl text-xs space-y-2 text-slate-200">
          <p className="font-bold text-slate-400 border-b border-slate-800/80 pb-1.5 mb-1">{label}</p>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 justify-between min-w-[140px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }} />
                <span className="text-slate-300">{pld.name}:</span>
              </span>
              <span className="font-extrabold text-white">{formatCurrency(pld.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="font-semibold text-slate-300">{item._id || item.name}:</span>
            <span className="font-extrabold text-white ml-2">{item.count || item.value} đơn vị</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const isLoading =
    loadingOverview ||
    loadingRevenue ||
    loadingBookings ||
    loadingOrders ||
    loadingProperties ||
    loadingProducts ||
    loadingHosts ||
    loadingGrowth ||
    loadingAdminBookingStats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <div className="absolute h-6 w-6 animate-ping rounded-full border border-indigo-500/20"></div>
        </div>
      </div>
    );
  }

  // Calculate total bookings from status stats
  const totalBookingsCount = adminBookingStats?.statusStats?.reduce((s: number, x: any) => s + x.count, 0) || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Typography Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Hệ thống quản trị Campo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Báo cáo chi tiết hiệu suất kinh doanh, hoạt động booking và tổng số liệu vận hành.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-xs flex items-center gap-2.5 w-fit">
          <Clock className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {new Date().toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" })}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Tổng người dùng
              </p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatNumber(overviewStats?.users?.total || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-slate-400">Hosts: </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{overviewStats?.users?.hosts || 0}</span>
              </div>
              <div>
                <span className="text-slate-400">Guests: </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{overviewStats?.users?.guests || 0}</span>
              </div>
            </div>
            {growthStats?.users && getGrowthBadge(growthStats.users.growth)}
          </div>
        </Card>

        {/* Revenue Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]">
                {formatCurrency(overviewStats?.revenue?.total || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex gap-3 text-[11px] truncate max-w-[70%]">
              <div>
                <span className="text-slate-400">Bookings: </span>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{formatCurrency(overviewStats?.revenue?.booking || 0)}</span>
              </div>
            </div>
            {growthStats?.revenue?.total && getGrowthBadge(growthStats.revenue.total.growth)}
          </div>
        </Card>

        {/* Bookings Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-fuchsia-500" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Tổng Booking
              </p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatNumber(totalBookingsCount)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-slate-400">Hoàn tiền chờ duyệt: </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{adminBookingStats?.pendingRefunds || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Properties Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-500 to-amber-500" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Sản phẩm & Khu đất
              </p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatNumber(
                  (overviewStats?.properties?.total || 0) +
                    (overviewStats?.products?.total || 0)
                )}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex gap-4 text-xs">
            <div>
              <span className="text-slate-400">Khu đất: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{overviewStats?.properties?.total || 0}</span>
            </div>
            <div>
              <span className="text-slate-400">Dịch vụ/Đồ thuê: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{overviewStats?.products?.total || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Host Pending Alerts */}
      {overviewStats?.pendingRequests?.hosts > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/50 p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-amber-300">
                Yêu cầu duyệt tài khoản Host mới
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Có <span className="font-bold text-amber-700 dark:text-amber-300">{overviewStats.pendingRequests.hosts}</span> tài khoản đang chờ phê duyệt vai trò Host.
              </p>
            </div>
          </div>
          <a
            href="/admin/hosts"
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline px-3 py-1.5 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
          >
            Duyệt ngay
          </a>
        </div>
      )}

      {/* Visual Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-1.5 rounded-xl w-full sm:w-fit flex flex-wrap gap-1">
          <TabsTrigger value="revenue" className="rounded-lg text-xs font-semibold px-4 py-2 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-xs">
            Biểu đồ Doanh thu
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold px-4 py-2 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-xs">
            Phân bố Booking
          </TabsTrigger>
          <TabsTrigger value="properties" className="rounded-lg text-xs font-semibold px-4 py-2 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-xs">
            Top Khu đất
          </TabsTrigger>
          <TabsTrigger value="hosts" className="rounded-lg text-xs font-semibold px-4 py-2 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-xs">
            Top Host thu nhập
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="outline-hidden">
          <Card className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-6 shadow-xs">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">
                Biểu đồ Doanh thu theo tháng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                  <Line
                    type="monotone"
                    dataKey="bookingRevenue"
                    stroke="#10b981"
                    name="Booking"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8b5cf6"
                    name="Tổng Doanh Thu"
                    strokeWidth={3.5}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="outline-hidden">
          <Card className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-6 shadow-xs">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">
                Trạng thái Booking và Giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="w-full max-w-[400px] h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStats?.byStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {(bookingStats?.byStatus || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Stat breakdown list */}
              <div className="space-y-3 w-full max-w-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chi tiết phân bố</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {(bookingStats?.byStatus || []).map((b: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{b._id}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-200">{b.count} booking</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="outline-hidden">
          <Card className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-6 shadow-xs">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">
                Top 10 Khu cắm trại có doanh thu cao nhất
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topProperties?.slice(0, 10).map((property: any, index: number) => {
                  const medalColors = [
                    "from-yellow-400 to-amber-500 text-white shadow-amber-300/40 dark:shadow-none",
                    "from-slate-300 to-slate-400 text-white shadow-slate-300/40 dark:shadow-none",
                    "from-orange-400 to-amber-600 text-white shadow-orange-300/40 dark:shadow-none"
                  ];
                  return (
                    <div
                      key={property._id}
                      className="group flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200 hover:shadow-md"
                    >
                      <div className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-black text-sm shadow-sm",
                        index < 3 ? medalColors[index] : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        #{index + 1}
                      </div>
                      {property.photos?.[0] && (
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800">
                          <img
                            src={property.photos[0]}
                            alt={property.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {property.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {property.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {property.bookingCount} bookings
                        </p>
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(property.revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosts" className="outline-hidden">
          <Card className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-6 shadow-xs">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">
                Bảng xếp hạng Host có doanh thu cao nhất
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topHosts?.slice(0, 10).map((host: any, index: number) => (
                  <div
                    key={host._id}
                    className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                      Top {index + 1}
                    </div>
                    <Avatar className="h-11 w-11 ring-2 ring-emerald-500/20">
                      <AvatarImage src={host.avatarUrl} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                        {host.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {host.username}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{host.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2.5 justify-end text-xs text-slate-500 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {host.propertyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {host.bookingCount}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(host.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}