'use client';

import { Card } from '@/components/ui/card';
import { Caravan, Sparkles, Tent } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const accommodationTypes = [
  {
    id: 'tent',
    name: 'Tent',
    icon: Tent,
    image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
    description: 'Trải nghiệm camping truyền thống với lều',
    searchParam: 'tent',
  },
  {
    id: 'rv',
    name: 'RV',
    icon: Caravan,
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
    description: 'Không gian cho xe cắm trại và RV',
    searchParam: 'rv',
  },
  {
    id: 'glamping',
    name: 'Glamping',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    description: 'Camping sang trọng với đầy đủ tiện nghi',
    searchParam: 'glamping',
  },
];

export default function AccommodationTypes() {
  return (
    <section className="pb-20 bg-white">
      <div className="container-padding mx-auto max-w-7xl">
        <div className="mb-8">
          {/* <span className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            Chọn phong cách của bạn
          </span> */}
          <h2 className="mb-4 text-xl font-bold md:text-2xl">
            Khám Phá Các Loại Hình Cắm Trại
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {accommodationTypes.map(type => {
            const Icon = type.icon;
            return (
              <Link
                key={type.id}
                href={`/search?campingStyle=${type.searchParam}`}
              >
                <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative h-80">
                    <Image
                      src={type.image}
                      alt={type.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                      <div className="flex-center mb-4 rounded-full bg-white/20 p-5 backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Icon className="h-14 w-14" />
                      </div>
                      <h3 className="mb-3 text-3xl font-bold">{type.name}</h3>
                      <p className="text-center text-sm opacity-90">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
