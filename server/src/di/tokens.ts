export const TOKENS = {
  AuthService: Symbol("AuthService"),
  VerificationService: Symbol("VerificationService"),
  UserService: Symbol("UserService"),
  BookingService: Symbol("BookingService"),
  LocationService: Symbol("LocationService"),
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
