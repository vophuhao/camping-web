/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Home Page API Functions
 * Server-side data fetching for HomePage components
 */

import type { Property } from '@/types/property-site';


const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}


/**
 * Get featured properties for homepage
 * Returns top-rated properties with most bookings
 */
export async function getFeaturedProperties(limit = 8): Promise<Property[]> {
  try {
    const response = await fetch(
      `${API_URL}/properties/featured/list?limit=${limit}`,
      {
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      },
    );

    if (!response.ok) {
      console.error(
        'Failed to fetch featured properties:',
        response.statusText,
      );
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    return [];
  }
}

/**
 * Get popular properties sorted by total reviews and ratings
 */
export async function getPopularProperties(limit = 8): Promise<Property[]> {
  try {
    const response = await fetch(
      `${API_URL}/properties/search?sortBy=popular&limit=${limit}&isActive=true`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      console.error('Failed to fetch popular properties:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch popular properties:', error);
    return [];
  }
}

/**
 * Get properties grouped by location/state
 * Uses geospatial coordinates for top destinations
 */
export async function getTopDestinations(limit = 6): Promise<
  Array<{
    state: string;
    city?: string;
    coordinates: { lat: number; lng: number };
    count: number;
    sampleProperty: Property;
  }>
> {
  try {
    // Get properties grouped by state
    const response = await fetch(
      `${API_URL}/properties/search?limit=100&isActive=true`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );

    if (!response.ok) {
      console.error('Failed to fetch properties:', response.statusText);
      return [];
    }

    const data = await response.json();
    const properties: Property[] = data.data || [];

    // Group by state and count
    const stateMap = new Map<
      string,
      {
        count: number;
        properties: Property[];
        coordinates: { lat: number; lng: number };
        city?: string;
      }
    >();

    properties.forEach(property => {
      const state = property.location?.state;
      if (!state) return;

      const existing = stateMap.get(state);

      // Extract coordinates [lng, lat] from GeoJSON format
      const lng = property.location?.coordinates?.coordinates?.[0];
      const lat = property.location?.coordinates?.coordinates?.[1];

      if (existing) {
        existing.count++;
        existing.properties.push(property);
      } else if (lat && lng) {
        stateMap.set(state, {
          count: 1,
          properties: [property],
          coordinates: { lat, lng },
          city: property.location.city,
        });
      }
    });

    // Convert to array and sort by count
    const destinations = Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        city: data.city,
        coordinates: data.coordinates,
        count: data.count,
        sampleProperty:
          data.properties.find(p => p.photos?.[0]) || data.properties[0],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return destinations;
  } catch (error) {
    console.error('Failed to fetch top destinations:', error);
    return [];
  }
}

/**
 * Get recent reviews across all properties
 */
export async function getRecentReviews(limit = 6): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/reviews/recent?limit=${limit}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch recent reviews:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch recent reviews:', error);
    return [];
  }
}

/**
 * Get platform statistics for homepage
 */
export async function getPlatformStats(): Promise<{
  totalProperties: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
}> {
  try {
    // This would need a new backend endpoint
    // For now, return mock data
    return {
      totalProperties: 50,
      totalBookings: 10000,
      totalReviews: 5000,
      averageRating: 4.8,
    };
  } catch (error) {
    console.error('Failed to fetch platform stats:', error);
    return {
      totalProperties: 0,
      totalBookings: 0,
      totalReviews: 0,
      averageRating: 0,
    };
  }
}
