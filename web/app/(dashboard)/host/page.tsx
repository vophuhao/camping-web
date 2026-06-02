/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  Calendar,
  DollarSign,
  Home,
  Users,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
} from 'lucide-react';
import { SuperhostWidget } from '@/components/host/SuperhostWidget';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';

interface DashboardStats {
  properties: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  recentBookings: any[];
}

interface RevenueData {
  period: string;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
  };
  chartData: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  topProperties: Array<{
    name: string;
    revenue: number;
    bookings: number;
  }>;
}

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function HostDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRevenueData();
    }
  }, [user, period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API}/dashboardH/stats`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Load dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API}/dashboardH/revenue?period=${period}`,
        {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRevenueData(data.data);
      }
    } catch (err) {
      console.error('Load revenue error:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      confirmed: 'bg-green-100 text-green-755 dark:bg-green-950/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-755 dark:bg-yellow-950/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-755 dark:bg-red-950/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-755 dark:bg-blue-950/30 dark:text-blue-400',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getStatusText = (status: string) => {
    const texts: any = {
      confirmed: 'Đã xác nhận',
      pending: 'Chờ xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
    };
    return texts[status.toLowerCase()] || status;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Không thể tải dữ liệu dashboard
      </div>
    );
  }

  // Pie chart data for properties status
  const propertiesChartData = [
    { name: 'Đang hoạt động', value: stats.properties.active },
    { name: 'Chờ duyệt', value: stats.properties.pending },
    { name: 'Không hoạt động', value: stats.properties.inactive },
    { name: 'Tạm ngưng', value: stats.properties.suspended },
  ].filter(item => item.value > 0);

  // Pie chart data for bookings status
  const bookingsChartData = [
    { name: 'Đã xác nhận', value: stats.bookings.confirmed },
    { name: 'Hoàn thành', value: stats.bookings.completed },
    { name: 'Chờ xác nhận', value: stats.bookings.pending },
    { name: 'Đã hủy', value: stats.bookings.cancelled },
  ].filter(item => item.value > 0);

  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/10 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 text-slate-200">
          <p className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1">{label}</p>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 justify-between min-w-[130px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }} />
                <span className="text-slate-350">{pld.name}:</span>
              </span>
              <span className="font-extrabold text-white">
                {pld.name.includes("Doanh thu") ? formatCurrency(pld.value) : `${pld.value} booking`}
              </span>
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
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="font-semibold text-slate-300">{item.name}:</span>
            <span className="font-extrabold text-white ml-1">{item.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-6 pb-12 bg-slate-50/50 dark:bg-slate-950/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Kênh Chủ Nhà Campo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chào mừng trở lại, <span className="font-bold text-slate-700 dark:text-slate-300">{user?.username || 'Host'}</span>! Quản lý hoạt động cắm trại và doanh thu của bạn.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Properties */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng Property</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.properties.total}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {stats.properties.active} đang hoạt động
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Home className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng Booking</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.bookings.total}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {stats.bookings.pending} chờ duyệt
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-5.5 w-5.5 text-blue-600 dark:text-blue-450" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-fuchsia-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doanh thu tạm tính</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">Tổng thu từ tất cả booking</p>
            </div>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-955/40 p-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5.5 w-5.5 text-purple-600 dark:text-purple-450" />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-500 to-amber-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đánh Giá Trung bình</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.averageRating}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">{stats.totalReviews} lượt đánh giá</p>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-955/40 p-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Star className="h-5.5 w-5.5 text-orange-650 dark:text-orange-400 fill-orange-500/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Superhost Progress Widget */}
      <SuperhostWidget stats={stats} />

      {/* Donut Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Properties Status */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 p-6 border border-slate-200/80 dark:border-slate-850 shadow-xs">
          <h3 className="mb-6 text-md font-extrabold text-slate-800 dark:text-white">
            Trạng Thái Properties
          </h3>
          <div className="flex justify-center items-center h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertiesChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {propertiesChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Status */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 p-6 border border-slate-200/80 dark:border-slate-850 shadow-xs">
          <h3 className="mb-6 text-md font-extrabold text-slate-800 dark:text-white">
            Trạng Thái Bookings
          </h3>
          <div className="flex justify-center items-center h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {bookingsChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 p-6 border border-slate-200/80 dark:border-slate-850 shadow-xs">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-md font-extrabold text-slate-850 dark:text-white">
              Báo Cáo Doanh Thu
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Biểu đồ doanh thu thực tế và tổng booking theo thời gian.</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 rounded-xl text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hôm nay</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {revenueData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 p-4 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Tổng Doanh Thu</p>
                <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(revenueData.summary.totalRevenue)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-4 border border-blue-100 dark:border-blue-900/40">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-450 uppercase tracking-wider">Tổng Booking</p>
                <p className="mt-1 text-2xl font-black text-blue-650 dark:text-blue-400">
                  {revenueData.summary.totalBookings}
                </p>
              </div>
              <div className="rounded-xl bg-purple-50/50 dark:bg-purple-950/10 p-4 border border-purple-100 dark:border-purple-900/40">
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-450 uppercase tracking-wider">Giá Trị TB/Booking</p>
                <p className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
                  {formatCurrency(revenueData.summary.averageBookingValue)}
                </p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    name="Doanh thu"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3b82f6"
                    name="Số booking"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Properties */}
            {revenueData.topProperties.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                <h4 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                  Top 5 Properties Có Doanh Thu Cao Nhất
                </h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.topProperties} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#6366f1" name="Doanh thu" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 p-6 border border-slate-200/80 dark:border-slate-850 shadow-xs">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-850 dark:text-white">
              Booking Gần Đây
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Dưới đây là các đơn đặt phòng mới gửi đến hệ thống của bạn.</p>
          </div>
          <a
            href="/host/bookings"
            className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            Xem tất cả
          </a>
        </div>

        {stats.recentBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-semibold">Chưa có booking nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs">
                  <th className="pb-3 text-left font-semibold">Khách hàng</th>
                  <th className="pb-3 text-left font-semibold">Property</th>
                  <th className="pb-3 text-left font-semibold">Thời gian</th>
                  <th className="pb-3 text-left font-semibold">Tổng tiền</th>
                  <th className="pb-3 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {stats.recentBookings.map((booking: any) => (
                  <tr key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        {booking.guest?.avatarUrl ? (
                          <img
                            src={booking.guest.avatarUrl}
                            alt={booking.guest.username}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/10"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-355 text-sm font-bold ring-2 ring-indigo-500/10">
                            {booking.guest?.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {booking.guest?.username}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{booking.guest?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="text-slate-850 dark:text-slate-200 font-semibold">
                        {booking.property?.name}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-semibold">
                          {new Date(booking.checkIn).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          đến{' '}
                          {new Date(booking.checkOut).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}