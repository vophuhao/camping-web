import type { Property } from '@/types/property-site';
import Image from 'next/image';
import Link from 'next/link';
import RevealOnScroll from '../reveal-on-scroll';
import { StaggerContainer, StaggerItem } from '../stagger-animation';

interface TopDestinationsProps {
  destinations: Array<{
    state: string;
    city?: string;
    coordinates: { lat: number; lng: number };
    count: number;
    sampleProperty: Property;
  }>;
}

/**
 * TopDestinations Component (Server Component)
 * Shows top camping destinations grouped by state/region with geospatial coordinates
 */
export default function TopDestinations({
  destinations,
}: TopDestinationsProps) {
  if (!destinations || destinations.length === 0) {
    return null;
  }

  return (
    <section className="pb-20 bg-white">
      <div className="container-padding mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-8">
            {/* <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
              Điểm đến hàng đầu
            </span> */}
            <h2 className="mb-4 text-xl font-bold md:text-2xl">
              Khám Phá Việt Nam
            </h2>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(destination => {
            // Build search URL with geospatial coordinates
            const searchUrl = `/search?lat=${destination.coordinates.lat}&lng=${destination.coordinates.lng}&radius=50`;

            return (
              <StaggerItem key={destination.state}>
                <Link href={searchUrl}>
                  <DestinationCard destination={destination} />
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

function DestinationCard({
  destination,
}: {
  destination: {
    state: string;
    city?: string;
    coordinates: { lat: number; lng: number };
    count: number;
    sampleProperty: Property;
  };
}) {
  const mainPhoto =
    (destination.sampleProperty?.photos?.[0] as { url: string })?.url ||
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800';

  return (
    <div className="group block cursor-pointer transition-all duration-500 ease-out hover:-translate-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl shadow-sm transition-shadow duration-500 group-hover:shadow-md">
        <Image
          src={mainPhoto}
          alt={destination.state}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="mt-4 px-1">
        <h3 className="text-xl font-bold text-gray-900">
          {destination.state}
        </h3>
        <p className="mt-1 text-base text-gray-600">
          {destination.count} địa điểm
        </p>
      </div>
    </div>
  );
}


