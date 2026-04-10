import {
  AddressService,
  AmenityService,
  AuthService,
  BookingService,
  CommentService,
  ForumService,
  // Hipcamp-style services
  CartService,
  CategoryService,
  NotificationService,
  OrderService,
  ProductService,
  PropertyService,
  ReviewService,
  SiteService,
  VerificationService,
} from "@/services";
import { Container } from "./container";
import { TOKENS } from "./tokens";

import DirectMessageService from "@/services/directMessage.service";
import RatingService from "@/services/rating.service";

export const container = new Container();

// Register services
container.register(TOKENS.CategoryService, () => new CategoryService(), { singleton: true });
container.register(TOKENS.ProductService, () => new ProductService(), { singleton: true });
container.register(TOKENS.AddressService, () => new AddressService(), { singleton: true });
container.register(TOKENS.OrderService, () => new OrderService(), { singleton: true });
container.register(TOKENS.CartService, () => new CartService(), { singleton: true });
container.register(TOKENS.RatingService, () => new RatingService(), { singleton: true });
container.register(TOKENS.DirectMessageService, () => new DirectMessageService(), {
  singleton: true,
});
container.register(TOKENS.NotificationService, () => new NotificationService(), { singleton: true });
container.register(TOKENS.VerificationService, () => new VerificationService(), {
  singleton: true,
});

container.register(
  TOKENS.AuthService,
  () => new AuthService(container.resolve(TOKENS.VerificationService)),
  { singleton: true }
);

// Register Hipcamp-style services
container.register(TOKENS.BookingService, () => new BookingService(), { singleton: true });
container.register(TOKENS.ReviewService, () => new ReviewService(), { singleton: true });
container.register(TOKENS.AmenityService, () => new AmenityService(), { singleton: true });
container.register(TOKENS.PropertyService, () => new PropertyService(), { singleton: true });
container.register(TOKENS.SiteService, () => new SiteService(), { singleton: true });
container.register(TOKENS.CommentService, () => new CommentService(), { singleton: true });
container.register(TOKENS.ForumService, () => new ForumService(), { singleton: true });

export type { Container } from "./container";
export { TOKENS } from "./tokens";
