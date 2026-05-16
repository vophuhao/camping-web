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
    { name: 'Hỗ trợ', href: '/host/support', icon: MessageSquare, group: 'main' },
  ];

  const userInitial = user?.username?.charAt(0).toUpperCase() || 'H';

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 flex h-screen flex-col border-r transition-all duration-300',
        'bg-card border-border shadow-lg',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* ── Logo + Brand ── */}
      <div className="flex h-14 items-center justify-between px-3 border-border">
        <div className={cn('flex items-center gap-2.5 overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Tent className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight truncate">Campo Host</p>

          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex-shrink-0 rounded-lg p-1.5 transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* {!collapsed && (
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Quản lý
          </p>
        )} */}

        {mainMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href === '/host' ? pathname === '/host' : pathname.startsWith(item.href!);

          return (
            <Link
              key={item.name}
              href={item.href!}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {/* Icon + badge */}
              <div className="relative flex-shrink-0">
                <Icon className="h-4 w-4" />
                {item.name === 'Thông báo' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {item.name === 'Hỗ trợ' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'flex-1 truncate transition-all duration-300',
                  collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100',
                )}
              >
                {item.name}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="border-t border-border p-2 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <div className="relative flex-shrink-0 h-4 w-4">
            <Sun className={cn('absolute inset-0 h-4 w-4 transition-all', theme === 'dark' ? 'scale-0 opacity-0' : 'scale-100 opacity-100')} />
            <Moon className={cn('absolute inset-0 h-4 w-4 transition-all', theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0')} />
          </div>
          <span className={cn('flex-1 truncate transition-all duration-300', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            {theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={cn('flex-1 truncate transition-all duration-300', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            Đăng xuất
          </span>
        </button>

        {/* User Info */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border bg-muted/40 transition-all',
            collapsed ? 'justify-center' : '',
          )}
        >
          {/* Avatar */}
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold ring-2 ring-emerald-200 dark:ring-emerald-800">
            {userInitial}
          </div>
          <div className={cn('min-w-0 transition-all duration-300', collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100')}>
            <p className="text-xs font-semibold text-foreground truncate">{user?.username || 'Host'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
