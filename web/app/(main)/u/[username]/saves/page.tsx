'use client';

import { FavoriteButton } from '@/components/property/FavoriteButton';
import { SiteFavoriteButton } from '@/components/site/SiteFavoriteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFavorites } from '@/hooks/useFavorite';
import { useAuthStore } from '@/store/auth.store';
import { Calendar, Heart, Loader2, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SavesPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.username === username;

  const { data: allFavorites, isLoading } = useFavorites('all');

  const propertyFavorites = allFavorites?.filter(fav => fav.property) || [];
  const siteFavorites = allFavorites?.filter(fav => fav.site) || [];

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${Math.round(price / 1000000)}tr`;
    } else if (price >= 1000) {
      return `${Math.round(price / 1000)}k`;
    }
    return `${price}`;
  };

  const getCoverPhoto = (photos: any[]) => {
    const coverPhoto = photos?.find((p: any) => p.isCover);
    if (coverPhoto) return coverPhoto.url;
    return photos?.[0]?.url || photos?.[0] || '/placeholder-campsite.jpg';
  };

  if (!isOwnProfile) {
    return (
      <div className="py-12 text-center">
        <Heart className="text-muted-foreground mx-auto h-12 w-12" />
        <h2 className="mt-4 text-lg font-semibold">Danh sách riêng tư</h2>
        <p className="text-muted-foreground mt-2">
          Bạn không thể xem danh sách đã lưu của người dùng khác
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Heart className="h-6 w-6 fill-red-500 text-red-500" />
          Danh sách của bạn
        </h1>
        <p className="text-muted-foreground">
          Bạn đã lưu {allFavorites?.length || 0} địa điểm
        </p>
      </div>

      {/* Tabs for Properties and Sites */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            Tất cả ({allFavorites?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="properties">
            Khu đất ({propertyFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="sites">
            Địa điểm ({siteFavorites.length})
          </TabsTrigger>
        </TabsList>

        {/* All Favorites */}
        <TabsContent value="all">
          {allFavorites && allFavorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allFavorites.map(favorite => {
                const item = favorite.property || favorite.site;
                const isProperty = !!favorite.property;

                return (
                  <Card
                    key={favorite._id}
                    className="group overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    <Link
                      href={
                        isProperty
                          ? `/land/${item?.slug || item?._id}`
                          : `/sites/${item?.slug || item?._id}`
                      }
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        {/* Favorite Button */}
                        <div className="absolute top-3 left-3 z-10">
                          {isProperty ? (
                            <FavoriteButton
                              propertyId={item?._id || ''}
                              className="bg-white/90 backdrop-blur-sm hover:bg-white"
                            />
                          ) : (
                            <SiteFavoriteButton
                              siteId={item?._id || ''}
                              className="bg-white/90 backdrop-blur-sm hover:bg-white"
                            />
                          )}
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <Badge
                            variant={isProperty ? 'default' : 'secondary'}
                            className="rounded-full"
                          >
                            {isProperty ? 'Khu đất' : 'Địa điểm'}
                          </Badge>
                        </div>

                        <Image
                          src={getCoverPhoto(
                            (isProperty
                              ? favorite.property?.photos
                              : [favorite.site?.photos?.[0]]) as any,
                          )}
                          alt={item?.name || ''}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    </Link>

                    <CardContent className="space-y-2 p-4">
                      {/* Rating */}
                      {isProperty && favorite.property?.stats?.averageRating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-base">👍</span>
                          <span className="text-sm font-semibold">
                            {Math.round(
                              (favorite.property.stats.averageRating / 5) * 100,
                            )}
                            %
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ({favorite.property.stats.totalReviews || 0})
                          </span>
                        </div>
                      ) : null}

                      {/* Name */}
                      <h3 className="line-clamp-1 text-lg font-semibold">
                        {item?.name}
                      </h3>

                      {/* Location */}
                      <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">
                          {isProperty
                            ? `${favorite.property?.location?.city}, ${favorite.property?.location?.state}`
                            : `${favorite.site?.propertyRef}`}
                        </span>
                      </div>

                      {/* Capacity for Site */}
                      {!isProperty && favorite.site?.capacity && (
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          <span>
                            Tối đa {favorite.site.capacity.maxGuests} khách
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="pt-1">
                        <span className="text-muted-foreground text-sm">
                          từ{' '}
                        </span>
                        <span className="text-lg font-bold">
                          {isProperty
                            ? formatPrice(
                                favorite.property?.pricing?.minPrice || 0,
                              )
                            : formatPrice(
                                favorite.site?.pricing?.basePrice || 0,
                              )}
                          ₫
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {' '}
                          / đêm
                        </span>
                      </div>

                      {/* Notes */}
                      {favorite.notes && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                          <p className="text-sm text-gray-700 italic">
                            "{favorite.notes}"
                          </p>
                        </div>
                      )}

                      {/* Saved Date */}
                      <div className="text-muted-foreground flex items-center gap-1 pt-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Đã lưu{' '}
                          {new Date(favorite.createdAt).toLocaleDateString(
                            'vi-VN',
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        {/* Properties Only */}
        <TabsContent value="properties">
          {propertyFavorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {propertyFavorites.map(favorite => (
                <PropertyCard
                  key={favorite._id}
                  favorite={favorite}
                  getCoverPhoto={getCoverPhoto}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="property" />
          )}
        </TabsContent>

        {/* Sites Only */}
        <TabsContent value="sites">
          {siteFavorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {siteFavorites.map(favorite => (
                <SiteCard
                  key={favorite._id}
                  favorite={favorite}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="site" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PropertyCard({
  favorite,
  getCoverPhoto,
  formatPrice,
}: {
  favorite: any;
  getCoverPhoto: (photos: any[]) => string;
  formatPrice: (price: number) => string;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/land/${favorite.property?.slug || favorite.property?._id}`}>
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute top-3 left-3 z-10">
            <FavoriteButton
              propertyId={favorite.property?._id || ''}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            />
          </div>
          <Image
            src={getCoverPhoto(favorite.property?.photos)}
            alt={favorite.property?.name || ''}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        {favorite.property?.stats?.averageRating && (
          <div className="flex items-center gap-1">
            <span className="text-base">👍</span>
            <span className="text-sm font-semibold">
              {Math.round((favorite.property.stats.averageRating / 5) * 100)}%
            </span>
            <span className="text-muted-foreground text-xs">
              ({favorite.property.stats.totalReviews || 0})
            </span>
          </div>
        )}

        <h3 className="line-clamp-1 text-lg font-semibold">
          {favorite.property?.name}
        </h3>

        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4" />
          <span>
            {favorite.property?.location?.city},{' '}
            {favorite.property?.location?.state}
          </span>
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>{favorite.property?.stats?.totalSites || 0} địa điểm</span>
          <span>·</span>
          <span>
            {favorite.property?.propertyType === 'private_land'
              ? 'Đất tư nhân'
              : favorite.property?.propertyType === 'campground'
                ? 'Khu cắm trại'
                : favorite.property?.propertyType === 'farm'
                  ? 'Trang trại'
                  : 'Khu nghỉ dưỡng'}
          </span>
        </div>

        <div className="pt-1">
          <span className="text-muted-foreground text-sm">từ </span>
          <span className="text-lg font-bold">
            {formatPrice(favorite.property?.pricing?.minPrice || 0)}₫
          </span>
          <span className="text-muted-foreground text-sm"> / đêm</span>
        </div>

        {favorite.notes && (
          <div className="mt-3 rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-700 italic">"{favorite.notes}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SiteCard({
  favorite,
  formatPrice,
}: {
  favorite: any;
  formatPrice: (price: number) => string;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/sites/${favorite.site?.slug || favorite.site?._id}`}>
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute top-3 left-3 z-10">
            <SiteFavoriteButton
              siteId={favorite.site?._id || ''}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            />
          </div>
          <Image
            src={favorite.site?.photos?.[0] || '/placeholder-campsite.jpg'}
            alt={favorite.site?.name || ''}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold">
          {favorite.site?.name}
        </h3>

        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <span>
            {favorite.site?.siteType === 'tent'
              ? 'Lều'
              : favorite.site?.siteType === 'rv'
                ? 'RV'
                : favorite.site?.siteType === 'cabin'
                  ? 'Cabin'
                  : 'Khác'}
          </span>
        </div>

        {favorite.site?.capacity && (
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Users className="h-4 w-4" />
            <span>Tối đa {favorite.site.capacity.maxGuests} khách</span>
          </div>
        )}

        <div className="pt-1">
          <span className="text-lg font-bold">
            {formatPrice(favorite.site?.pricing?.basePrice || 0)}₫
          </span>
          <span className="text-muted-foreground text-sm"> / đêm</span>
        </div>

        {favorite.notes && (
          <div className="mt-3 rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-700 italic">"{favorite.notes}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type?: 'property' | 'site' }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Heart className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-xl font-semibold text-gray-700">
          {type === 'property'
            ? 'Chưa có khu đất yêu thích'
            : type === 'site'
              ? 'Chưa có địa điểm yêu thích'
              : 'Chưa lưu địa điểm nào'}
        </h3>
        <p className="text-muted-foreground mb-6 text-center">
          Hãy khám phá và lưu những địa điểm bạn yêu thích
          <br />
          để dễ dàng tìm lại sau này
        </p>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
          <Link href="/search">Khám phá địa điểm</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
