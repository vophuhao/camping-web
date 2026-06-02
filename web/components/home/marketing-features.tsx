'use client';

import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import Link from 'next/link';

export default function MarketingFeatures() {
  const { user, isAuthenticated } = useAuthStore();

  const hostLink = !isAuthenticated
    ? '/sign-in?redirect=/become-host'
    : user?.role === 'host'
      ? '/host'
      : '/become-host';

  return (
    <section className="bg-white pb-16">
      <div className="container-padding mx-auto max-w-7xl">
        {/* Section 2: Dual CTAs (Host vs. Camper) */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Host Campaign */}
          <Link
            href={hostLink}
            className="group flex flex-col cursor-pointer overflow-hidden rounded-[2rem] bg-[#1e1d1a] text-white transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl"
          >
            {/* Image Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src="/assets/images/marketing-1.png"
                alt="Host campsites on private land"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            {/* Bottom Content Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 md:p-8">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-widest text-[#efeee9]/70 uppercase">
                  Dành Cho Chủ Đất
                </span>
                <h3 className="mt-2 text-xl font-bold leading-tight text-white md:text-2xl">
                  Bạn có đất trống muốn chia sẻ?
                </h3>
              </div>
              <div className="shrink-0">
                <span className="inline-block rounded-full bg-white px-6 py-3.5 text-sm font-bold text-gray-900 transition-colors group-hover:bg-gray-100">
                  Bắt đầu đón khách
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Camper Campaign */}
          <Link
            href="/search"
            className="group flex flex-col cursor-pointer overflow-hidden rounded-[2rem] bg-[#f39f00] text-[#1e1d1a] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl"
          >
            {/* Image Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src="/assets/images/marketing-2.jpeg"
                alt="Discover camping sites"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            {/* Bottom Content Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 md:p-8">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-widest text-[#2f2d24]/70 uppercase">
                  Dành Cho Trại Viên
                </span>
                <h3 className="mt-2 text-xl font-bold leading-tight text-[#1e1d1a] md:text-2xl">
                  Lên kế hoạch cho chuyến phiêu lưu
                </h3>
              </div>
              <div className="shrink-0">
                <span className="inline-block rounded-full bg-[#1e1d1a] px-6 py-3.5 text-sm font-bold text-white transition-colors group-hover:bg-opacity-90">
                  Tìm bãi cắm trại
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
