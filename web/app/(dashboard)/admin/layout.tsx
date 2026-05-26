'use client';

import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const role = user?.role;
  const [collapsed, setCollapsed] = useState(false);
  if (role != 'admin' || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <h1 className="text-9xl font-extrabold text-muted-foreground/30">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-foreground">
          Trang không tồn tại
        </h2>
        <p className="mt-2 text-muted-foreground">
          Bạn không có quyền truy cập trang này hoặc trang không tồn tại.
        </p>
        <Link
          href="/"
          className="mt-6 rounded bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Content */}
      <main
        className="flex-1 p-6 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: collapsed ? '4rem' : '14rem' }}
      >
        {children}
      </main>
    </div>
  );
}
