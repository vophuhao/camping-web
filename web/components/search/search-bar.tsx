'use client';

import { Calendar, MapPin, Search, Users, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { cn } from '@/lib/utils';
import { type DateRangeType } from './date-range-picker';
import { DateRangePopover } from './date-range-popover';
import { GuestPopover } from './guest-popover';
import { LocationSearch } from './location-search';

interface SearchBarProps {
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
  isMobileCollapsed?: boolean;
}

export function SearchBar({
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
  loading = false,
  onRecentSearchDateSelect,
  onRecentSearchGuestsSelect,
  isMobileCollapsed = true,
}: SearchBarProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileModalOpen]);

  // Helper to render search fields
  const renderSearchFields = (isMobileModal: boolean) => {
    return (
      <div className={cn(
        "flex w-full items-stretch",
        isMobileModal ? "flex-col gap-4" : "flex-col md:flex-row gap-3 md:gap-4 bg-white md:bg-transparent p-4 md:p-0 rounded-xl border border-gray-200 md:border-none shadow-sm md:shadow-none"
      )}>
        {/* Location Popover */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:shadow-md w-full',
                locationOpen && 'border-gray-900 ring-2 ring-gray-900',
              )}
            >
              <MapPin className="h-5 w-5 shrink-0 text-gray-700" />
              <span className="truncate text-base text-gray-950 font-medium">
                {location || (isMobileModal ? 'Search' : 'Where to?')}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] md:w-[500px] p-0"
            align="start"
            sideOffset={8}
          >
            <div className="p-4">
              <LocationSearch
                value={location}
                onChange={(value, coordinates) => {
                  onLocationChange(value);
                  if (coordinates && onLocationSelect) {
                    onLocationSelect(value, coordinates);
                  }
                }}
                onNearbyClick={() => {
                  onNearbyClick?.();
                  setLocationOpen(false);
                }}
                onClose={() => setLocationOpen(false)}
                showDropdown={false}
                showInlineResults={true}
                placeholder={isMobileModal ? 'Search' : 'Where to?'}
                className="w-full"
                onDateRangeSelect={onRecentSearchDateSelect}
                onGuestsSelect={onRecentSearchGuestsSelect}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Popover */}
        <DateRangePopover
          dateRange={dateRange}
          onDateChange={onDateChange}
          open={dateOpen}
          onOpenChange={setDateOpen}
          placeholder="Add dates"
          buttonClassName={cn(
            'h-auto flex-1 gap-3 rounded-lg border-gray-300 px-4 py-3.5 shadow-sm hover:shadow-md w-full',
            dateOpen && 'border-gray-900 ring-2 ring-gray-900',
          )}
          align="center"
          dateFormat="d MMM"
          icon={<Calendar className="h-5 w-5 shrink-0 text-gray-700" />}
        />

        {/* Guest Popover */}
        <GuestPopover
          adults={guests}
          childrenCount={childrenCount}
          pets={pets}
          onAdultsChange={onGuestsChange}
          onChildrenChange={onChildrenChange}
          onPetsChange={onPetsChange}
          open={guestOpen}
          onOpenChange={setGuestOpen}
          buttonClassName={cn(
            'h-auto flex-1 gap-3 rounded-lg border-gray-300 px-4 py-3.5 shadow-sm hover:shadow-md w-full',
            guestOpen && 'border-gray-900 ring-2 ring-gray-900',
          )}
          align="end"
          icon={<Users className="h-5 w-5 shrink-0 text-gray-700" />}
          labels={{
            guestsText: guests => {
              const total = guests;
              if (total === 0) return 'Add guests';
              return `${total} guests`;
            },
          }}
        />

        {/* Search Button (Only shown in main layout, modal has its own bottom button) */}
        {!isMobileModal && (
          <Button
            size="lg"
            className="bg-primary hover:brightness-80 h-auto cursor-pointer rounded-lg px-8 py-3.5 text-base font-semibold w-full md:w-auto"
            onClick={onSearch}
            disabled={loading}
          >
            <Search className="h-5 w-5 text-white" />
            <span className="text-white">Search</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl">
      {/* 1. Normal Layout for Desktop and non-collapsed layouts */}
      <div className={cn(
        "w-full",
        isMobileCollapsed ? "hidden md:block" : "block"
      )}>
        {renderSearchFields(false)}
      </div>

      {/* 2. Collapsed Layout for Mobile Home Page */}
      {isMobileCollapsed && (
        <div className="flex flex-col gap-3 w-full md:hidden">
          {/* Collapsed Trigger Button */}
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:shadow-md"
          >
            <MapPin className="h-5 w-5 shrink-0 text-gray-700" />
            <span className="truncate text-base text-gray-400">
              {location || 'Where to?'}
            </span>
          </button>

          {/* Search Button */}
          <Button
            size="lg"
            className="bg-primary hover:brightness-80 h-auto cursor-pointer rounded-lg w-full py-3.5 text-base font-semibold"
            onClick={() => setIsMobileModalOpen(true)}
          >
            <Search className="h-5 w-5 text-white" />
            <span className="text-white">Search</span>
          </Button>
        </div>
      )}

      {/* 3. Full-screen Mobile Overlay Search Modal */}
      {mounted && isMobileCollapsed && isMobileModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white p-6 overflow-y-auto md:hidden animate-in fade-in slide-in-from-bottom duration-200">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </div>

          {/* Main Overlay Content */}
          <div className="flex-1 flex flex-col space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                Find yourself outside.
              </h2>
            </div>

            {/* Toggle destination/roadtrip (styled static mock or tab) */}
            <div className="inline-flex rounded-full bg-[#efeee9] p-1 self-start">
              <button className="rounded-full bg-white px-5 py-1.5 text-sm font-bold text-[#2f2d24] shadow-sm">
                Destination
              </button>
              <button className="rounded-full px-5 py-1.5 text-sm font-bold text-[#6b675d]">
                Roadtrip
              </button>
            </div>

            {/* Vertically stacked inputs in the Modal */}
            <div className="w-full">
              {renderSearchFields(true)}
            </div>
          </div>

          {/* Sticky Modal Search Action Button */}
          <div className="pt-4 border-t border-gray-100 mt-6 bg-white">
            <Button
              size="lg"
              className="bg-primary hover:brightness-80 h-auto cursor-pointer rounded-lg w-full py-3.5 text-base font-semibold text-white flex items-center justify-center gap-2"
              onClick={() => {
                onSearch();
                setIsMobileModalOpen(false);
              }}
              disabled={loading}
            >
              <Search className="h-5 w-5 text-white" />
              <span className="text-white">Search</span>
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
