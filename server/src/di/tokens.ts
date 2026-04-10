export const TOKENS = {
  CategoryService: Symbol("CategoryService"),
  ProductService: Symbol("ProductService"),
  AuthService: Symbol("AuthService"),
  VerificationService: Symbol("VerificationService"),
  UserService: Symbol("UserService"),
  AddressService: Symbol("AddressService"),
  OrderService: Symbol("OrderService"),
  CartService: Symbol("CartService"),
  BookingService: Symbol("BookingService"),
  LocationService: Symbol("LocationService"),
  RatingService: Symbol("RatingService"),
  ReviewService: Symbol("ReviewService"),
  AmenityService: Symbol("AmenityService"),
  DirectMessageService: Symbol("DirectMessageService"),
  PropertyService: Symbol("PropertyService"),
  SiteService: Symbol("SiteService"),
  NotificationService: Symbol("NotificationService"),
  CommentService: Symbol("CommentService"),
  ForumService: Symbol("ForumService"),
} as const;

export type TokenMap = typeof TOKENS;
