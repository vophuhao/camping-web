import { PropertyGrid } from '@/components/search/property-grid';
import { PropertySearchHeader } from '@/components/search/property-search-header';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface SearchPageProps {
  searchParams: Promise<{
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    pets?: string;
    minPrice?: string;
    maxPrice?: string;
    campingStyle?: string | string[]; // Can be string or array from URL
    amenities?: string | string[]; // Amenity IDs
    instantBook?: string;
    sort?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    page?: string;
    limit?: string;
  }>;
}

// Server Component - fetches data with automatic caching
async function fetchProperties(
  params: Record<string, string | number | string[] | boolean | undefined>,
) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else if (typeof value === 'boolean') {
          // Convert boolean to string for URL params
          queryParams.append(key, value.toString());
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    // Use native fetch for Server Components (not axios)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/properties/search?${queryParams.toString()}`,
      {
        cache: 'no-store', // Don't cache search results
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return {
        properties: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const result = await response.json();

    return {
      properties: result.data || [],
      pagination: result.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

// Loading component
function SearchLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

// Main Server Component
export default async function PropertySearchPage({
  searchParams,
}: SearchPageProps) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={null}>
        <PropertySearchHeader />
      </Suspense>

      <Suspense fallback={<SearchLoading />}>
        <PropertySearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Separate async component for content
async function PropertySearchContent({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  // Parse and normalize search params
  const normalizedParams = {
    city: params.city,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests) : undefined,
    pets: params.pets ? parseInt(params.pets) : undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    // Handle campingStyle - can be string or string[] from URL
    campingStyle: params.campingStyle
      ? Array.isArray(params.campingStyle)
        ? params.campingStyle
        : params.campingStyle.split(',').filter(Boolean)
      : undefined,
    // Handle amenities - can be string or string[] from URL
    amenities: params.amenities
      ? Array.isArray(params.amenities)
        ? params.amenities
        : params.amenities.split(',').filter(Boolean)
      : undefined,
    instantBook: params.instantBook === 'true' ? true : undefined,
    sortBy: params.sort || 'reviewCount', // Backend expects 'sortBy' param
    lat: params.lat ? parseFloat(params.lat) : undefined,
    lng: params.lng ? parseFloat(params.lng) : undefined,
    radius: params.radius ? parseFloat(params.radius) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 20,
  };

  // Fetch data on server
  const response = await fetchProperties(normalizedParams);
  const properties = response.properties;
  const activeProperties = properties.filter((p: any) => p.isActive);
  const totalResults = activeProperties.length;

  // Extract search coordinates if available
  const searchCoordinates =
    normalizedParams.lat && normalizedParams.lng
      ? { lat: normalizedParams.lat, lng: normalizedParams.lng }
      : null;

  return (
    <div className="w-full">
      <PropertyGrid
        initialProperties={activeProperties}
        totalResults={totalResults}
        searchCoordinates={searchCoordinates}
      />
    </div>
  );
}
