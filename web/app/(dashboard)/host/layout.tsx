'use client';

import AdminSidebar from '@/components/admin/admin-sidebar';
import HostSidebar from '@/components/host/host-sidebar';
import { useAuthStore } from '@/store/auth.store';
import { Suspense, useState } from 'react';

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const role = user?.role;
  const [collapsed, setCollapsed] = useState(false);
  //   if (role != 'admin' || !user) {
  //     return (
  //       <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
  //         <h1 className="text-9xl font-extrabold text-gray-300">404</h1>
  //         <h2 className="mt-4 text-3xl font-bold text-gray-700">
  //           Trang không tồn tại
  //         </h2>
  //         <p className="mt-2 text-gray-500">
  //           Bạn không có quyền truy cập trang này hoặc trang không tồn tại.
  //         </p>
  //         <Link
  //           href="/"
  //           className="mt-6 rounded bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
  //         >
  //           Quay về trang chủ
  //         </Link>
  //       </div>
  //     );
  //   }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Suspense fallback={<div className="w-64 animate-pulse bg-gray-100" />}>
        {role === 'admin' ? (
          <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        ) : (
          <HostSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}
      </Suspense>

      {/* Content */}
      <main
        className={`flex-1 transition-all duration-300`}
        style={{ marginLeft: collapsed ? '4rem' : '14rem' }}
      >
        {children}
      </main>
    </div>
  );
}
