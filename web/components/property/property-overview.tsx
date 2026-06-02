'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SuperhostBadge } from '@/components/property/SuperhostBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatModal } from '@/store/chatstore';
import type { Property } from '@/types/property-site';
import { MapPin, Star, TreePine, Users } from 'lucide-react';

interface PropertyOverviewProps {
  property: Property;
}

const propertyTypeLabels: Record<string, string> = {
  private_land: 'Đất tư nhân',
  campground: 'Khu cắm trại',
  ranch: 'Trang trại',
  farm: 'Nông trại',
  retreat_center: 'Trung tâm nghỉ dưỡng',
};

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const { openChat } = useChatModal();

  const handleContactHost = () => {
    if (typeof property.host === 'object' && property.host) {
      openChat(property.host._id, {
        username: property.host.username,
        avatarUrl: property.host.avatarUrl,
        email: property.host.email,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
        {property.tagline && (
          <p className="text-muted-foreground mt-2 text-lg">
            {property.tagline}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>
            {property.location.city}, {property.location.state}
          </span>
        </div>
        {property.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {' '}
              {property.rating.average.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({property.rating.count} đánh giá)
            </span>
          </div>
        )}
        <Badge variant="outline">
          {propertyTypeLabels[property.propertyType] || property.propertyType}
        </Badge>
      </div>

      {/* Host Info */}
      {typeof property.host === 'object' && 'username' in property.host && (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={property.host.avatarUrl}
              alt={property.host.username || property.host.email}
            />
            <AvatarFallback>
              {(property.host.username || property.host.email)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">
                Chủ đất:{' '}
                {property.host.username || property.host.email.split('@')[0]}
              </p>
              {(property as any).isSuperhost && (
                <SuperhostBadge
                  size="sm"
                  showTooltip
                  superhostSince={(property as any).superhostSince}
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {property.host.email}
            </p>
            {property.host.bio && (
              <p className="text-muted-foreground mt-1 text-xs">
                {property.host.bio}
              </p>
            )}
          </div>
          <button
            onClick={handleContactHost}
            className="text-sm font-medium text-primary hover:underline cursor-pointer transition-colors hover:text-primary/80"
          >
            Liên hệ
          </button>
        </div>
      )}

      {/* Property Info */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {property.landSize && (
          <div className="flex items-center gap-2">
            <TreePine className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-sm font-medium">
                {property.landSize.value}{' '}
                {property.landSize.unit === 'acres'
                  ? 'mẫu Anh'
                  : property.landSize.unit === 'hectares'
                    ? 'hecta'
                    : 'm²'}
              </p>
              <p className="text-muted-foreground text-xs">Diện tích</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-5 w-5" />
          <div>
            <p className="text-sm font-medium">
              {property.stats.totalSites} vị trí
            </p>
            <p className="text-muted-foreground text-xs">Số vị trí cắm trại</p>
          </div>
        </div>
      </div>

      {/* Tabs: Description & Policies */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description">Mô tả</TabsTrigger>
          <TabsTrigger value="policies">Chính sách</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4 space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{property.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* Cancellation Policy */}
            <div className="rounded-lg border p-4">
              <p className="mb-2 font-medium">Chính sách hủy:</p>
              <p className="text-muted-foreground text-sm">
                {property.cancellationPolicy?.type === 'flexible' &&
                  'Linh hoạt - Hoàn tiền đầy đủ nếu hủy trước 24h'}
                {property.cancellationPolicy?.type === 'moderate' &&
                  'Trung bình - Hoàn tiền 50% nếu hủy trước 5 ngày'}
                {property.cancellationPolicy?.type === 'strict' &&
                  'Nghiêm ngặt - Không hoàn tiền sau khi đặt'}
                {!property.cancellationPolicy && 'Chưa có chính sách hủy'}
              </p>
            </div>

            {/* Pet & Children Policy */}
            <div className="grid gap-4 md:grid-cols-2">
              {property.petPolicy && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">Thú cưng:</p>
                  <p className="text-muted-foreground text-sm">
                    {property.petPolicy.allowed
                      ? `Cho phép${property.petPolicy.maxPets ? ` (tối đa ${property.petPolicy.maxPets})` : ''}`
                      : 'Không cho phép'}
                  </p>
                </div>
              )}
              {property.childrenPolicy && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">Trẻ em:</p>
                  <p className="text-muted-foreground text-sm">
                    {property.childrenPolicy.allowed
                      ? 'Cho phép'
                      : 'Không cho phép'}
                  </p>
                </div>
              )}
            </div>

            {/* Rules */}
            {property.rules && property.rules.length > 0 && (
              <div>
                <p className="mb-2 font-medium">Quy định:</p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  {property.rules.map((rule, index) => {
                    const ruleText =
                      typeof rule === 'object' && rule !== null
                        ? 'text' in rule
                          ? (rule as { text: string }).text
                          : 'description' in rule
                            ? (rule as { description: string }).description
                            : String(rule)
                        : String(rule);

                    return <li key={index}>{ruleText}</li>;
                  })}
                </ul>
              </div>
            )}

            <p className="text-muted-foreground text-xs">
              * Giờ nhận phòng và trả phòng được quy định riêng cho từng vị trí
              cắm trại
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}