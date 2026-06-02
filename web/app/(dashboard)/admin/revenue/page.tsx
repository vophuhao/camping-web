'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  TrendingUp, DollarSign, CalendarCheck, Users, RefreshCw,
  BarChart2, PieChartIcon, Filter, Star, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#6366f1',
  completed: '#10b981',
  cancelled: '#f43f5e',
  pending: '#f59e0b',
  refunded: '#8b5cf6',
  refund_requested: '#ec4899',
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  pending: 'Chờ duyệt',
  refunded: 'Đã hoàn tiền',
  refund_requested: 'Yêu cầu hoàn',
};

const HOST_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6', '#f97316', '#a855f7', '#06b6d4'];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs space-y-1">
      <p className="font-bold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">{fmt(p.value)}₫</span>
        </div>
      ))}
    </div>
  );
};

const COUNT_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs space-y-1">
      <p className="font-bold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">{p.value} booking</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminRevenuePage() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<any>(null);
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostFilter, setHostFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(String(currentYear));
  const [chartMode, setChartMode] = useState<'bar' | 'area'>('area');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (hostFilter) params.hostId = hostFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (!startDate && !endDate) params.year = year;

      const [reportRes, hostsRes]: any = await Promise.all([
        API.get('/dashboard/revenue-report', { params }),
        hosts.length === 0 ? API.get('/users/hosts', { params: { limit: 100 } }) : Promise.resolve(null),
      ]);

      setData(reportRes?.data);
      if (hostsRes) {
        const hostList = hostsRes?.data?.hosts ?? hostsRes?.data ?? [];
        setHosts(hostList);
      }
    } catch (e: any) {
      toast.error('Không thể tải báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostFilter, startDate, endDate, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data?.summary ?? {};
  const monthlyData = data?.monthlyData ?? [];
  const revenueByHost = data?.revenueByHost ?? [];
  const revenueByStatus = data?.revenueByStatus ?? [];

  const statCards = [
    {
      label: 'Tổng doanh thu (Gross)',
      value: `${fmt(summary.totalRevenue || 0)}₫`,
      sub: `Phí platform: ${fmt(summary.platformFee || 0)}₫`,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/30',
    },
    {
      label: 'Doanh thu thực (Net)',
      value: `${fmt(summary.netRevenue || 0)}₫`,
      sub: 'Sau khi trừ phí 5%',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/30',
    },
    {
      label: 'Tổng booking',
      value: summary.totalBookings || 0,
      sub: `TB: ${fmt(summary.avgBookingValue || 0)}₫/booking`,
      icon: CalendarCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/30',
    },
    {
      label: 'Tổng đêm lưu trú',
      value: (summary.totalNights || 0).toLocaleString(),
      sub: `${(summary.totalGuests || 0).toLocaleString()} lượt khách`,
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-100 dark:border-violet-900/30',
    },
  ];

  const pieData = revenueByStatus.map((s: any) => ({
    name: STATUS_LABELS[s._id] ?? s._id,
    value: s.count,
    revenue: s.revenue,
    color: STATUS_COLORS[s._id] ?? '#94a3b8',
  }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
            Báo cáo Doanh thu
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp doanh thu camping · Lọc theo host, thời gian, xem biểu đồ phân tích.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" /> Bộ lọc
        </div>

        {/* Host filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Host</label>
          <select
            value={hostFilter}
            onChange={e => setHostFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 dark:text-slate-300 min-w-[160px]"
          >
            <option value="">Tất cả host</option>
            {hosts.map((h: any) => (
              <option key={h._id} value={h._id}>
                {h.username || h.email}
              </option>
            ))}
          </select>
        </div>

        {/* Year filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Năm</label>
          <select
            value={year}
            onChange={e => { setYear(e.target.value); setStartDate(''); setEndDate(''); }}
            disabled={!!(startDate || endDate)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Từ ngày</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 dark:text-slate-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 dark:text-slate-300"
          />
        </div>
        {(startDate || endDate || hostFilter) && (
          <button
            onClick={() => { setHostFilter(''); setStartDate(''); setEndDate(''); }}
            className="mt-4 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={cn(
                  'bg-white dark:bg-slate-900/60 border rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-xs',
                  s.border
                )}>
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0', s.bg)}>
                    <Icon className={cn('h-5.5 w-5.5', s.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">{s.label}</div>
                    <div className={cn('text-xl font-black mt-0.5 truncate', s.color)}>{s.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" /> Doanh thu theo tháng
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {startDate || endDate ? `${startDate || '…'} → ${endDate || '…'}` : `Năm ${year}`}
                </p>
              </div>
              <div className="flex gap-1.5">
                {(['area', 'bar'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setChartMode(m)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer',
                      chartMode === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {m === 'area' ? 'Area' : 'Bar'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartMode === 'area' ? (
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                </AreaChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Booking count chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="mb-6">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-500" /> Số lượng booking theo tháng
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={35} />
                <Tooltip content={<COUNT_TOOLTIP />} />
                <Bar dataKey="count" name="Booking" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom 2 cols: Host revenue + Booking status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by host */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                <Star className="h-4 w-4 text-amber-500" /> Top Host theo doanh thu
              </h2>
              {revenueByHost.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-300 dark:text-slate-700 text-xs">Không có dữ liệu</div>
              ) : (
                <div className="space-y-3">
                  {revenueByHost.map((h: any, idx: number) => {
                    const maxRev = revenueByHost[0]?.revenue || 1;
                    const pct = Math.round((h.revenue / maxRev) * 100);
                    return (
                      <div key={h.hostId || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                              style={{ background: HOST_COLORS[idx % HOST_COLORS.length] }}
                            >
                              {idx + 1}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{h.hostName || 'N/A'}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-black text-slate-800 dark:text-slate-100">{fmt(h.revenue)}₫</div>
                            <div className="text-[10px] text-slate-400">{h.bookingCount} booking</div>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: HOST_COLORS[idx % HOST_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking status pie */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                <PieChartIcon className="h-4 w-4 text-violet-500" /> Phân bổ trạng thái booking
              </h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-300 dark:text-slate-700 text-xs">Không có dữ liệu</div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, name: any, props: any) => [
                          `${v} booking · ${fmt(props.payload.revenue)}₫`,
                          props.payload.name,
                        ]}
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 12,
                          fontSize: 11,
                          color: '#e2e8f0',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {pieData.map((d: any) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-slate-600 dark:text-slate-400 truncate">{d.name}</span>
                        <span className="ml-auto font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Host revenue bar chart */}
          {revenueByHost.length > 1 && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <BarChart2 className="h-4 w-4 text-blue-500" /> So sánh doanh thu giữa các host
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={revenueByHost.map((h: any, i: number) => ({
                    name: h.hostName?.split(' ').slice(-1)[0] || `Host ${i + 1}`,
                    revenue: h.revenue,
                    bookings: h.bookingCount,
                    fill: HOST_COLORS[i % HOST_COLORS.length],
                  }))}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="revenue" name="Doanh thu" radius={[6, 6, 0, 0]}>
                    {revenueByHost.map((_: any, i: number) => (
                      <Cell key={i} fill={HOST_COLORS[i % HOST_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
