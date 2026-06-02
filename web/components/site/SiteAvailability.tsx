'use client';

import { Badge } from '@/components/ui/badge';
import { getSiteAvailability } from '@/lib/client-actions';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SiteAvailabilityProps {
  siteId: string;
  checkIn?: string;
  checkOut?: string;
  capacity?: { maxConcurrentBookings?: number };
  className?: string;
}

/**
 * SiteAvailability Component
 *
 * Hiển thị availability status của site với maxConcurrentBookings
 * - Designated (capacity = 1): "Available" / "Booked"
 * - Undesignated (capacity > 1): "X sites left" / "Fully booked"
 */
export function SiteAvailability({
  siteId,
  checkIn,
  checkOut,
  capacity,
  className,
}: SiteAvailabilityProps) {
  const maxConcurrentBookings = capacity?.maxConcurrentBookings ?? 1;
  const { data, isLoading, error } = useQuery({
    queryKey: ['site-availability', siteId, checkIn, checkOut],
    queryFn: async () => {
      const response = await getSiteAvailability(siteId, checkIn, checkOut);
      return response.data as {
        isAvailable: boolean;
        reason?: string;
        blockedDates?: string[];
        spotsLeft?: number;
      };
    },
    enabled: !!siteId,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (error || !data) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Unable to check
      </Badge>
    );
  }

  const isAvailable = data.isAvailable;
  const spotsLeft = data.spotsLeft ?? 0;

  // Designated site (capacity = 1)
  if (maxConcurrentBookings === 1) {
    return isAvailable ? (
      <Badge variant="outline" className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)] transition-all ${className}`}>
        <CheckCircle className="mr-1 h-3 w-3" />
        Còn trống
      </Badge>
    ) : (
      <Badge variant="outline" className={`bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.05)] ${className}`}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Đã đặt
      </Badge>
    );
  }

  // Undesignated site (capacity > 1) - Hipcamp style
  if (spotsLeft === 0) {
    return (
      <Badge variant="outline" className={`bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.05)] ${className}`}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Hết chỗ
      </Badge>
    );
  }

  // Show "X sites left"
  const urgencyStyle =
    spotsLeft === 1
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.2)]'
      : spotsLeft <= 3
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';

  return (
    <Badge variant="outline" className={`${urgencyStyle} transition-all ${className}`}>
      <CheckCircle className="mr-1 h-3 w-3" />
      Còn {spotsLeft} chỗ {spotsLeft === 1 ? 'cuối' : ''}
    </Badge>
  );
}

/**
 * SiteCapacityBadge Component
 *
 * Hiển thị loại site dựa trên capacity.maxConcurrentBookings
 */
export function SiteCapacityBadge({
  capacity,
  className,
}: {
  capacity: { maxConcurrentBookings: number };
  className?: string;
}) {
  const maxConcurrentBookings = capacity.maxConcurrentBookings;
  if (maxConcurrentBookings === 1) {
    return (
      <Badge variant="outline" className={className}>
        Designated Site
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      Undesignated ({maxConcurrentBookings} spots)
    </Badge>
  );
}
