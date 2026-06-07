'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { DateRangeType } from './date-range-picker';
import { SearchBar } from './search-bar';

interface SearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onLocationSelect?: (
    location: string,
    coordinates?: { lat: number; lng: number },
  ) => void;
  onNearbyClick?: () => void;
  dateRange?: DateRangeType;
  onDateChange: (date?: DateRangeType) => void;
  guests: number;
  childrenCount: number;
  pets: number;
  onGuestsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onPetsChange: (value: number) => void;
  onSearch: () => void;
  loading?: boolean;
  onRecentSearchDateSelect?: (checkIn: string, checkOut: string) => void;
  onRecentSearchGuestsSelect?: (guests: number) => void;
}

export function SearchSheet({
  open,
  onOpenChange,
  location,
  onLocationChange,
  onLocationSelect,
  onNearbyClick,
  dateRange,
  onDateChange,
  guests,
  childrenCount,
  pets,
  onGuestsChange,
  onChildrenChange,
  onPetsChange,
  onSearch,
  loading,
  onRecentSearchDateSelect,
  onRecentSearchGuestsSelect,
}: SearchSheetProps) {
  const handleSearch = () => {
    onSearch();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle className="text-center">Tìm kiếm</SheetTitle>
        </SheetHeader>
        <div className="mb-6 flex justify-center">
          <SearchBar
            location={location}
            onLocationChange={onLocationChange}
            onLocationSelect={onLocationSelect}
            onNearbyClick={onNearbyClick}
            dateRange={dateRange}
            onDateChange={onDateChange}
            guests={guests}
            childrenCount={childrenCount}
            pets={pets}
            onGuestsChange={onGuestsChange}
            onChildrenChange={onChildrenChange}
            onPetsChange={onPetsChange}
            onSearch={handleSearch}
            loading={loading}
            onRecentSearchDateSelect={onRecentSearchDateSelect}
            onRecentSearchGuestsSelect={onRecentSearchGuestsSelect}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
