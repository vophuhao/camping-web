'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Review } from '@/types/property-site';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Building2,
  CheckCircle,
  Home,
  MessageSquare,
  Star,
  ThumbsUp,
} from 'lucide-react';
import React, { useState } from 'react';

interface PropertySiteReviewsProps {
  reviews: Review[];
  propertyName: string;
  siteName: string;
  propertyRatingStats?: {
    location: number;
    communication: number;
    value: number;
  };
  siteRatingStats?: {
    cleanliness: number;
    accuracy: number;
  };
  overallRating?: number;
  totalReviews?: number;
}

export default function PropertySiteReviews({
  reviews,
  propertyName,
  siteName,
  propertyRatingStats,
  siteRatingStats,
  overallRating,
  totalReviews,
}: PropertySiteReviewsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'property' | 'site'>(
    'all',
  );

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    }[size];

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {overallRating && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Overall Score */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div
                    className={`text-5xl font-bold ${getRatingColor(
                      overallRating,
                    )}`}
                  >
                    {overallRating.toFixed(1)}
                  </div>
                  <div className="mt-1">{renderStars(overallRating, 'md')}</div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {totalReviews} đánh giá
                  </p>
                </div>
                <Separator orientation="vertical" className="h-24" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      Đánh giá trung bình
                    </p>
                    <p className="text-sm font-medium">
                      {overallRating >= 4.8
                        ? 'Xuất sắc'
                        : overallRating >= 4.5
                          ? 'Rất tốt'
                          : overallRating >= 4.0
                            ? 'Tốt'
                            : overallRating >= 3.5
                              ? 'Khá'
                              : 'Trung bình'}
                    </p>
                  </div>
                  {overallRating >= 4.5 && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Được đề xuất
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-3">
                {propertyRatingStats && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vị trí</span>
                      <div className="flex items-center gap-2">
                        {renderStars(propertyRatingStats.location, 'sm')}
                        <span className="w-8 text-right font-medium">
                          {propertyRatingStats.location.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Giao tiếp</span>
                      <div className="flex items-center gap-2">
                        {renderStars(propertyRatingStats.communication, 'sm')}
                        <span className="w-8 text-right font-medium">
                          {propertyRatingStats.communication.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Đáng giá</span>
                      <div className="flex items-center gap-2">
                        {renderStars(propertyRatingStats.value, 'sm')}
                        <span className="w-8 text-right font-medium">
                          {propertyRatingStats.value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {siteRatingStats && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sạch sẽ</span>
                      <div className="flex items-center gap-2">
                        {renderStars(siteRatingStats.cleanliness, 'sm')}
                        <span className="w-8 text-right font-medium">
                          {siteRatingStats.cleanliness.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chính xác</span>
                      <div className="flex items-center gap-2">
                        {renderStars(siteRatingStats.accuracy, 'sm')}
                        <span className="w-8 text-right font-medium">
                          {siteRatingStats.accuracy.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as 'all' | 'property' | 'site')}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Tất cả ({reviews.length})</TabsTrigger>
          <TabsTrigger value="property" className="gap-1">
            <Building2 className="h-3 w-3" />
            Property
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-1">
            <Home className="h-3 w-3" />
            Site
          </TabsTrigger>
        </TabsList>

        {/* All Reviews */}
        <TabsContent value="all" className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 pt-6 text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                renderStars={renderStars}
                showBoth
              />
            ))
          )}
        </TabsContent>

        {/* Property Reviews */}
        <TabsContent value="property" className="mt-6 space-y-4">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4" />
              Đánh giá về {propertyName}
            </h3>
            <p className="text-muted-foreground text-sm">
              Vị trí, giao tiếp với chủ nhà, giá trị
            </p>
          </div>
          {reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              renderStars={renderStars}
              showPropertyOnly
            />
          ))}
        </TabsContent>

        {/* Site Reviews */}
        <TabsContent value="site" className="mt-6 space-y-4">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Home className="h-4 w-4" />
              Đánh giá về {siteName}
            </h3>
            <p className="text-muted-foreground text-sm">
              Độ sạch sẽ, chính xác mô tả
            </p>
          </div>
          {reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              renderStars={renderStars}
              showSiteOnly
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual Review Card Component
interface ReviewCardProps {
  review: Review;
  renderStars: (rating: number, size?: 'sm' | 'md' | 'lg') => React.ReactElement;
  showBoth?: boolean;
  showPropertyOnly?: boolean;
  showSiteOnly?: boolean;
}

function ReviewCard({
  review,
  renderStars,
  showBoth,
  showPropertyOnly,
  showSiteOnly,
}: ReviewCardProps) {
  const [showMore, setShowMore] = useState(false);
  const longComment = review.comment.length > 300;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Reviewer Info */}
        <div className="mb-4 flex items-start gap-4">
          <Avatar>
            <AvatarImage src={review.user?.avatar} />
            <AvatarFallback>
              {review.user?.fullName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{review.user?.fullName || 'Người dùng'}</p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(review.createdAt), 'dd MMMM yyyy', {
                    locale: vi,
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">
                    {review.ratings.overall.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings Breakdown */}
        {(showBoth || showPropertyOnly) && review.propertyRatings && (
          <div className="bg-muted/50 mb-3 rounded-lg p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium">
              <Building2 className="h-3 w-3" />
              Đánh giá Property
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Vị trí</p>
                {renderStars(review.propertyRatings.location, 'sm')}
              </div>
              <div>
                <p className="text-muted-foreground">Giao tiếp</p>
                {renderStars(review.propertyRatings.communication, 'sm')}
              </div>
              <div>
                <p className="text-muted-foreground">Đáng giá</p>
                {renderStars(review.propertyRatings.value, 'sm')}
              </div>
            </div>
          </div>
        )}

        {(showBoth || showSiteOnly) && review.siteRatings && (
          <div className="bg-muted/50 mb-3 rounded-lg p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium">
              <Home className="h-3 w-3" />
              Đánh giá Site
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Sạch sẽ</p>
                {renderStars(review.siteRatings.cleanliness, 'sm')}
              </div>
              <div>
                <p className="text-muted-foreground">Chính xác</p>
                {renderStars(review.siteRatings.accuracy, 'sm')}
              </div>
            </div>
          </div>
        )}

        {/* Review Comment */}
        <div className="mt-3">
          <p className="text-sm whitespace-pre-wrap">
            {longComment && !showMore
              ? `${review.comment.substring(0, 300)}...`
              : review.comment}
          </p>
          {longComment && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-primary mt-2 text-sm hover:underline"
            >
              {showMore ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>

        {/* Host Response */}
        {review.hostResponse && (
          <div className="border-primary mt-4 border-l-2 pl-4">
            <p className="mb-1 text-xs font-medium">Phản hồi từ chủ nhà:</p>
            <p className="text-muted-foreground text-sm">
              {review.hostResponse.text}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {format(new Date(review.hostResponse.createdAt), 'dd MMM yyyy', {
                locale: vi,
              })}
            </p>
          </div>
        )}

        {/* Helpful Button */}
        <div className="mt-4 flex items-center gap-4 border-t pt-4">
          <button className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs">
            <ThumbsUp className="h-3 w-3" />
            Hữu ích ({review.helpfulCount || 0})
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
