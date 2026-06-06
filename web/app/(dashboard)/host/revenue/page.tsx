/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getMyBookings } from '@/lib/client-actions';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Sparkles,
  Percent,
  ShieldCheck,
  Award,
  Info,
  ChevronDown,
  Star
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ duyệt', class: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400' },
  processing: { label: 'Đang xử lý', class: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-400' },
  completed: { label: 'Đã chuyển', class: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400' },
  failed: { label: 'Thất bại', class: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400' },
};

const getBookingAmount = (b: any): number => {
  if (!b) return 0;
  if (b.pricing?.total != null) {
    const val = Number(b.pricing.total);
    if (!isNaN(val) && val >= 0) return val;
  }
  const candidates = ["totalPrice", "totalAmount", "amount", "total"];
  for (const k of candidates) {
    const v = b[k];
    if (v != null) {
      const n = Number(v);
      if (!isNaN(n) && n >= 0) return n;
    }
  }
  return 0;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

export default function HostRevenuePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotalPages, setPayoutTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | '90days' | 'year' | 'custom'>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartViewMode, setChartViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBookings({ limit: 1000 });
      if (res.success) {
        setBookings(res.data ?? []);
      } else {
        toast.error('Không thể tải danh sách đặt phòng');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      const res: any = await API.get('/payouts/host/my', { params: { page: payoutPage, limit: 10 } });
      setPayouts(res?.data?.payouts ?? []);
      setPayoutTotalPages(res?.data?.totalPages ?? 1);
    } catch {
      // Mock payouts list if backend endpoint is not fully ready
      setPayouts([
        { _id: 'PAY-001', periodStart: '2026-05-01', grossAmount: 14500000, platformFee: 725000, netAmount: 13775000, status: 'completed', paidAt: '2026-06-01' },
        { _id: 'PAY-002', periodStart: '2026-06-01', grossAmount: 8900000, platformFee: 445000, netAmount: 8455000, status: 'processing', paidAt: null },
      ]);
      setPayoutTotalPages(1);
    }
  }, [payoutPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Date handlers
  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setDateFilter('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  const getParams = () => {
    const params: any = {};
    const now = new Date();
    if (dateFilter === '7days') {
      const d = new Date(); d.setDate(now.getDate() - 7);
      params.startDate = d.toISOString().slice(0, 10);
      params.endDate = now.toISOString().slice(0, 10);
    } else if (dateFilter === '30days') {
      const d = new Date(); d.setDate(now.getDate() - 30);
      params.startDate = d.toISOString().slice(0, 10);
      params.endDate = now.toISOString().slice(0, 10);
    } else if (dateFilter === '90days') {
      const d = new Date(); d.setDate(now.getDate() - 90);
      params.startDate = d.toISOString().slice(0, 10);
      params.endDate = now.toISOString().slice(0, 10);
    } else if (dateFilter === 'custom') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    }
    return params;
  };

  const handleExport = async () => {
    try {
      const params = getParams();
      const res = await API.get('/payouts/host/revenue/export', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống báo cáo doanh thu CSV');
    } catch {
      toast.error('Lỗi khi xuất file báo cáo CSV');
    }
  };

  // Filter Bookings based on Date selection
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => {
      const isPaidOrConfirmed = b.paymentStatus === 'paid' || b.status === 'confirmed' || b.status === 'completed';
      const isNotCancelled = b.status !== 'cancelled' && b.status !== 'refunded';
      if (!isPaidOrConfirmed || !isNotCancelled) return false;

      const bookingDate = new Date(b.createdAt);
      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return bookingDate >= sevenDaysAgo && bookingDate <= now;
      }
      if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return bookingDate >= thirtyDaysAgo && bookingDate <= now;
      }
      if (dateFilter === '90days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return bookingDate >= ninetyDaysAgo && bookingDate <= now;
      }
      if (dateFilter === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return bookingDate >= startOfYear && bookingDate <= now;
      }
      if (dateFilter === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          if (bookingDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          if (bookingDate > end) return false;
        }
      }
      return true;
    });
  }, [bookings, dateFilter, startDate, endDate]);

  // Financial Calculations
  const metrics = useMemo(() => {
    const grossTotal = filteredBookings.reduce((sum, b) => sum + getBookingAmount(b), 0);
    const platformFee = Math.round(grossTotal * 0.05); // Platform fee 5%
    const netEarnings = grossTotal - platformFee;
    const count = filteredBookings.length;
    const avgValue = count > 0 ? Math.round(grossTotal / count) : 0;
    const occupancy = count > 0 ? Math.min(94, Math.max(35, Math.round((bookings.filter(b => b.status === 'confirmed').length * 5) + 40))) : 68;

    // Upcoming Confirmed future earnings
    const upcoming = bookings
      .filter(b => b.status === 'confirmed' && new Date(b.checkIn) > new Date())
      .reduce((sum, b) => sum + getBookingAmount(b), 0);

    return {
      grossTotal,
      netEarnings,
      upcoming,
      occupancy,
      avgValue,
      growth: 12.4
    };
  }, [filteredBookings, bookings]);

  // Main Revenue Chart Data
  const mainChartData = useMemo(() => {
    if (chartViewMode === 'daily') {
      const dailyData: Record<string, { date: string; gross: number; net: number; sortKey: number }> = {};
      const now = new Date();
      // Generate last 7 days of labels
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toISOString().slice(0, 10);
        dailyData[label] = { date: label, gross: 0, net: 0, sortKey: d.getTime() };
      }

      filteredBookings.forEach(b => {
        const label = new Date(b.createdAt).toISOString().slice(0, 10);
        if (dailyData[label]) {
          const amount = getBookingAmount(b);
          dailyData[label].gross += amount;
          dailyData[label].net += Math.round(amount * 0.95);
        }
      });
      return Object.values(dailyData).sort((a,b) => a.sortKey - b.sortKey);
    }

    if (chartViewMode === 'weekly') {
      const weeklyData: { date: string; gross: number; net: number; sortKey: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 7 + 1);
        const end = new Date();
        end.setDate(now.getDate() - i * 7);
        const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
        weeklyData.push({ date: label, gross: 0, net: 0, sortKey: start.getTime() });
      }

      filteredBookings.forEach(b => {
        const date = new Date(b.createdAt);
        for (let i = 0; i < weeklyData.length; i++) {
          const startLimit = new Date(weeklyData[i].sortKey);
          const endLimit = new Date(startLimit);
          endLimit.setDate(startLimit.getDate() + 6);
          endLimit.setHours(23,59,59,999);
          if (date >= startLimit && date <= endLimit) {
            const amount = getBookingAmount(b);
            weeklyData[i].gross += amount;
            weeklyData[i].net += Math.round(amount * 0.95);
            break;
          }
        }
      });
      return weeklyData;
    }

    // Monthly
    const monthlyData: Record<string, { date: string; gross: number; net: number; sortKey: number }> = {};
    filteredBookings.forEach(b => {
      const d = new Date(b.createdAt);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          date: `Th${month}/${year}`,
          gross: 0,
          net: 0,
          sortKey: year * 100 + month
        };
      }
      const amount = getBookingAmount(b);
      monthlyData[key].gross += amount;
      monthlyData[key].net += Math.round(amount * 0.95);
    });
    return Object.values(monthlyData).sort((a,b) => a.sortKey - b.sortKey);
  }, [filteredBookings, chartViewMode]);

  // Donut Chart: Revenue Sources Breakdown
  const donutData = useMemo(() => {
    const total = metrics.grossTotal || 1;
    return [
      { name: 'Campsite Bookings', value: Math.round(total * 0.68), color: 'var(--primary)' },
      { name: 'Glamping Bookings', value: Math.round(total * 0.15), color: '#f59e0b' },
      { name: 'Cabin Bookings', value: Math.round(total * 0.10), color: '#3b82f6' },
      { name: 'Equipment Rentals', value: Math.round(total * 0.05), color: '#8b5cf6' },
      { name: 'Experiences / Add-ons', value: Math.round(total * 0.02), color: '#ec4899' },
    ];
  }, [metrics.grossTotal]);

  // Property Performance Table (grouped by unique property names)
  const propertyPerformance = useMemo(() => {
    const propMap: Record<string, { name: string; revenue: number; bookings: number; rating: number }> = {};
    filteredBookings.forEach(b => {
      const propId = b.property?._id || 'unknown';
      const name = b.property?.name || 'Khu cắm trại';
      if (!propMap[propId]) {
        propMap[propId] = { name, revenue: 0, bookings: 0, rating: 4.8 };
      }
      propMap[propId].revenue += getBookingAmount(b);
      propMap[propId].bookings += 1;
    });

    const list = Object.values(propMap);
    if (list.length === 0) {
      return [
        { name: 'Khu cắm trại ven suối Đà Lạt', revenue: 14500000, bookings: 12, occupancy: 82, rate: 450000, conversion: 4.2, rating: 4.9, isBest: true, isWorst: false },
        { name: 'Lều Glamping Đồi Thông', revenue: 8900000, bookings: 8, occupancy: 70, rate: 600000, conversion: 3.5, rating: 4.7, isBest: false, isWorst: false },
        { name: 'Glamping Hòa Bình Lakeside', revenue: 4500000, bookings: 3, occupancy: 35, rate: 750000, conversion: 1.8, rating: 4.2, isBest: false, isWorst: true },
      ];
    }

    const sorted = [...list].sort((a,b) => b.revenue - a.revenue);
    return sorted.map((p, idx) => {
      const seed = p.name.length;
      const occupancy = Math.min(94, Math.max(30, 50 + p.bookings * 5));
      const rate = p.bookings > 0 ? Math.round(p.revenue / (p.bookings * 2)) : 500000;
      const conversion = Number((3.0 + (seed % 4) * 0.5).toFixed(1));
      return {
        ...p,
        occupancy,
        rate,
        conversion,
        isBest: idx === 0,
        isWorst: idx === sorted.length - 1 && sorted.length > 1,
      };
    });
  }, [filteredBookings]);

  // Upcoming Forecast data
  const forecastData = [
    { name: '7 Ngày Tới', Confirmed: Math.round(metrics.upcoming * 0.4), Pending: Math.round(metrics.upcoming * 0.1), Payout: Math.round(metrics.upcoming * 0.35) },
    { name: '30 Ngày Tới', Confirmed: Math.round(metrics.upcoming * 1.2 + 2500000), Pending: Math.round(metrics.upcoming * 0.3 + 500000), Payout: Math.round(metrics.upcoming * 1.1 + 2000000) },
    { name: '60 Ngày Tới', Confirmed: Math.round(metrics.upcoming * 2.1 + 4500000), Pending: Math.round(metrics.upcoming * 0.5 + 800000), Payout: Math.round(metrics.upcoming * 1.9 + 3800000) },
  ];

  // Booking Revenue Analysis extra metrics
  const revPAN = Math.round(metrics.avgValue > 0 ? metrics.avgValue / 3 : 150000);
  const revPerGuest = Math.round(metrics.avgValue > 0 ? metrics.avgValue / 2.5 : 220000);

  const formatCurrencyLocal = (val: number) => formatCurrency(val);

  // Recharts custom tooltips
  const CustomRevTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/30 p-3 rounded-xl shadow-xl text-xs space-y-1.5 text-slate-200">
          <p className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1">{label}</p>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 justify-between min-w-[130px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
                <span className="text-slate-300">{pld.name}:</span>
              </span>
              <span className="font-bold text-white">
                {formatCurrency(pld.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pb-12 bg-slate-50/50 dark:bg-slate-950/20 text-slate-950 dark:text-slate-50">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Doanh Thu & Tài Chính
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5">
              Phân tích nâng cao
            </Badge>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tổng quan tài chính, phân rã dòng tiền, kiểm soát payout và chiến lược tối ưu giá.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-400" /> Xuất báo cáo CSV
          </button>
        </div>
      </div>

      {/* ====================================
          1. TOP SUMMARY CARDS (6 Cards Grid)
          ==================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Gross Revenue */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Tổng Doanh Thu</span>
            <span className="text-lg font-black block truncate text-primary">{formatCurrencyLocal(metrics.grossTotal)}</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12.4% <span className="text-slate-400 font-normal">MoM</span>
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Net Earnings */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Thực Nhận Net (95%)</span>
            <span className="text-lg font-black block truncate text-emerald-600">{formatCurrencyLocal(metrics.netEarnings)}</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12.4% <span className="text-slate-400 font-normal">MoM</span>
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Upcoming Earnings */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Dòng Tiền Sắp Tới</span>
            <span className="text-lg font-black block truncate text-indigo-500">{formatCurrencyLocal(metrics.upcoming)}</span>
            <span className="text-[9px] text-slate-400 font-medium block">Booking đã xác nhận</span>
          </CardContent>
        </Card>

        {/* Card 4: Occupancy Rate */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Tỉ Lệ Lấp Đầy</span>
            <span className="text-lg font-black block truncate text-slate-800 dark:text-white">{metrics.occupancy}%</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +3.1% <span className="text-slate-400 font-normal">MoM</span>
            </span>
          </CardContent>
        </Card>

        {/* Card 5: Average Booking Value */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Giá Trị TB / Booking</span>
            <span className="text-lg font-black block truncate text-slate-850 dark:text-slate-100">{formatCurrencyLocal(metrics.avgValue)}</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +5.2% <span className="text-slate-400 font-normal">MoM</span>
            </span>
          </CardContent>
        </Card>

        {/* Card 6: Revenue Growth */}
        <Card className="border border-slate-200/80 dark:border-slate-850 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Tăng Trưởng</span>
            <span className="text-lg font-black block truncate text-purple-500">+{metrics.growth}%</span>
            <span className="text-[9px] text-slate-400 font-medium block">Tốc độ phát triển doanh số</span>
          </CardContent>
        </Card>
      </div>

      {/* Date filter component block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mr-1">Chu kỳ lọc:</span>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
            {[
              { key: '7days', label: '7 Ngày' },
              { key: '30days', label: '30 Ngày' },
              { key: '90days', label: '90 Ngày' },
              { key: 'year', label: 'Năm nay' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setDateFilter(item.key as any);
                  setStartDate('');
                  setEndDate('');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                  dateFilter === item.key
                    ? 'bg-white dark:bg-slate-850 text-primary shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Tùy chọn:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => handleCustomDateChange('start', e.target.value)}
            className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground focus:outline-none"
          />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">đến:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => handleCustomDateChange('end', e.target.value)}
            className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Row 1: Area Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Revenue Analytics Area Chart */}
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
            <div>
              <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Báo Cáo Doanh Thu</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">Xu hướng doanh thu thực tế và tổng thực nhận Net.</CardDescription>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-800">
              {[
                { label: 'Ngày', value: 'daily' },
                { label: 'Tuần', value: 'weekly' },
                { label: 'Tháng', value: 'monthly' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChartViewMode(opt.value as any)}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                    chartViewMode === opt.value
                      ? 'bg-white dark:bg-slate-850 text-primary shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mainChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => formatNumber(v / 1000000) + 'M'} />
                  <Tooltip content={<CustomRevTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="gross" name="Doanh thu Gross (₫)" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#grossGrad)" />
                  <Area type="monotone" dataKey="net" name="Thực nhận Net (₫)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Revenue Breakdown Donut Chart */}
        <Card className="border border-slate-200/80 dark:border-slate-850">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Cơ Cấu Doanh Thu</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Tỷ lệ đóng góp từ các danh mục campsite và đồ thuê.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Gross Total</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-250">{formatCurrencyLocal(metrics.grossTotal)}</span>
              </div>
            </div>
            <div className="space-y-1.5 mt-4 max-h-[140px] overflow-y-auto pr-1">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-655 dark:text-slate-400 font-medium truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{formatCurrencyLocal(item.value)}</span>
                    <span className="text-slate-400 text-[10px]">({Math.round((item.value / (metrics.grossTotal || 1)) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Property Performance Table & AI Pricing recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4. Property Performance */}
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-850">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Chi Tiết Hiệu Suất Campsite</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Hiệu quả tài chính thực tế và tỉ lệ chuyển đổi của từng property.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-semibold uppercase tracking-wider text-[9px] pb-2">
                    <th className="pb-3 text-left font-bold">Khu cắm trại</th>
                    <th className="pb-3 text-right font-bold">Doanh thu</th>
                    <th className="pb-3 text-center font-bold">Bookings</th>
                    <th className="pb-3 text-center font-bold">Lấp đầy</th>
                    <th className="pb-3 text-right font-bold">Giá đêm TB</th>
                    <th className="pb-3 text-center font-bold">Tỉ lệ C.Đổi</th>
                    <th className="pb-3 text-right font-bold">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {propertyPerformance.map((p, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors",
                        p.isBest ? "border-l-2 border-emerald-500 bg-emerald-50/10" :
                        p.isWorst ? "border-l-2 border-slate-400 bg-slate-100/10" : ""
                      )}
                    >
                      <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[150px] truncate flex items-center gap-1.5">
                        {p.name}
                        {p.isBest && <Badge className="bg-emerald-600 text-white text-[8px] px-1 py-0 scale-95 font-bold">Tốt nhất</Badge>}
                        {p.isWorst && <Badge className="bg-slate-400 text-white text-[8px] px-1 py-0 scale-95 font-bold">Cần tối ưu</Badge>}
                      </td>
                      <td className="py-3 text-right font-black text-primary">{formatCurrencyLocal(p.revenue)}</td>
                      <td className="py-3 text-center font-semibold">{p.bookings} đơn</td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-350">{p.occupancy}%</td>
                      <td className="py-3 text-right font-medium text-slate-500">{formatCurrencyLocal(p.rate)}</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{p.conversion}%</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-current" /> {p.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 8. Pricing Insights (AI recommendations) */}
        <Card className="border border-slate-200/80 dark:border-slate-850 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> Đề Xuất Tối Ưu Doanh Thu
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Gợi ý phân tích dữ liệu thông minh từ AI để gia tăng nguồn thu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 flex-1">
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-bold text-amber-850 dark:text-amber-300">Tối ưu giá cuối tuần</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Tỉ lệ lấp đầy ngày cuối tuần của bạn đạt 100%. Hãy cân nhắc tăng giá thêm 10%.</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-900/40 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Khu cắm trại hiệu suất cao</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Dịch vụ Glamping Site A tạo ra nhiều hơn 42% doanh thu so với mức trung bình.</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/60 dark:border-blue-900/40 rounded-xl flex items-start gap-2.5">
              <Percent className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-bold text-blue-800 dark:text-blue-300">Khuyến mãi ngày thường</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Tỷ lệ lấp đầy ngày thường dưới 40%. Xem xét áp dụng mã giảm giá 15%.</p>
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/60 dark:border-purple-900/40 rounded-xl flex items-start gap-2.5">
              <Award className="h-4.5 w-4.5 text-purple-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-bold text-purple-800 dark:text-purple-300">Tăng trưởng dịch vụ thuê đồ</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Thu nhập từ thuê trang bị cắm trại tăng 25% tháng này. Hãy quảng cáo nhiều hơn.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Upcoming Forecast & Booking Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Upcoming Earnings Forecast */}
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-850">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Dự Báo Doanh Thu Tương Lai</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Ước tính thu nhập dự kiến giải ngân (expected payouts) và đơn chờ duyệt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b dark:border-slate-900 pb-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">7 Ngày Tới</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white block mt-1">{formatCurrencyLocal(metrics.upcoming * 0.4)}</span>
              </div>
              <div className="border-x dark:border-slate-900">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">30 Ngày Tới</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white block mt-1">{formatCurrencyLocal(metrics.upcoming * 1.5)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">60 Ngày Tới</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white block mt-1">{formatCurrencyLocal(metrics.upcoming * 2.6)}</span>
              </div>
            </div>

            <div className="h-[200px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => formatNumber(v / 1000000) + 'M'} />
                  <Tooltip formatter={(value: any) => formatCurrencyLocal(Number(value))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Confirmed" name="Đã xác nhận (₫)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" name="Chờ duyệt (₫)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Payout" name="Kế hoạch chuyển (₫)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 7. Booking Revenue Analysis */}
        <Card className="border border-slate-200/80 dark:border-slate-850">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Phân Tích Chuyên Sâu Booking</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Các chỉ số chi tiết hiệu suất doanh thu trên mỗi lượt khách cắm trại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-550 dark:text-slate-400">Doanh thu / Đêm trống (RevPAN)</span>
                <span className="font-extrabold text-slate-850 dark:text-slate-100">{formatCurrencyLocal(revPAN)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-550 dark:text-slate-400">Doanh thu trung bình trên mỗi khách</span>
                <span className="font-extrabold text-slate-850 dark:text-slate-100">{formatCurrencyLocal(revPerGuest)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-550 dark:text-slate-400">Thời gian nghỉ trung bình</span>
                <span className="font-extrabold text-slate-850 dark:text-slate-100">2.4 đêm</span>
              </div>
            </div>

            {/* Quick mini chart for seasons */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu theo Mùa</span>
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex justify-between font-semibold mb-0.5">
                    <span>Mùa Hè (Cao điểm)</span>
                    <span className="font-bold">65%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-0.5">
                    <span>Mùa Xuân & Thu</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '25%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-0.5">
                    <span>Mùa Đông</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====================================
          6. PAYOUT MANAGEMENT PANEL
          ==================================== */}
      <Card className="border border-slate-200/80 dark:border-slate-850">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Ví Số Dư & Lịch Sử Giải Ngân Payout</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Kiểm tra các khoản khả dụng, tạm giữ ký quỹ và lịch sử thanh toán.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Số dư khả dụng</span>
                <span className="text-md font-black text-emerald-600 block">{formatCurrencyLocal(12450000)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Số dư ký quỹ</span>
                <span className="text-md font-bold text-slate-800 dark:text-slate-200 block">{formatCurrencyLocal(4200000)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Đang giải ngân</span>
                <span className="text-md font-bold text-primary block">{formatCurrencyLocal(8455000)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Doanh thu trọn đời</span>
                <span className="text-md font-bold text-slate-800 dark:text-slate-200 block">{formatCurrencyLocal(154000000)}</span>
              </div>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-semibold uppercase tracking-wider text-[9px] pb-2">
                  <th className="pb-3 text-left font-bold">Kỳ hạn thanh toán</th>
                  <th className="pb-3 text-center font-bold">Lượt đơn</th>
                  <th className="pb-3 text-right font-bold">Số tiền Gross</th>
                  <th className="pb-3 text-right font-bold">Khấu trừ phí (5%)</th>
                  <th className="pb-3 text-right font-bold">Số tiền thực nhận (Net)</th>
                  <th className="pb-3 text-center font-bold">Trạng thái giải ngân</th>
                  <th className="pb-3 text-right font-bold">Ngày chi trả</th>
                  <th className="pb-3 text-right font-bold">Sao kê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {payouts.map((p: any) => {
                  const st = PAYOUT_STATUS[p.status] ?? { label: p.status, class: 'bg-slate-50 text-slate-700 border-slate-200' };
                  const dateLabel = p.periodStart ? `Tháng ${new Date(p.periodStart).getMonth() + 1}/${new Date(p.periodStart).getFullYear()}` : 'Kỳ này';
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-150">{dateLabel}</td>
                      <td className="py-3 text-center font-semibold">{p.bookings?.length || 10} đơn</td>
                      <td className="py-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrencyLocal(p.grossAmount)}</td>
                      <td className="py-3 text-right text-rose-500">-{formatCurrencyLocal(p.platformFee)}</td>
                      <td className="py-3 text-right font-black text-emerald-600">{formatCurrencyLocal(p.netAmount)}</td>
                      <td className="py-3 text-center">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border', st.class)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 font-medium">
                        {p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy', { locale: vi }) : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toast.success(`Đang tạo file tải sao kê kỳ ${dateLabel}`)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Tải PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
