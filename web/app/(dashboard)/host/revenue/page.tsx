'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DollarSign, TrendingUp, Calendar, Download, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ chuyển', class: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/30' },
  processing: { label: 'Đang xử lý', class: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border border-blue-200/60 dark:border-blue-900/30' },
  completed: { label: 'Đã chuyển', class: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30' },
  failed: { label: 'Thất bại', class: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-200/60 dark:border-rose-900/30' },
};

export default function HostRevenuePage() {
  const [summary, setSummary] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotalPages, setPayoutTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tab, setTab] = useState<'overview' | 'payouts'>('overview');
  const [exporting, setExporting] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res: any = await API.get('/payouts/host/revenue', { params });
      setSummary(res?.data ?? null);
    } catch { toast.error('Không thể tải dữ liệu doanh thu'); }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  const fetchPayouts = useCallback(async () => {
    try {
      const res: any = await API.get('/payouts/host/my', { params: { page: payoutPage, limit: 10 } });
      setPayouts(res?.data?.payouts ?? []);
      setPayoutTotalPages(res?.data?.totalPages ?? 1);
    } catch { /* ignore */ }
  }, [payoutPage]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await API.get('/payouts/host/revenue/export', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Đã tải báo cáo');
    } catch { toast.error('Lỗi tải báo cáo'); }
    finally { setExporting(false); }
  };

  const statCards = summary ? [
    { label: 'Tổng doanh thu', value: `${fmt(summary.totalRevenue || 0)}₫`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-955/40', sub: `${summary.totalBookings || 0} booking` },
    { label: 'Phí platform (5%)', value: `${fmt(summary.platformFee || 0)}₫`, icon: DollarSign, color: 'text-rose-600 dark:text-rose-450', bg: 'bg-rose-50 dark:bg-rose-955/40', sub: 'Phí dịch vụ Campo' },
    { label: 'Số tiền thực nhận', value: `${fmt(summary.netRevenue || 0)}₫`, icon: Wallet, color: 'text-emerald-600 dark:text-emerald-450', bg: 'bg-emerald-50 dark:bg-emerald-955/40', sub: '95% tổng doanh thu' },
    { label: 'TB/booking', value: `${fmt(summary.avgBookingValue || 0)}₫`, icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-955/40', sub: 'Giá trị trung bình' },
  ] : [];

  const monthlyData = summary?.monthlyRevenue ?? [];
  const maxRevenue = Math.max(...monthlyData.map((m: any) => m.revenue || 0), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6 bg-slate-50/50 dark:bg-slate-950/20">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            💰 Quản lý Doanh thu
          </h1>
          <p className="text-xs text-slate-400 mt-1">Theo dõi doanh thu thực nhận, đối soát phí platform và lịch sử thanh toán định kỳ hàng tháng.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Đang tải...' : 'Xuất CSV'}
        </button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Từ:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đến:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="px-3 py-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-905 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Stats Section */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-4.5 flex flex-col shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", s.bg)}>
                      <Icon className={cn("h-5 w-5", s.color)} />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">{s.label}</span>
                  </div>
                  <div className={cn("text-xl font-black tracking-tight", s.color)}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1.5">{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-250 dark:border-slate-800/80 mt-4">
            {[
              { key: 'overview', label: 'Biểu đồ doanh thu' },
              { key: 'payouts', label: 'Lịch sử thanh toán' }
            ].map(t => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={cn(
                    'px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 rounded-t-lg -mb-[2px] cursor-pointer',
                    isActive
                      ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content rendering */}
          {tab === 'overview' ? (
            /* Monthly Revenue Custom Bar Chart */
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-850 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-white mb-6">Biểu đồ doanh thu hàng tháng</h3>
              {monthlyData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">Chưa có số liệu doanh thu ghi nhận.</div>
              ) : (
                <div className="flex items-end gap-3 sm:gap-6 height-[240px] pt-8 overflow-x-auto pb-2 scrollbar-hide">
                  {monthlyData.map((m: any, i: number) => {
                    const h = Math.max(12, (m.revenue / maxRevenue) * 160);
                    return (
                      <div key={i} className="flex-1 min-w-[70px] flex flex-col items-center gap-2 group cursor-pointer">
                        {/* Bar Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -translate-y-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded shadow-md z-10 pointer-events-none">
                          {fmt(m.revenue)}₫
                        </div>
                        <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{fmt(m.revenue)}</div>
                        <div
                          style={{ height: h }}
                          className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 transition-all duration-300 shadow-sm shadow-indigo-500/10"
                        />
                        <div className="text-[10px] text-slate-400 font-bold">Th{m._id?.month}/{m._id?.year?.toString().slice(-2)}</div>
                        <div className="text-[9px] text-slate-400">{m.bookings} bookings</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Host Payouts History */
            <div className="space-y-4">
              {payouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl shadow-xs text-slate-400 text-center space-y-2">
                  <Wallet className="h-12 w-12 text-slate-200 dark:text-slate-850 mb-1" />
                  <p className="text-sm font-semibold">Chưa có lịch sử thanh toán</p>
                  <p className="text-xs text-slate-400">Doanh thu sẽ được đối soát và giải ngân vào đầu tháng kế tiếp.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider">
                          <th className="px-4 py-3.5 font-bold">Kỳ hạn đối soát</th>
                          <th className="px-4 py-3.5 font-bold text-center">Lượt booking</th>
                          <th className="px-4 py-3.5 font-bold">Doanh thu gross</th>
                          <th className="px-4 py-3.5 font-bold">Phí platform (5%)</th>
                          <th className="px-4 py-3.5 font-bold">Thực nhận Net</th>
                          <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                          <th className="px-4 py-3.5 font-bold text-right">Ngày thanh toán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {payouts.map((p: any) => {
                          const st = PAYOUT_STATUS[p.status] ?? { label: p.status, class: 'bg-slate-100 text-slate-700' };
                          const periodStart = new Date(p.periodStart);
                          return (
                            <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                Tháng {periodStart.getMonth() + 1}/{periodStart.getFullYear()}
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{p.bookings?.length || 0}</td>
                              <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{fmt(p.grossAmount)}₫</td>
                              <td className="px-4 py-3.5 text-xs text-rose-600 dark:text-rose-455 font-medium">-{fmt(p.platformFee)}₫</td>
                              <td className="px-4 py-3.5 font-black text-emerald-600 dark:text-emerald-450">{fmt(p.netAmount)}₫</td>
                              <td className="px-4 py-3.5">
                                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border', st.class)}>
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 text-right">
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-650 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Trước
                  </button>
                  <span className="text-xs text-slate-500 font-semibold">
                    Trang <strong className="text-slate-850 dark:text-slate-200 font-black">{payoutPage}</strong> / {payoutTotalPages}
                  </span>
                  <button
                    onClick={() => setPayoutPage(p => Math.min(payoutTotalPages, p + 1))}
                    disabled={payoutPage === payoutTotalPages}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-650 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
  );
}
