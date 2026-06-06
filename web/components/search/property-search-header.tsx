'use client';

import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CompactSearchBar } from './compact-search-bar';
import type { DateRangeType } from './date-range-picker';
import { saveSearchToHistory } from './location-search';
import { PropertyFilter } from './property-filter';
import { SearchSheet } from './search-sheet';

export function PropertySearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Parse current filters from URL
  const [location, setLocation] = useState(searchParams.get('city') || '');
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      return { lat: Number(lat), lng: Number(lng) };
    }
    return null;
  });
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    if (checkIn && checkOut) {
      return {
        from: new Date(checkIn),
        to: new Date(checkOut),
      };
    }
    return undefined;
  });
  const [guests, setGuests] = useState(
    parseInt(searchParams.get('guests') || '0'),
  );
  const [childrenCount, setChildrenCount] = useState(0);
  const [pets, setPets] = useState(parseInt(searchParams.get('pets') || '0'));

  const handleSearch = () => {
    const params = new URLSearchParams();

    // Add coordinates if available (geospatial search)
    if (coordinates) {
      params.set('lat', coordinates.lat.toString());
      params.set('lng', coordinates.lng.toString());
      params.set('radius', '50'); // 50km radius
      // Save to recent searches
      const totalGuests = guests + childrenCount;
      saveSearchToHistory(
        location,
        coordinates,
        dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        totalGuests || undefined,
      );
    }
    // Otherwise use city name for text-based search
    else if (location) {
      params.set('city', location);
    }

    if (dateRange?.from) {
      params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    }
    if (dateRange?.to) {
      params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    }
    const totalGuests = guests + childrenCount;
    if (totalGuests) params.set('guests', totalGuests.toString());
    if (pets > 0) params.set('pets', pets.toString());

    router.push(`/search?${params.toString()}`);
  };

  const handleNearbySearch = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          setCoordinates(coords);
          setLocation('Vị trí hiện tại');

          const params = new URLSearchParams();
          params.set('lat', latitude.toString());
          params.set('lng', longitude.toString());
          params.set('radius', '50'); // 50km radius

          setSheetOpen(false);
          router.push(`/search?${params.toString()}`);
        },
        error => {
          console.error('Error getting location:', error);
          alert('Không thể lấy vị trí hiện tại');
        },
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị');
    }
  };

  const handleLocationSelect = (
    loc: string,
    coords?: { lat: number; lng: number },
  ) => {
    setLocation(loc);
    if (coords) {
      setCoordinates(coords);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container px-4 py-3">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-3 md:gap-4">
            {/* Compact Search Bar */}
            <div className="w-full md:w-auto flex justify-center md:shrink-0">
              <CompactSearchBar
                location={location}
                dateRange={dateRange}
                guests={guests}
                childrenCount={childrenCount}
                onClick={() => setSheetOpen(true)}
              />
            </div>

            {/* Property Filters */}
            <div className="w-full md:flex-1 overflow-x-auto py-1 scrollbar-none">
              <PropertyFilter />
            </div>
          </div>
        </div>
      </div>

      {/* Search Sheet */}
      <SearchSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        location={location}
        onLocationChange={setLocation}
        onLocationSelect={handleLocationSelect}
        onNearbyClick={handleNearbySearch}
        dateRange={dateRange}
        onDateChange={setDateRange}
        guests={guests}
        childrenCount={childrenCount}
        pets={pets}
        onGuestsChange={setGuests}
        onChildrenChange={setChildrenCount}
        onPetsChange={setPets}
        onSearch={handleSearch}
        loading={false}
        onRecentSearchDateSelect={(checkIn, checkOut) => {
          setDateRange({
            from: new Date(checkIn),
            to: new Date(checkOut),
          });
        }}
        onRecentSearchGuestsSelect={totalGuests => {
          setGuests(totalGuests);
          setChildrenCount(0);
        }}
      />
    </>
  );
}
