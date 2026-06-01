'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getAllTours } from '@/lib/client-actions';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Star, Tent, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function FeaturedTours() {
  const { data: tours = [] } = useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const response = await getAllTours();
      return response.data || [];
    },
  });

  return (
    <section className="bg-linear-to-b from-gray-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 flex flex-col items-center justify-between md:flex-row">
          <div>
            <span className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold">
              Tour nổi bật
            </span>
            <h2 className="mb-3 text-4xl font-bold md:text-5xl">
              Tour Được Yêu Thích Nhất
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Những tour được đánh giá cao và lựa chọn nhiều nhất
            </p>
          </div>
          <Link href="/tours">
            <Button variant="outline" size="lg" className="mt-4 md:mt-0">
              Xem tất cả tours →
            </Button>
          </Link>
        </div>

        {tours.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tours.slice(0, 6).map((tour: Tour) => (
              <Card
                key={tour._id}
                className="group overflow-hidden border-0 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative h-64">
                  <Image
                    src={tour.images[0] || '/placeholder.jpg'}
                    alt={tour.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {tour.isActive && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        <TrendingUp className="h-3 w-3" />
                        HOT
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="mb-3 line-clamp-2 text-xl font-bold">
                    {tour.name}
                  </h3>
                  <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="text-primary h-4 w-4" />
                      {tour.durationDays}N{tour.durationNights}Đ
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="text-primary h-4 w-4" />
                      {tour.departurePoint}
                    </span>
                  </div>
                  {tour.rating && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(tour.rating!.average)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">
                        {tour.rating.average.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        ({tour.rating.count} đánh giá)
                      </span>
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      {tour.priceOptions && tour.priceOptions.length > 0 && (
                        <>
                          <p className="text-muted-foreground text-sm">Từ</p>
                          <p className="text-primary text-2xl font-bold">
                            {tour.priceOptions[0].price.toLocaleString('vi-VN')}
                            đ
                          </p>
                        </>
                      )}
                    </div>
                    <Link href={`/tour/${tour.slug || tour._id}`}>
                      <Button className="shadow-md">Xem chi tiết →</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-100 py-20 text-center">
            <Tent className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-muted-foreground text-lg">
              Đang cập nhật tours...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
