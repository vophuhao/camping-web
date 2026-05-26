'use client';

import { logout } from '@/lib/client-actions';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/useNotification';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Star,
  Sun,
  Tent,
  User,
  DollarSign,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

type MenuItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
  group?: 'main' | 'account';
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
};

export default function HostSidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount || 0;
  const { data: unreadMessagesData } = useUnreadMessagesCount();
  const unreadMessagesCount = unreadMessagesData?.unreadCount || 0;

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      toast.success(response.message);
      useAuthStore.getState().setUser(null);
      router.push('/sign-in');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const mainMenuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/host', icon: Home, group: 'main' },
    { name: 'Booking & Lịch', href: '/host/bookings', icon: Calendar, group: 'main' },
    { name: 'Khu đất', href: '/host/properties', icon: Tent, group: 'main' },
    { name: 'Thông báo', href: '/host/notifications', icon: Bell, group: 'main' },
    { name: 'Đánh giá', href: '/host/reviews', icon: Star, group: 'main' },
    { name: 'Doanh thu', href: '/host/revenue', icon: DollarSign, group: 'main' },
    { name: 'Ví của tôi', href: '/host/wallet', icon: Wallet, group: 'main' },
    { name: 'Hỗ trợ', href: '/host/support', icon: MessageSquare, group: 'main' },
  ];

  const userInitial = user?.username?.charAt(0).toUpperCase() || 'H';

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800/80 shadow-2xl flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* ── Logo + Brand ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/50">
        <div className={cn('flex items-center gap-2 overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Tent className="h-4.5 w-4.5 text-white" />
          </div>
          <Link href="/" className="min-w-0 cursor-pointer">
            <span className="text-md font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-wide truncate block">
              Campo Host
            </span>
          </Link>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex-shrink-0 rounded-lg p-1.5 transition-colors',
            'text-slate-400 hover:bg-slate-800 hover:text-slate-105',
          )}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", !collapsed && "rotate-180")} />
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-hide">
        {mainMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href === '/host' ? pathname === '/host' : pathname.startsWith(item.href!);

          return (
            <Link
              key={item.name}
              href={item.href!}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/40'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
              )}
            >
              {/* Icon + badge */}
              <div className="relative flex-shrink-0">
                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                {item.name === 'Thông báo' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {item.name === 'Hỗ trợ' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'flex-1 truncate transition-all duration-300 text-left',
                  collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100',
                )}
              >
                {item.name}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-indigo-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="border-t border-slate-800/60 p-3 space-y-1.5 bg-slate-950/20">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
            'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
          )}
        >
          <div className="relative flex-shrink-0 h-4 w-4">
            <Sun className={cn('absolute inset-0 h-4 w-4 transition-all duration-250', theme === 'dark' ? 'scale-0 opacity-0' : 'scale-100 opacity-100')} />
            <Moon className={cn('absolute inset-0 h-4 w-4 transition-all duration-250', theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0')} />
          </div>
          <span className={cn('flex-1 truncate transition-all duration-300 text-left', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            {theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
            'text-slate-400 hover:bg-red-950/20 hover:text-red-400',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={cn('flex-1 truncate transition-all duration-300 text-left', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            Đăng xuất
          </span>
        </button>

        {/* User Info */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 border border-slate-800/40 bg-slate-950/40 transition-all duration-200',
            collapsed ? 'justify-center' : '',
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-sm font-bold ring-2 ring-emerald-100 dark:ring-emerald-900/40">
            {userInitial}
          </div>
          <div className={cn('min-w-0 transition-all duration-300 text-left', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.username || 'Host'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'host@campo.vn'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
