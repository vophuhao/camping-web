/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { cn } from '@/lib/utils';
import type { Booking } from '@/types/property-site';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface BookingCalendarProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

interface CalendarDay {
  date: Date;
  bookings: Booking[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-400' },
  confirmed: { bg: 'bg-emerald-500', text: 'text-white', dot: 'bg-emerald-400' },
  cancelled: { bg: 'bg-red-500', text: 'text-white', dot: 'bg-red-400' },
  completed: { bg: 'bg-blue-500', text: 'text-white', dot: 'bg-blue-400' },
  refunded: { bg: 'bg-purple-500', text: 'text-white', dot: 'bg-purple-400' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy', completed: 'Hoàn thành', refunded: 'Đã hoàn tiền',
};

export function BookingCalendar({ bookings, onBookingClick }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dow = firstDay.getDay();
    startDate.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayBookings = bookings.filter(b => {
        const ci = new Date(b.checkIn); ci.setHours(0, 0, 0, 0);
        const co = new Date(b.checkOut); co.setHours(0, 0, 0, 0);
        return date >= ci && date <= co;
      });

      days.push({ date, bookings: dayBookings, isCurrentMonth: date.getMonth() === month, isToday: date.getTime() === today.getTime() });
    }
    return days;
  }, [currentDate, bookings]);

  const monthStats = useMemo(() => {
    const mb = bookings.filter(b => {
      const ci = new Date(b.checkIn);
      return ci.getMonth() === currentDate.getMonth() && ci.getFullYear() === currentDate.getFullYear();
    });
    return {
      total: mb.length,
      pending: mb.filter(b => b.status === 'pending').length,
      confirmed: mb.filter(b => b.status === 'confirmed').length,
      revenue: mb.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.pricing.total, 0),
    };
  }, [bookings, currentDate]);

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p);
  const monthYear = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const statCards = [
    { label: 'Tổng booking', value: monthStats.total, icon: CalendarIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Chờ xác nhận', value: monthStats.pending, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Đã xác nhận', value: monthStats.confirmed, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Doanh thu', value: `${formatPrice(monthStats.revenue)}₫`, icon: DollarSign, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', small: true },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold capitalize text-foreground">{monthYear}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{monthStats.total} booking trong tháng này</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border-l border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', s.bg)}>
                <Icon className={cn('h-4 w-4', s.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className={cn('font-bold', s.color, (s as any).small ? 'text-sm' : 'text-xl')}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div> */}

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
            <div key={d} className={cn('py-2.5 text-center text-xs font-semibold text-muted-foreground', i === 6 && 'text-red-500 dark:text-red-400')}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {calendarDays.map((day, idx) => {
            const hasBookings = day.bookings.length > 0;
            return (
              <div
                key={idx}
                className={cn(
                  'relative min-h-[90px] p-2 transition-colors',
                  day.isCurrentMonth ? 'bg-card' : 'bg-muted/20',
                  day.isToday && 'bg-emerald-50/60 dark:bg-emerald-950/30',
                  hasBookings && 'cursor-pointer hover:bg-accent/50',
                )}
              >
                {/* Day number */}
                <div className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1',
                  day.isToday ? 'bg-emerald-600 text-white font-bold' :
                    day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                  idx % 7 === 6 && !day.isToday && 'text-red-500 dark:text-red-400',
                )}>
                  {day.date.getDate()}
                </div>

                {/* Bookings */}
                <div className="space-y-0.5">
                  {day.bookings.slice(0, 2).map(booking => {
                    const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
                    const guest = typeof booking.guest === 'object' ? booking.guest : null;
                    const site = typeof booking.site === 'object' ? booking.site : null;
                    return (
                      <button
                        key={booking._id}
                        onClick={() => onBookingClick(booking)}
                        className="w-full text-left group"
                      >
                        <div className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium group-hover:opacity-80 transition-opacity', colors.bg, colors.text)}>
                          <div className="truncate">{(guest as any)?.name || 'Khách'}</div>
                          {site && <div className="truncate opacity-80">{site.name}</div>}
                        </div>
                      </button>
                    );
                  })}
                  {day.bookings.length > 2 && (
                    <div className="text-center">
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1">
                        +{day.bookings.length - 2} thêm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-xs font-semibold text-muted-foreground">Trạng thái:</span>
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', colors.bg)} />
            <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
