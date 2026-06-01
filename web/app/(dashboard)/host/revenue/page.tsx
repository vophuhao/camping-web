'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getMyBookings } from '@/lib/client-actions';
import {
  DollarSign, TrendingUp, Calendar, Download, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight, Search, Filter
} from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ chuyển', class: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  processing: { label: 'Đang xử lý', class: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  completed: { label: 'Đã chuyển', class: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
  failed: { label: 'Thất bại', class: 'bg-rose-50 text-rose-700 border-rose-200/60' },
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

export default function HostRevenuePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotalPages, setPayoutTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Date filters
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [tab, setTab] = useState<'overview' | 'payouts'>('overview');
  const [exporting, setExporting] = useState(false);

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
      // fallback to empty if endpoint not fully configured
      setPayouts([]);
    }
  }, [payoutPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Handle custom date filters
  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setDateFilter('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  // Helper to get parameters for CSV export
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
    setExporting(true);
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
      toast.success('Đã tải báo cáo doanh thu');
    } catch {
      toast.error('Lỗi khi tải xuất file báo cáo CSV');
    } finally {
      setExporting(false);
    }
  };

  // Dynamic filter for active revenue bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => {
      // Qualify bookings: Paid, Confirmed, or Completed, and not Cancelled/Refunded
      const isPaidOrConfirmed = b.paymentStatus === 'paid' || b.status === 'confirmed' || b.status === 'completed';
      const isNotCancelled = b.status !== 'cancelled' && b.status !== 'refunded';
      if (!isPaidOrConfirmed || !isNotCancelled) return false;

      // Filter by creation date (aligns with backend revenue analytics)
      const bookingDate = new Date(b.createdAt);

      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return bookingDate >= sevenDaysAgo && bookingDate <= now;
      }
      if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return bookingDate >= thirtyDaysAgo && bookingDate <= now;
      }
      if (dateFilter === '90days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        ninetyDaysAgo.setHours(0, 0, 0, 0);
        return bookingDate >= ninetyDaysAgo && bookingDate <= now;
      }
      if (dateFilter === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (bookingDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (bookingDate > end) return false;
        }
      }
      return true;
    });
  }, [bookings, dateFilter, startDate, endDate]);

  // Aggregated metric cards values
  const { totalRevenue, platformFee, netRevenue, totalBookingsCount, avgBookingValue } = useMemo(() => {
    const total = filteredBookings.reduce((sum, b) => sum + getBookingAmount(b), 0);
    const fee = Math.round(total * 0.05); // Platform Fee: 5%
    const net = total - fee;
    const count = filteredBookings.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    
    return {
      totalRevenue: total,
      platformFee: fee,
      netRevenue: net,
      totalBookingsCount: count,
      avgBookingValue: avg,
    };
  }, [filteredBookings]);

  // Generate chart data dynamically based on the selected filter
  const chartData = useMemo(() => {
    if (dateFilter === '7days') {
      const dailyData: Record<string, { label: string; revenue: number; bookings: number; sortKey: number }> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const dayKey = d.toDateString();
        dailyData[dayKey] = { label: dateStr, revenue: 0, bookings: 0, sortKey: d.getTime() };
      }
      
      filteredBookings.forEach(b => {
        const date = new Date(b.createdAt);
        date.setHours(0, 0, 0, 0);
        const dayKey = date.toDateString();
        if (dailyData[dayKey]) {
          dailyData[dayKey].revenue += getBookingAmount(b);
          dailyData[dayKey].bookings += 1;
        }
      });
      
      return Object.values(dailyData).sort((a, b) => a.sortKey - b.sortKey);
    }
    
    if (dateFilter === '30days') {
      const weeklyData: { label: string; revenue: number; bookings: number; sortKey: number }[] = [];
      const now = new Date();
      
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 7 + 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date();
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        
        const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
        weeklyData.push({ label, revenue: 0, bookings: 0, sortKey: start.getTime() });
      }
      
      filteredBookings.forEach(b => {
        const date = new Date(b.createdAt);
        for (let i = 0; i < weeklyData.length; i++) {
          const startLimit = new Date(weeklyData[i].sortKey);
          const endLimit = new Date(startLimit);
          endLimit.setDate(startLimit.getDate() + 6);
          endLimit.setHours(23, 59, 59, 999);
          
          if (date >= startLimit && date <= endLimit) {
            weeklyData[i].revenue += getBookingAmount(b);
            weeklyData[i].bookings += 1;
            break;
          }
        }
      });
      
      return weeklyData;
    }
    
    // Default: group by month
    const monthlyData: Record<string, { label: string; revenue: number; bookings: number; sortKey: number }> = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          label: `Th${month}/${year.toString().slice(-2)}`,
          revenue: 0,
          bookings: 0,
          sortKey: year * 100 + month
        };
      }
      monthlyData[key].revenue += getBookingAmount(b);
      monthlyData[key].bookings += 1;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredBookings, dateFilter]);

  const maxRevenue = useMemo(() => {
    return Math.max(...chartData.map((m: any) => m.revenue || 0), 1);
  }, [chartData]);

  const statCards = [
    { label: 'Tổng doanh thu', value: `${fmt(totalRevenue)}₫`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', sub: `${totalBookingsCount} bookings` },
    { label: 'Phí platform (5%)', value: `${fmt(platformFee)}₫`, icon: DollarSign, color: 'text-rose-650', bg: 'bg-rose-50 border-rose-100', sub: 'Phí dịch vụ platform' },
    { label: 'Thực nhận Net', value: `${fmt(netRevenue)}₫`, icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', sub: '95% tổng doanh thu' },
    { label: 'TB / Booking', value: `${fmt(avgBookingValue)}₫`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', sub: 'Giá trị trung bình' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">💰 Doanh thu của tôi</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi số tiền thực nhận từ các đặt phòng và lịch sử đối soát payout.</p>
          </div>
          {filteredBookings.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-400" />
              {exporting ? 'Đang xuất...' : 'Xuất báo cáo CSV'}
            </button>
          )}
        </div>

        {/* Date & Quick Filters Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">Bộ lọc nhanh:</span>
            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: '7days', label: '1 tuần qua' },
                { key: '30days', label: '1 tháng qua' },
                { key: '90days', label: '3 tháng qua' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setDateFilter(item.key as any);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    dateFilter === item.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hoặc lọc từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => handleCustomDateChange('start', e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 outline-none"
            />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => handleCustomDateChange('end', e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 outline-none"
            />
            {dateFilter === 'custom' && (
              <button
                onClick={() => {
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Main Stats and Chart Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Đang tổng hợp doanh thu...</p>
          </div>
        ) : (
          <>
            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-350">
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", s.bg)}>
                        <Icon className={cn("h-5 w-5", s.color)} />
                      </div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                    </div>
                    <div className={cn("text-2xl font-bold tracking-tight", s.color)}>{s.value}</div>
                    <div className="text-[10px] text-slate-400 mt-2 font-medium">{s.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mt-4">
              {[
                { key: 'overview', label: 'Biểu đồ doanh thu' },
                { key: 'payouts', label: 'Lịch sử thanh toán & Giải ngân' }
              ].map(t => {
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as any)}
                    className={cn(
                      'px-4 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl -mb-[2px] cursor-pointer',
                      isActive
                        ? 'border-slate-800 text-slate-800 bg-white shadow-sm'
                        : 'border-transparent text-slate-450 hover:text-slate-700'
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {tab === 'overview' ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-6">
                  {dateFilter === '7days' && 'Biểu đồ doanh thu 7 ngày qua'}
                  {dateFilter === '30days' && 'Biểu đồ doanh thu 4 tuần gần nhất (30 ngày)'}
                  {dateFilter === '90days' && 'Biểu đồ doanh thu 90 ngày qua'}
                  {dateFilter === 'all' && 'Biểu đồ doanh thu hàng tháng'}
                  {dateFilter === 'custom' && 'Biểu đồ doanh thu theo khoảng thời gian tùy chỉnh'}
                </h3>
                
                {chartData.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-sm">
                    Chưa có số liệu doanh thu nào được ghi nhận trong khoảng thời gian này.
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-3 sm:gap-6 h-[260px] pt-8 overflow-x-auto pb-3 scrollbar-hide">
                    {chartData.map((m: any, i: number) => {
                      const h = Math.max(12, (m.revenue / maxRevenue) * 160);
                      return (
                        <div key={i} className="flex-1 min-w-[75px] flex flex-col justify-end items-center h-full group cursor-pointer relative">
                          {/* Bar Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 pointer-events-none whitespace-nowrap">
                            {fmt(m.revenue)}₫ ({m.bookings} booking)
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 mb-1.5">{fmt(m.revenue)}</div>
                          <div
                            style={{ height: h }}
                            className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-sm"
                          />
                          <div className="text-[10px] text-slate-500 font-semibold mt-2.5">{m.label}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{m.bookings} bookings</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Payouts list */
              <div className="space-y-4">
                {payouts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 text-center space-y-2.5">
                    <Wallet className="h-12 w-12 text-slate-200 mb-1" />
                    <p className="text-sm font-bold text-slate-900">Chưa có lịch sử thanh toán</p>
                    <p className="text-xs text-slate-500 max-w-xs">Doanh thu tích lũy sẽ được tổng hợp đối soát và chuyển về tài khoản ngân hàng của bạn vào đầu mỗi tháng.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                            <th className="px-5 py-4">Kỳ hạn đối soát</th>
                            <th className="px-5 py-4 text-center">Lượt booking</th>
                            <th className="px-5 py-4">Doanh thu gross</th>
                            <th className="px-5 py-4">Phí platform (5%)</th>
                            <th className="px-5 py-4">Thực nhận Net</th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="px-5 py-4 text-right">Ngày thanh toán</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-900">
                          {payouts.map((p: any) => {
                            const st = PAYOUT_STATUS[p.status] ?? { label: p.status, class: 'bg-slate-50 text-slate-700 border-slate-200' };
                            const periodStart = new Date(p.periodStart);
                            return (
                              <tr key={p._id} className="hover:bg-slate-55 transition-colors">
                                <td className="px-5 py-4 font-bold text-slate-900">
                                  Tháng {periodStart.getMonth() + 1}/{periodStart.getFullYear()}
                                </td>
                                <td className="px-5 py-4 text-center font-semibold">{p.bookings?.length || 0}</td>
                                <td className="px-5 py-4 font-medium">{fmt(p.grossAmount)}₫</td>
                                <td className="px-5 py-4 text-xs text-rose-600">-{fmt(p.platformFee)}₫</td>
                                <td className="px-5 py-4 font-bold text-emerald-600">{fmt(p.netAmount)}₫</td>
                                <td className="px-5 py-4">
                                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border', st.class)}>
                                    {st.label}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-xs text-slate-500 text-right">
                                  {p.paidAt ? fmtDate(p.paidAt) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Paging controls */}
                {payoutTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setPayoutPage(p => Math.max(1, p - 1))}
                      disabled={payoutPage === 1}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" /> Trước
                    </button>
                    <span className="text-xs text-slate-500 font-semibold">
                      Trang <strong className="text-slate-900 font-bold">{payoutPage}</strong> / {payoutTotalPages}
                    </span>
                    <button
                      onClick={() => setPayoutPage(p => Math.min(payoutTotalPages, p + 1))}
                      disabled={payoutPage === payoutTotalPages}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    >
                      Sau <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
