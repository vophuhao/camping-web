import AccommodationTypes from '@/components/home/accommodation-types';
import ConditionalRecommendations from '@/components/home/conditional-recommendations';
import FeaturedProducts from '@/components/home/featured-products';
import HeroSection from '@/components/home/hero-section';
import PopularProperties from '@/components/home/popular-properties';
import RecentReviews from '@/components/home/recent-reviews';
import TopDestinations from '@/components/home/top-destinations';
import RevealOnScroll from '@/components/reveal-on-scroll';
import { StaggerContainer, StaggerItem } from '@/components/stagger-animation';
import { Card } from '@/components/ui/card';
import {
  getFeaturedProperties,
  getRecentReviews,
  getTopDestinations,
} from '@/lib/home-api';
import { Shield, ThumbsUp, Users } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Booking An Toàn',
    description: 'Thanh toán bảo mật, chính sách hủy linh hoạt, hỗ trợ 24/7',
  },
  {
    icon: Users,
    title: 'Host Tin Cậy',
    description: 'Tất cả host đều được xác minh và đánh giá bởi cộng đồng',
  },
  {
    icon: ThumbsUp,
    title: 'Giá Tốt Nhất',
    description:
      'Không phí ẩn, giá minh bạch, nhiều ưu đãi cho khách hàng thân thiết',
  },
];

/**
 * HomePage - Server Component
 * Fetches all data server-side for better performance and SEO
 */
export default async function HomePage() {
  // Fetch all data in parallel for optimal performance
  const [featuredProperties, topDestinations, recentReviews] =
    await Promise.all([
      getFeaturedProperties(8),
      getTopDestinations(6),
      getRecentReviews(6),
    ]);

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Personalized Recommendations - Client component for auth check */}
      <ConditionalRecommendations />

      {/* Popular/Featured Properties - Real data */}
      <PopularProperties properties={featuredProperties} />

      {/* Top Destinations - Real data grouped by state with geospatial query */}
      <TopDestinations destinations={topDestinations} />

      {/* Accommodation Types - Tent/RV/Glamping */}
      <AccommodationTypes />

      {/* Featured Products - E-commerce section */}
      {/* <FeaturedProducts /> */}

      {/* Recent Reviews - Real customer testimonials */}
      <RecentReviews reviews={recentReviews} />

      {/* Why Choose Us */}
      <section className="section-padding bg-linear-to-b from-white to-gray-50">
        <div className="container-padding mx-auto max-w-7xl">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <span className="mb-3 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-600">
                Vì sao chọn chúng tôi
              </span>
              <h2 className="mb-4 text-4xl font-bold md:text-5xl">
                Cam Kết Của Chúng Tôi
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                Nền tảng đặt chỗ cắm trại đáng tin cậy nhất Việt Nam
              </p>
            </div>
          </RevealOnScroll>
          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <Card className="border-0 p-8 text-center shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
                    <div className="flex-center mx-auto mb-6 h-20 w-20 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                      <Icon className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
