'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getUserByUsername, getUserStats } from '@/lib/client-actions';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CheckCircle2,
  Eye,
  Heart,
  Loader2,
  MapPin,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  // Decode username to handle special characters and spaces
  const username = decodeURIComponent(params.username as string);
  const { user: currentUser } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => getUserStats(username),
    enabled: !!username,
  });

  const profile = data?.data as UserProfile | undefined;
  const stats = statsData?.data as
    | { bookings: number; orders: number; reviews: number; saves?: number }
    | undefined;
  const isOwnProfile = currentUser?.username === username;

  // Determine active tab
  const getActiveTab = () => {
    if (pathname.includes('/saves')) return 'saves';
    if (pathname.includes('/reviews')) return 'reviews';
    if (pathname.includes('/posts')) return 'posts';
    if (pathname.includes('/spots')) return 'spots';
    return 'trips';
  };

  const activeTab = getActiveTab();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Không tìm thấy người dùng</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberSince = format(new Date(profile.createdAt), 'MMMM yyyy', {
    locale: vi,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left Sidebar - Profile Info - STICKY */}
          <div className="space-y-4 lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-8">
              {/* Profile Card */}
              <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  {/* Avatar */}
                  <div className="mb-4 flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-gray-100">
                        <AvatarImage
                          src={profile.avatarUrl}
                          alt={profile.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl text-white">
                          {profile.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {profile.isVerified && (
                        <div className="absolute right-0 bottom-0 rounded-full bg-white p-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <h1 className="mt-3 text-xl font-bold text-gray-900">
                      {profile.username}
                    </h1>
                    {profile.role === 'host' && (
                      <Badge className="mt-2 border-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs text-white">
                        Chủ nhà
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Member Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="h-3.5 w-3.5 flex-shrink-0 text-rose-500" />
                      <span className="text-xs">Camper từ {memberSince}</span>
                    </div>
                    {profile.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                        <span className="text-xs">{profile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio ? (
                    <p className="mt-3 text-xs leading-relaxed text-gray-600">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-gray-400 italic">
                      Chưa có giới thiệu
                    </p>
                  )}

                  {/* Manage Account Button */}
                  {isOwnProfile && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full border-2 hover:bg-gray-50"
                    >
                      <Link href="/u/edit">
                        <Settings className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs">Quản lý tài khoản</span>
                      </Link>
                    </Button>
                  )}

                  {/* View on map */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    <span className="text-xs">Xem trên bản đồ</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Trusted Camper Card */}
              <Card className="shadow-md">
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Camper đáng tin cậy
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-gray-700">Email đã xác thực</span>
                      </div>
                    </div>
                    {!profile.isVerified && isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Xác thực email
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Balance Card */}
              {/* {isOwnProfile && (
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-gray-900">
                            0₫
                          </div>
                          <div className="text-xs text-gray-600">Số dư</div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200">
                          <span className="text-xl">💰</span>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="h-auto justify-start p-0 text-xs text-emerald-700 hover:text-emerald-800"
                      >
                        → Nhận điểm thưởng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )} */}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* Stats Bar */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-8">
                <Link
                  href={`/u/${username}/trips`}
                  className={`rounded-lg px-2 py-3 text-center transition-all ${activeTab === 'trips'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                    }`}
                >
                  <div className="text-lg font-bold">
                    {stats?.bookings ?? 0}
                  </div>
                  <div className="mt-1 text-xs">Chuyến đi</div>
                </Link>
                <Link
                  href={`/u/${username}/saves`}
                  className={`rounded-lg px-2 py-3 text-center transition-all ${activeTab === 'saves'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                    }`}
                >
                  <div className="text-lg font-bold">{stats?.saves ?? 0}</div>
                  <div className="mt-1 text-xs">Đã lưu</div>
                </Link>

                {/* Bài viết diễn đàn */}
                {isOwnProfile && (
                  <Link
                    href={`/u/${username}/posts`}
                    className={`rounded-lg px-2 py-3 text-center transition-all ${activeTab === 'posts'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-lg font-bold">📝</div>
                    <div className="mt-1 text-xs">Bài viết</div>
                  </Link>
                )}

                {/* Địa điểm chia sẻ */}
                {isOwnProfile && (
                  <Link
                    href={`/u/${username}/spots`}
                    className={`rounded-lg px-2 py-3 text-center transition-all ${activeTab === 'spots'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-lg font-bold">🏕️</div>
                    <div className="mt-1 text-xs">Địa điểm</div>
                  </Link>
                )}

                {/* Orders & Reviews (commented out) */}
                {/* ... */}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
