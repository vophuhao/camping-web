import { CLIENT_URL, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_CLIENT_ID } from "@/constants";
import { container, TOKENS } from "@/di";
import { ErrorFactory } from "@/errors";
import {
  AvailabilityModel,
  BookingModel,
  PropertyModel,
  SiteModel,
  type BookingDocument,
} from "@/models";
import appAssert from "@/utils/app-assert";
import { sendMail } from "@/utils/send-mail";
import type {
  CancelBookingInput,
  CreateBookingInput,
  SearchBookingInput,
  RequestDissatisfactionInput,
  ProcessDissatisfactionInput,
} from "@/validators/booking.validator";
import NotificationService from "./notification.service";
import WalletService from "./wallet.service";
import mongoose from "mongoose";
const { PayOS } = require("@payos/node");

const payos = new PayOS({
  clientId: PAYOS_CLIENT_ID,
  apiKey: PAYOS_API_KEY,
  checksumKey: PAYOS_CHECKSUM_KEY,
});

export class BookingService {
  /**
   * Create booking (guest book site)
   */
  async createBooking(guestId: string, input: CreateBookingInput): Promise<BookingDocument> {
    const {
      property: propertyId,
      site: siteId,
      campsite: campsiteId, // Legacy support
      checkIn,
      checkOut,
      numberOfGuests,
      numberOfPets,
      numberOfVehicles,
      guestMessage,
      fullnameGuest,
      phone,
      email,
      paymentMethod,
    } = input;

    // Ensure either site or campsite is provided
    appAssert(
      siteId || campsiteId,
      ErrorFactory.badRequest("Either site or campsite must be provided")
    );

    // Get property and site (pre-validation — outside transaction for read performance)
    const [property, site] = await Promise.all([
      PropertyModel.findById(propertyId),
      siteId ? SiteModel.findById(siteId) : Promise.resolve(null),
    ]);

    appAssert(property, ErrorFactory.resourceNotFound("Property"));
    appAssert(site, ErrorFactory.resourceNotFound("Site"));
    appAssert(property.isActive, ErrorFactory.badRequest("Property không còn hoạt động"));
    appAssert(site!.isActive, ErrorFactory.badRequest("Site không còn hoạt động"));

    // Verify site belongs to property
    appAssert(
      site!.property.toString() === propertyId,
      ErrorFactory.badRequest("Site không thuộc property này")
    );

    // Check capacity (from site)
    appAssert(
      numberOfGuests <= site.capacity.maxGuests,
      ErrorFactory.badRequest(`Số khách tối đa: ${site.capacity.maxGuests}`)
    );
    if (site.capacity.maxPets !== undefined) {
      appAssert(
        numberOfPets <= site.capacity.maxPets,
        ErrorFactory.badRequest(`Số thú cưng tối đa: ${site.capacity.maxPets}`)
      );
    }
    if (site.capacity.maxVehicles !== undefined) {
      appAssert(
        numberOfVehicles <= site.capacity.maxVehicles,
        ErrorFactory.badRequest(`Số xe tối đa: ${site.capacity.maxVehicles}`)
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Thiết lập giờ check-in là 12:00 trưa và check-out là 10:00 sáng
    checkInDate.setHours(12, 0, 0, 0);
    checkOutDate.setHours(10, 0, 0, 0);

    // Check min nights (from site booking settings)
    appAssert(
      nights >= site.bookingSettings.minimumNights,
      ErrorFactory.badRequest(`Tối thiểu ${site.bookingSettings.minimumNights} đêm`)
    );

    // Check max nights
    if (site.bookingSettings.maximumNights) {
      appAssert(
        nights <= site.bookingSettings.maximumNights,
        ErrorFactory.badRequest(`Tối đa ${site.bookingSettings.maximumNights} đêm`)
      );
    }

    // Calculate pricing (from site) — outside transaction
    const pricing = this.calculatePricing(
      site,
      nights,
      numberOfGuests,
      numberOfPets,
      checkInDate,
      checkOutDate
    );

    let payOSOrderCode: number | null = null;
    let payOSCheckoutUrl: string | null = null;
    const code = this.generateBookingCode();
    payOSOrderCode = Math.floor(Date.now() / 1000);
    const amount = 2000;

    try {
      const paymentLink = await payos.paymentRequests.create({
        orderCode: payOSOrderCode,
        amount,
        description: `BOOKING ${code}`,
        returnUrl: `${CLIENT_URL}/bookings/${code}/confirmation`,
        cancelUrl: `${CLIENT_URL}/bookings/cancel`,
      });

      payOSCheckoutUrl =
        paymentLink?.checkoutUrl ||
        paymentLink?.url ||
        paymentLink?.redirectUrl ||
        paymentLink?.data?.checkoutUrl ||
        null;
    } catch (err: any) {
      console.error("Error creating PayOS payment link:", err.message);
    }

    // ============================================================
    // CRITICAL: Dùng MongoDB transaction để tránh race condition
    // khi nhiều user đặt cùng site cùng lúc (double-booking)
    // ============================================================
    const session = await mongoose.startSession();
    let booking: BookingDocument;

    try {
      await session.withTransaction(async () => {
        // Re-check availability BÊN TRONG transaction (atomic)
        const isAvailable = await this.checkAvailabilityInSession(
          siteId,
          checkIn,
          checkOut,
          session
        );
        appAssert(isAvailable, ErrorFactory.conflict("Site không có sẵn trong thời gian này (đã được đặt trước)"));

        // Create booking trong cùng transaction
        const [newBooking] = await BookingModel.create(
          [
            {
              code,
              payOSOrderCode,
              payOSCheckoutUrl,
              property: propertyId,
              site: siteId,
              guest: guestId,
              host: property.host,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              nights,
              numberOfGuests,
              numberOfPets,
              numberOfVehicles,
              pricing,
              guestMessage,
              fullnameGuest: fullnameGuest,
              phone: phone,
              email: email,
              paymentMethod,
              paymentStatus: "pending",
            },
          ],
          { session }
        );

        appAssert(newBooking, ErrorFactory.internalError("Không thể tạo booking"));
        booking = newBooking;

        // Calculate total (trong transaction)
        await booking.calculateTotal();

        // Block dates cho designated sites (trong transaction)
        if (siteId) {
          const maxConcurrent = site!.capacity.maxConcurrentBookings || 1;
          if (maxConcurrent === 1) {
            await this.blockDatesForBooking(siteId, checkInDate, checkOutDate, session);
          }
        }

        // Auto-confirm nếu instant book
        if (site!.bookingSettings.instantBook) {
          await booking.confirm();
        }
      });
    } finally {
      await session.endSession();
    }

    // Send notification NGOÀI transaction (non-critical, không cần rollback)
    try {
      const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
      const UserModel = (await import("@/models/user.model")).default;
      const guest = await UserModel.findById(guestId);

      await notificationService.createNewBookingForHost(
        property.host.toString(),
        booking!._id!.toString(),
        booking!.code!,
        guest?.username || fullnameGuest || "Khách",
        property.name,
        property._id!.toString()
      );

      if (site!.bookingSettings.instantBook) {
        await notificationService.createBookingNotification(
          guestId,
          booking!._id!.toString(),
          booking!.code!,
          "booking_confirmed"
        );
      }
    } catch (error) {
      console.error("Failed to send booking notification:", error);
    }

    return booking!;
  }

  async getBookingByCode(code: string): Promise<BookingDocument> {
    const booking = await BookingModel.findOne({ code })
      .populate("site", "name accommodationType photos pricing location")
      .populate("guest", "username email avatarUrl")
      .populate("property", "name location photos slug")
      .populate("host", "username email avatarUrl");

    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

    return booking;
  }

  async handlePayOSWebhook(data: any) {
    try {
      const orderCode = data.data?.code;
      const success = data.data?.status === "PAID" || data.success;

      const booking = await BookingModel.findOne({ payOSOrderCode: orderCode });
      appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

      if (success) {
        booking.paymentStatus = "paid";
        await booking.save();
        return {
          success: true,
          code: "PAYMENT_SUCCESS",
          message: "Thanh toán thành công",
          booking,
        };
      } else {
        booking.paymentStatus = "failed";
        await booking.save();

        return { success: false, code: "PAYMENT_FAILED", message: "Thanh toán thất bại", booking };
      }
    } catch (err: any) {
      console.error("Error handling PayOS webhook:", err.message);
      return { success: false, code: "WEBHOOK_ERROR", message: err.message };
    }
  }
  private generateBookingCode(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);

    // 5 random digits
    const random = Math.floor(10000 + Math.random() * 90000);

    return `HDB${day}${month}${year}${random}`;
  }
  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string, userId: string): Promise<BookingDocument> {
    const booking = await BookingModel.findOne({ code: bookingId })
      .populate("property", "name location photos cancellationPolicy slug")
      .populate({
        path: "site",
        select: "name accommodationType photos pricing slug",
        populate: {
          path: "property",
          select: "name location photos slug host cancellationPolicy",
          populate: {
            path: "host",
            select: "fullName username avatarUrl",
          },
        },
      })
      .populate("guest", "username email avatarUrl")
      .populate("host", "username email avatarUrl");

    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

    // Check permission (guest, host, hoặc admin đều xem được)
    const UserModel = (await import("@/models/user.model")).default;
    const user = await UserModel.findById(userId).select("role");
    const isAdmin = user?.role === "admin";
    appAssert(
      booking.guest._id.toString() === userId || booking.host._id.toString() === userId || isAdmin,
      ErrorFactory.forbidden("Bạn không có quyền xem booking này")
    );

    return booking;
  }

  /**
   * Confirm booking (host accept)
   */
  async confirmBooking(
    bookingId: string,
    hostId: string,
    hostMessage?: string
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.host.toString() === hostId,
      ErrorFactory.forbidden("Bạn không phải host của booking này")
    );
    appAssert(
      booking.status === "pending",
      ErrorFactory.badRequest("Booking không ở trạng thái pending")
    );

    if (hostMessage) {
      booking.hostMessage = hostMessage;
    }

    await booking.confirm();

    // Send notification to guest
    try {
      const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
      await notificationService.createBookingNotification(
        booking.guest.toString(),
        bookingId,
        booking.code!,
        "booking_confirmed",
        hostMessage
      );
    } catch (error) {
      console.error("Failed to send booking confirmation notification:", error);
    }

    return booking;
  }

  /**
   * Cancel booking (guest or host)
   */
  async cancelBooking(
    bookingId: string,
    userId: mongoose.Types.ObjectId,
    input: CancelBookingInput
  ): Promise<BookingDocument> {
    const booking = await BookingModel.findOne({ code: bookingId });
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

    // Check permission
    const isGuest = booking.guest.toString() === userId.toString();
    const isHost = booking.host.toString() === userId.toString();
    appAssert(isGuest || isHost, ErrorFactory.forbidden("Bạn không có quyền hủy booking này"));

    // Check status
    appAssert(
      booking.status === "pending" || booking.status === "confirmed",
      ErrorFactory.badRequest("Không thể hủy booking này")
    );
    if (input.cancellInformation) {
      booking.cancellInformation = input.cancellInformation;
      await booking.save();
    }

    // Nếu khách hủy và đơn hàng đã thanh toán -> Lưu thông tin vào cannotAttendRequest để chờ Admin duyệt hoàn tiền
    if (isGuest && booking.paymentStatus === "paid" && input.cancellInformation) {
      const now = new Date();
      const checkIn = new Date(booking.checkIn);
      const diffMs = checkIn.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let refundRate = 0.5;
      let hostRate = 0.3;
      if (diffDays >= 2) {
        refundRate = 0.7;
        hostRate = 0.2;
      }
      const refundAmount = Math.round(booking.pricing.total * refundRate);
      const hostAmount = Math.round(booking.pricing.total * hostRate);

      booking.cannotAttendRequest = {
        requestedAt: now,
        reason: input.cancellationReason || "Khách yêu cầu hủy đặt chỗ",
        bankAccountName: input.cancellInformation.fullnameGuest || booking.fullnameGuest || "",
        bankAccountNumber: input.cancellInformation.bankType || "",
        bankName: input.cancellInformation.bankCode || "",
        status: "pending",
        refundAmount,
        evidenceImages: [],
      };

      (booking.cannotAttendRequest as any).refundRate = refundRate;
      (booking.cannotAttendRequest as any).hostAmount = hostAmount;
    }

    await booking.cancel(userId, input.cancellationReason);

    // Unblock dates when booking is cancelled
    await this.unblockDatesForBooking(booking.site.toString(), booking.checkIn, booking.checkOut);

    // Send notification
    try {
      const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
      const UserModel = (await import("@/models/user.model")).default;
      const property = await PropertyModel.findById(booking.property);

      if (isGuest) {
        // Guest cancelled -> notify host
        const guest = await UserModel.findById(userId);
        await notificationService.createGuestCancelledForHost(
          booking.host.toString(),
          booking._id.toString(),
          booking.code!,
          guest?.username || "Khách",
          property?.name || "Property",
          input.cancellationReason
        );
      } else {
        // Host cancelled -> notify guest
        await notificationService.createBookingNotification(
          booking.guest.toString(),
          booking._id.toString(),
          booking.code!,
          "booking_cancelled",
          `Booking đã bị hủy bởi host${input.cancellationReason ? `: ${input.cancellationReason}` : ""}`
        );
      }
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }

    return booking;
  }

  /**
   * Complete booking (auto after checkout date)
   */
  async completeBooking(bookingId: string): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(booking.status === "confirmed", ErrorFactory.badRequest("Booking chưa được confirm"));

    // Credit host wallet if not already credited
    if (!booking.walletCredited) {
      const walletService = new WalletService();
      await walletService.creditHostWallet(
        booking.host.toString(),
        booking._id.toString(),
        booking.pricing.total
      );

      // Fetch the updated booking document
      const updated = await BookingModel.findById(booking._id);
      if (updated) {
        Object.assign(booking, updated.toObject());
      }
    } else {
      await booking.complete();
    }

    // Unblock dates when booking is completed
    // This releases the dates back to availability pool
    await this.unblockDatesForBooking(booking.site.toString(), booking.checkIn, booking.checkOut);

    // Send notification to host
    try {
      const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
      const { PropertyModel } = await import("@/models/property.model");
      const property = await PropertyModel.findById(booking.property);
      const guestName = booking.fullnameGuest || "Khách";

      await notificationService.createGuestCheckedOutForHost(
        booking.host.toString(),
        booking._id.toString(),
        booking.code!,
        guestName,
        property?.name || "Khu cắm trại"
      );
    } catch (error) {
      console.error("Failed to send check-out notification to host:", error);
    }

    return booking;
  }

  /**
   * Refund booking (admin only)
   */
  async refundBooking(
    bookingId: string,
    userId: string,
    refundAmount?: number
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

    // Check permission - admin only
    const UserModel = (await import("@/models/user.model")).default;
    const user = await UserModel.findById(userId).select("role");
    appAssert(
      user?.role === "admin",
      ErrorFactory.forbidden("Chỉ admin mới có quyền refund booking")
    );

    // Check status
    appAssert(
      booking.status === "confirmed" || booking.status === "cancelled" || booking.status === "refund_requested",
      ErrorFactory.badRequest("Không thể refund booking này")
    );

    // Check payment status
    appAssert(
      booking.paymentStatus === "paid",
      ErrorFactory.badRequest("Booking chưa được thanh toán")
    );

    // Set refund
    booking.status = "refunded";
    booking.refundAmount = refundAmount || booking.pricing.total;
    if (booking.refundRequest) {
      booking.refundRequest.status = "approved";
      booking.refundRequest.processedAt = new Date();
      booking.refundRequest.processedBy = new mongoose.Types.ObjectId(userId);
    }
    await booking.save();

    // Unblock dates when booking is refunded
    await this.unblockDatesForBooking(booking.site.toString(), booking.checkIn, booking.checkOut);

    return booking;
  }

  /**
   * Search bookings with filters
   */
  async searchBookings(userId: string, input: SearchBookingInput) {
    const { status, checkInFrom, checkInTo, role, sort, page, limit } = input;

    // Build query
    const query: any = {};

    // Filter by role (guest or host)
    if (role === "guest") {
      query.guest = userId;
    } else if (role === "host") {
      query.host = userId;
    } else {
      // Show all bookings (as guest or host)
      query.$or = [{ guest: userId }, { host: userId }];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by check-in date range
    if (checkInFrom || checkInTo) {
      query.checkIn = {};
      if (checkInFrom) query.checkIn.$gte = new Date(checkInFrom);
      if (checkInTo) query.checkIn.$lte = new Date(checkInTo);
    }

    // Sorting
    let sortOption: any = {};
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "check-in":
        sortOption = { checkIn: 1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .populate({
          path: "site",
          select: "name slug photos accommodationType pricing",
          populate: {
            path: "property",
            select: "name location photos slug host",
            populate: {
              path: "host",
              select: "fullName username",
            },
          },
        })
        .populate("guest", "username email avatarUrl")
        .populate("host", "username email avatarUrl")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments(query),
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Check availability helper (dùng trong regular flow)
   */
  // private async checkAvailability(
  //   siteId: string,
  //   checkIn: string,
  //   checkOut: string
  // ): Promise<boolean> {
  //   return this.checkAvailabilityInSession(siteId, checkIn, checkOut, null);
  // }

  /**
   * Check availability với optional session (dùng trong transaction để atomic)
   */
  private async checkAvailabilityInSession(
    siteId: string,
    checkIn: string,
    checkOut: string,
    session: mongoose.ClientSession | null
  ): Promise<boolean> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check blocked dates
    const blockedDatesQuery = AvailabilityModel.countDocuments({
      site: siteId,
      date: { $gte: checkInDate, $lt: checkOutDate },
      isAvailable: false,
    });
    if (session) blockedDatesQuery.session(session);
    const blockedDates = await blockedDatesQuery;

    if (blockedDates > 0) return false;

    // Determine concurrency rules for this site (designated vs undesignated)
    const siteQuery = SiteModel.findById(siteId).select("capacity");
    if (session) siteQuery.session(session);
    const site = await siteQuery;
    const maxConcurrent = (site && site.capacity && site.capacity.maxConcurrentBookings) || 1;

    // For designated sites (maxConcurrent === 1) any overlapping booking blocks the slot
    if (maxConcurrent === 1) {
      const overlapQuery = BookingModel.findOne({
        site: siteId,
        status: { $in: ["pending", "confirmed"] },
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate },
          },
        ],
      });
      if (session) overlapQuery.session(session);
      const overlappingBooking = await overlapQuery;

      return !overlappingBooking;
    }

    // For undesignated sites (maxConcurrent > 1) allow bookings up to the concurrency limit
    const countQuery = BookingModel.countDocuments({
      site: siteId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate },
        },
      ],
    });
    if (session) countQuery.session(session);
    const overlappingCount = await countQuery;

    return overlappingCount < maxConcurrent;
  }

  /**
   * Calculate pricing breakdown
   */
  private calculatePricing(
    site: any,
    nights: number,
    numberOfGuests: number,
    numberOfPets: number,
    checkIn: Date,
    checkOut: Date
  ): any {
    const {
      basePrice,
      weekendPrice = null,
      cleaningFee = 0,
      petFee = 0,
      additionalGuestFee = 0,
      // vehicleFee = 0,
    } = site.pricing;

    // Calculate subtotal day-by-day
    let subtotal = 0;
    let weekdayNights = 0;
    let weekendNights = 0;
    let seasonalNights = 0;

    const currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday

      let nightPrice = basePrice;
      let isSeasonal = false;

      // Seasonal price has highest priority
      if (site.pricing.seasonalPricing && site.pricing.seasonalPricing.length > 0) {
        const seasonalRate = site.pricing.seasonalPricing.find((season: any) => {
          const seasonStart = new Date(season.startDate);
          const seasonEnd = new Date(season.endDate);

          // Compare dates without time
          const currentZero = new Date(currentDate);
          currentZero.setHours(0, 0, 0, 0);
          const startZero = new Date(seasonStart);
          startZero.setHours(0, 0, 0, 0);
          const endZero = new Date(seasonEnd);
          endZero.setHours(0, 0, 0, 0);

          return currentZero >= startZero && currentZero <= endZero;
        });

        if (seasonalRate) {
          nightPrice = seasonalRate.price;
          isSeasonal = true;
        }
      }

      // Weekend price applied if not overridden by seasonal price
      if (!isSeasonal && isWeekend && weekendPrice !== null && weekendPrice > 0) {
        nightPrice = weekendPrice;
        weekendNights++;
      } else if (isSeasonal) {
        seasonalNights++;
      } else {
        weekdayNights++;
      }

      subtotal += nightPrice;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const cleaning = cleaningFee;
    const pet = numberOfPets > 0 ? petFee * numberOfPets : 0;
    const extraGuest =
      numberOfGuests > site.capacity.maxGuests
        ? additionalGuestFee * (numberOfGuests - site.capacity.maxGuests)
        : 0;

    return {
      basePrice,
      weekendPrice: weekendPrice || basePrice,
      totalNights: nights,
      weekdayNights,
      weekendNights,
      subtotal,
      cleaningFee: cleaning,
      petFee: pet,
      extraGuestFee: extraGuest,
      vehicleFee: 0, // Not implemented yet
      serviceFee: 0, // will be calculated later
      tax: 0, // will be calculated later
      total: 0, // will be calculated by booking.calculateTotal()
    };
  }

  /**
   * Block dates in availability calendar when booking is created
   * Hỗ trợ optional MongoDB session để dùng trong transaction
   */
  private async blockDatesForBooking(
    siteId: string,
    checkIn: Date,
    checkOut: Date,
    session: mongoose.ClientSession | null = null
  ): Promise<void> {
    const dates: Date[] = [];
    const currentDate = new Date(checkIn);

    // Generate all dates from checkIn to checkOut (INCLUSIVE)
    // Must include checkout date to prevent overlapping bookings
    while (currentDate <= checkOut) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create availability records for each date
    const availabilityRecords = dates.map((date) => ({
      site: new mongoose.Types.ObjectId(siteId),
      date,
      isAvailable: false,
      blockType: "booked" as const,
      reason: "Đã được đặt",
    }));

    // Use bulkWrite with upsert to avoid duplicates
    const bulkOps = availabilityRecords.map((record) => ({
      updateOne: {
        filter: { site: record.site, date: record.date },
        update: { $set: record },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      const options = session ? { session } : {};
      await AvailabilityModel.bulkWrite(bulkOps, options);
    }
  }

  /**
   * Unblock dates when booking is cancelled
   */
  private async unblockDatesForBooking(
    siteId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<void> {
    // Remove availability records for booked dates (inclusive of checkout)
    // Only applies to designated sites (maxConcurrentBookings = 1)
    // Undesignated sites don't create availability blocks
    await AvailabilityModel.deleteMany({
      site: siteId,
      date: { $gte: checkIn, $lte: checkOut },
      blockType: "booked",
    });
  }

  async getMyBookings(userId: string, page: number = 1, limit: number = 20) {
    const query = {
      $or: [{ host: userId }],
    };
    // Đảm bảo limit hợp lý (tối đa 1000 để tránh memory spike)
    const safeLimit = Math.min(Math.max(1, limit), 1000);
    const skip = (page - 1) * safeLimit;

    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .populate("property", "name slug location photos")
        .populate("site", "name slug accommodationType photos pricing location")
        .populate("guest", "name email avatar")
        .populate("host", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      BookingModel.countDocuments(query),
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: page < Math.ceil(total / safeLimit),
        hasPrev: page > 1,
      },
    };
  }

  async userCancelPayment(orderCode: string) {
    console.log("User cancel payment for orderCode:", orderCode);
    const booking = await BookingModel.findOne({ payOSOrderCode: orderCode });
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));

    if (!booking.code) {
      console.log("No booking found for orderCode:", orderCode);
      return {
        success: false,
        message: "No booking found for the provided order code",
      };
    }
    const bookingId = booking.code.toString();
    // ❗ cancelBooking cần booking._id (ObjectId), không phải orderCode
    await this.cancelBooking(bookingId, booking.guest as mongoose.Types.ObjectId, {
      cancellationReason: "User cancelled payment",
    });
    await booking.deleteOne();
    return {
      success: true,
      message: "Booking payment cancelled and booking removed",
    };
  }

  /**
   * Auto cancel expired pending bookings and send reminder emails
   * - Send reminder email after 6 hours
   * - Auto cancel and delete after 24 hours
   */

  async cancelExpiredPendingBookings() {
    const REMINDER_HOURS = 6;
    const CANCEL_HOURS = 24;

    const now = new Date();
    const reminderTime = new Date(now.getTime() - REMINDER_HOURS * 60 * 60 * 1000);
    const cancelTime = new Date(now.getTime() - CANCEL_HOURS * 60 * 60 * 1000);

    // 1) TÌM BOOKING CẦN GỬI EMAIL NHẮC NHỞ (6 giờ)
    const bookingsNeedReminder = await BookingModel.find({
      paymentStatus: "pending",
      createdAt: { $lt: reminderTime, $gte: cancelTime },
      reminderSent: { $ne: true },
    })
      .populate("guest", "username email fullName")
      .populate("site", "name")
      .populate("property", "name");

    for (const booking of bookingsNeedReminder) {
      try {
        const guestEmail = booking.email || (booking.guest as any)?.email;
        const guestName =
          booking.fullnameGuest ||
          (booking.guest as any)?.fullName ||
          (booking.guest as any)?.username ||
          "Quý khách";
        const propertyName = (booking.property as any)?.name || "Khu cắm trại";
        const siteName = (booking.site as any)?.name || "Site";
        const totalAmount = booking.pricing?.total || 0;
        const checkoutUrl =
          booking.payOSCheckoutUrl || `${CLIENT_URL}/bookings/${booking.code}/confirmation`;
        if (!booking.isSentMail) {
          await sendMail({
            to: guestEmail,
            subject: "⏰ Nhắc nhở hoàn tất thanh toán booking",
            html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { 
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
              }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { 
                display: inline-block; 
                background: #10b981; 
                color: white !important; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0;
                font-weight: bold;
              }
              .info-box { 
                background: white; 
                padding: 20px; 
                border-left: 4px solid #f59e0b; 
                margin: 20px 0; 
                border-radius: 5px; 
              }
              .warning-box { 
                background: #fee2e2; 
                padding: 20px; 
                border-left: 4px solid #ef4444; 
                margin: 20px 0; 
                border-radius: 5px; 
              }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              .highlight { color: #f59e0b; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Nhắc nhở thanh toán</h1>
                <p style="font-size: 16px; margin: 10px 0;">Booking của bạn đang chờ thanh toán</p>
              </div>
              
              <div class="content">
                <p>Xin chào <strong>${guestName}</strong>,</p>
                
                <p>Chúng tôi nhận thấy booking <strong class="highlight">${booking.code}</strong> của bạn chưa được thanh toán.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0; color: #f59e0b;">📋 Thông tin booking</h3>
                  <p><strong>Mã booking:</strong> ${booking.code}</p>
                  <p><strong>Địa điểm:</strong> ${siteName} - ${propertyName}</p>
                  <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString("vi-VN")}</p>
                  <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString("vi-VN")}</p>
                  <p><strong>Số đêm:</strong> ${booking.nights} đêm</p>
                  <p><strong>Số khách:</strong> ${booking.numberOfGuests} người</p>
                  <p style="font-size: 18px; color: #10b981; margin-top: 15px;">
                    <strong>Tổng tiền:</strong> ${totalAmount.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                
                <div class="warning-box">
                  <p style="margin: 0; color: #dc2626;">
                    <strong>⚠️ Lưu ý quan trọng:</strong> Booking sẽ tự động bị hủy sau <strong>18 giờ nữa</strong> nếu không được thanh toán.
                  </p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${checkoutUrl}" class="button" style="color: white;">
                    💳 Thanh toán ngay
                  </a>
                </p>
                
                <h3>📌 Tại sao cần thanh toán ngay?</h3>
                <ul>
                  <li>Đảm bảo chỗ của bạn không bị người khác đặt</li>
                  <li>Tránh mất slot trong thời gian cao điểm</li>
                  <li>Nhận xác nhận booking ngay lập tức</li>
                  <li>Yên tâm chuẩn bị cho chuyến đi</li>
                </ul>
                
                <p style="margin-top: 30px;">Nếu bạn gặp vấn đề khi thanh toán, vui lòng liên hệ với chúng tôi ngay.</p>
                
                <p style="margin-top: 20px;">
                  Trân trọng,<br>
                  <strong>Đội ngũ HipCamp</strong>
                </p>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} HipCamp. All rights reserved.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>Liên hệ: support@hipcamp.vn</p>
              </div>
            </div>
          </body>
          </html>
        `,
          });
          booking.isSentMail = true;
          await booking.save();
        }
        // Đánh dấu đã gửi reminder
        await BookingModel.updateOne({ _id: booking._id }, { $set: { reminderSent: true } });
        console.log(
          `📧 Đã gửi email nhắc nhở thanh toán: Booking ${booking.code} đến ${guestEmail}`
        );
      } catch (err) {
        console.error(`❌ Lỗi gửi email nhắc nhở Booking ${booking.code}:`, err);
      }
    }
    // 2) TÌM VÀ HỦY BOOKING QUÁ HẠN 24 GIỜ
    const expiredBookings = await BookingModel.find({
      paymentStatus: "pending",
      status: "pending",
      createdAt: { $lt: cancelTime },
    })
      .populate("guest", "username email fullName")
      .populate("site", "name")
      .populate("property", "name");

    for (const booking of expiredBookings) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const bookingId = (booking._id as mongoose.Types.ObjectId).toString();
        const siteId = booking.site.toString();

        // Unblock dates (giải phóng lịch)
        await this.unblockDatesForBooking(siteId, booking.checkIn, booking.checkOut);

        // Hủy booking (sử dụng logic existing)
        await this.cancelBooking(bookingId, booking.guest as mongoose.Types.ObjectId, {
          cancellationReason: "Auto-cancelled: Payment timeout after 24 hours",
        });
        await booking.save();
        await session.commitTransaction();
        session.endSession();

        console.log(`⛔ Đã tự động hủy và xóa booking quá hạn 24h: ${booking.code}`);

        // Gửi email thông báo hủy
        try {
          const guestEmail = booking.email || (booking.guest as any)?.email;
          const guestName =
            booking.fullnameGuest ||
            (booking.guest as any)?.fullName ||
            (booking.guest as any)?.username ||
            "Quý khách";
          const propertyName = (booking.property as any)?.name || "Khu cắm trại";
          const siteName = (booking.site as any)?.name || "Site";

          await sendMail({
            to: guestEmail,
            subject: "❌ Booking đã bị hủy do quá thời gian thanh toán",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { 
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                  color: white; 
                  padding: 30px; 
                  text-align: center; 
                  border-radius: 10px 10px 0 0; 
                }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { 
                  display: inline-block; 
                  background: #3b82f6; 
                  color: white !important; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  margin: 20px 0;
                  font-weight: bold;
                }
                .info-box { 
                  background: white; 
                  padding: 20px; 
                  border-left: 4px solid #ef4444; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                }
                .tips-box { 
                  background: #dbeafe; 
                  padding: 20px; 
                  border-left: 4px solid #3b82f6; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>❌ Booking đã bị hủy</h1>
                  <p style="font-size: 16px; margin: 10px 0;">Hết thời gian thanh toán</p>
                </div>
                
                <div class="content">
                  <p>Xin chào <strong>${guestName}</strong>,</p>
                  
                  <p>Rất tiếc, booking <strong>${booking.code}</strong> của bạn đã bị hủy tự động do không được thanh toán trong vòng 24 giờ.</p>
                  
                  <div class="info-box">
                    <h3 style="margin-top: 0; color: #ef4444;">📋 Thông tin booking đã hủy</h3>
                    <p><strong>Mã booking:</strong> ${booking.code}</p>
                    <p><strong>Địa điểm:</strong> ${siteName} - ${propertyName}</p>
                    <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString("vi-VN")}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString("vi-VN")}</p>
                    <p><strong>Lý do hủy:</strong> <span style="color: #ef4444;">Quá thời gian thanh toán (24 giờ)</span></p>
                  </div>
                  
                  <div class="tips-box">
                    <h3 style="margin-top: 0; color: #3b82f6;">💡 Bạn vẫn muốn đặt chỗ?</h3>
                    <ul>
                      <li>Kiểm tra lại lịch trống tại địa điểm</li>
                      <li>Tạo booking mới và thanh toán ngay</li>
                      <li>Liên hệ với chúng tôi nếu cần hỗ trợ</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${CLIENT_URL}/properties" class="button" style="color: white;">
                      🔍 Tìm địa điểm khác
                    </a>
                  </div>
                  
                  <p style="margin-top: 30px;">
                    Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
                  </p>
                  
                  <p style="margin-top: 20px;">
                    Trân trọng,<br>
                    <strong>Đội ngũ HipCamp</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} HipCamp. All rights reserved.</p>
                  <p>Liên hệ hỗ trợ: support@hipcamp.vn | Hotline: 1900-xxxx</p>
                </div>
              </div>
            </body>
            </html>
          `,
          });

          console.log(`📧 Đã gửi email thông báo hủy booking: ${booking.code} đến ${guestEmail}`);
        } catch (emailErr) {
          console.error(`❌ Lỗi gửi email thông báo hủy Booking ${booking.code}:`, emailErr);
        }
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(`❌ Lỗi khi hủy booking ${booking.code}:`, err);
      }
    }

    return {
      remindersSent: bookingsNeedReminder.length,
      bookingsCancelled: expiredBookings.length,
    };
  }

  /**
   * Auto complete bookings after checkout date or 3 days after check-in and send completion emails
   */
  async autoCompleteBooking() {
    try {
      // Auto complete if check-in was 3 or more days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // Find all confirmed bookings where checkIn date is older than 3 days
      const bookingsToComplete = await BookingModel.find({
        status: "confirmed",
        paymentStatus: "paid",
        checkIn: { $lte: threeDaysAgo },
      })
        .populate("guest", "username email fullName")
        .populate("site", "name")
        .populate("property", "name");

      if (bookingsToComplete.length === 0) {
        console.log("✅ Không có booking nào cần hoàn thành");
        return { completed: 0 };
      }

      let completedCount = 0;

      for (const booking of bookingsToComplete) {
        try {
          // Call completeBooking which handles status update, host wallet credit, and host notifications
          await this.completeBooking(booking._id.toString());

          completedCount++;
          console.log(`✅ Đã tự động hoàn thành booking: ${booking.code}`);

          // Send completion email to guest
          try {
            const guestEmail = booking.email || (booking.guest as any)?.email;
            const guestName =
              booking.fullnameGuest ||
              (booking.guest as any)?.fullName ||
              (booking.guest as any)?.username ||
              "Quý khách";
            const propertyName = (booking.property as any)?.name || "Khu cắm trại";
            const siteName = (booking.site as any)?.name || "Site";

            await sendMail({
              to: guestEmail,
              subject: "🎉 Chuyến đi của bạn đã hoàn thành - Cảm ơn bạn!",
              html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { 
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                  color: white; 
                  padding: 30px; 
                  text-align: center; 
                  border-radius: 10px 10px 0 0; 
                }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { 
                  display: inline-block; 
                  background: #3b82f6; 
                  color: white !important; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  margin: 20px 0;
                  font-weight: bold;
                }
                .info-box { 
                  background: white; 
                  padding: 20px; 
                  border-left: 4px solid #10b981; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                }
                .tips-box { 
                  background: #dbeafe; 
                  padding: 20px; 
                  border-left: 4px solid #3b82f6; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Chuyến đi đã hoàn thành!</h1>
                  <p style="font-size: 16px; margin: 10px 0;">Cảm ơn bạn đã tin tưởng HipCamp</p>
                </div>
                
                <div class="content">
                  <p>Xin chào <strong>${guestName}</strong>,</p>
                  
                  <p>Chuyến đi của bạn tại <strong>${siteName} - ${propertyName}</strong> đã hoàn thành. Chúng tôi hy vọng bạn đã có những trải nghiệm tuyệt vời!</p>
                  
                  <div class="info-box">
                    <h3 style="margin-top: 0; color: #10b981;">📋 Thông tin chuyến đi</h3>
                    <p><strong>Mã booking:</strong> ${booking.code}</p>
                    <p><strong>Địa điểm:</strong> ${siteName} - ${propertyName}</p>
                    <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString("vi-VN")}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString("vi-VN")}</p>
                    <p><strong>Số đêm:</strong> ${booking.nights} đêm</p>
                    <p><strong>Số khách:</strong> ${booking.numberOfGuests} người</p>
                  </div>
                  
                  <div class="tips-box">
                    <h3 style="margin-top: 0; color: #3b82f6;">⭐ Chia sẻ trải nghiệm của bạn</h3>
                    <p>Đánh giá của bạn sẽ giúp những khách hàng khác có thêm thông tin để lựa chọn địa điểm phù hợp!</p>
                    <ul>
                      <li>Viết review về chuyến đi</li>
                      <li>Đánh giá dịch vụ và tiện nghi</li>
                      <li>Chia sẻ hình ảnh đẹp</li>
                      <li>Giúp cộng đồng camping Việt Nam phát triển</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${CLIENT_URL}/bookings/${booking.code}/review" class="button" style="color: white;">
                      ⭐ Viết đánh giá
                    </a>
                  </div>
                  
                  <p style="margin-top: 30px;">
                    Cảm ơn bạn đã lựa chọn HipCamp. Chúng tôi mong được phục vụ bạn trong những chuyến đi tiếp theo!
                  </p>
                  
                  <p style="margin-top: 20px;">
                    Trân trọng,<br>
                    <strong>Đội ngũ HipCamp</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} HipCamp. All rights reserved.</p>
                  <p>Liên hệ hỗ trợ: support@hipcamp.vn | Hotline: 1900-xxxx</p>
                </div>
              </div>
            </body>
            </html>
            `,
            });

            console.log(`📧 Đã gửi email hoàn thành booking: ${booking.code} đến ${guestEmail}`);
          } catch (emailErr) {
            console.error(`❌ Lỗi gửi email hoàn thành Booking ${booking.code}:`, emailErr);
          }
        } catch (err) {
          console.error(`❌ Lỗi khi hoàn thành booking ${booking.code}:`, err);
        }
      }

      return {
        completed: completedCount,
        total: bookingsToComplete.length,
      };
    } catch (error) {
      console.error("❌ Lỗi trong autoCompleteBooking:", error);
      throw error;
    }
  }

  // ==================== ADMIN MANAGED BOOKING METHODS ====================



  /**
   * User yêu cầu hoàn tiền (gửi đến admin)
   */
  async requestRefund(
    bookingId: string,
    userId: string,
    reason: string
  ): Promise<BookingDocument> {
    const booking = await BookingModel.findOne({ code: bookingId });
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.guest.toString() === userId,
      ErrorFactory.forbidden("Bạn không có quyền yêu cầu hoàn tiền")
    );
    appAssert(
      booking.status === "confirmed" || booking.status === "completed",
      ErrorFactory.badRequest("Không thể yêu cầu hoàn tiền cho booking này")
    );
    appAssert(
      booking.paymentStatus === "paid",
      ErrorFactory.badRequest("Booking chưa được thanh toán")
    );
    appAssert(
      !booking.refundRequest || booking.refundRequest.status === "rejected",
      ErrorFactory.badRequest("Đã có yêu cầu hoàn tiền đang chờ xử lý")
    );

    booking.status = "refund_requested";
    booking.refundRequest = {
      requestedAt: new Date(),
      reason,
      requestedBy: new mongoose.Types.ObjectId(userId),
      status: "pending",
    };
    await booking.save();

    return booking;
  }

  /**
   * Admin xử lý yêu cầu hoàn tiền
   */
  async adminProcessRefund(
    bookingId: string,
    adminId: string,
    approved: boolean,
    adminNote?: string,
    refundAmount?: number
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.refundRequest?.status === "pending",
      ErrorFactory.badRequest("Không có yêu cầu hoàn tiền đang chờ")
    );

    if (approved) {
      booking.status = "refunded";
      booking.refundAmount = refundAmount || booking.pricing.total;
      booking.refundRequest!.status = "approved";
      await this.unblockDatesForBooking(booking.site.toString(), booking.checkIn, booking.checkOut);
    } else {
      booking.status = "confirmed"; // Trả về status trước
      booking.refundRequest!.status = "rejected";
    }

    booking.refundRequest!.processedAt = new Date();
    booking.refundRequest!.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNote) booking.refundRequest!.adminNote = adminNote;

    await booking.save();
    return booking;
  }

  /**
   * Admin xem tất cả booking
   */
  async getAdminBookings(filters: {
    status?: string;
    paymentStatus?: string;
    hostId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    cannotAttendStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, paymentStatus, hostId, search, startDate, endDate, cannotAttendStatus, page = 1, limit = 20 } = filters;
    const query: any = {};

    if (cannotAttendStatus) {
      // Filter bookings with cannotAttendRequest of the given status
      query["cannotAttendRequest.status"] = cannotAttendStatus;
    } else {
      if (status) query.status = status;
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (hostId) query.host = new mongoose.Types.ObjectId(hostId);

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { fullnameGuest: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .populate("property", "name location photos slug")
        .populate("site", "name accommodationType photos pricing")
        .populate("guest", "username email avatarUrl")
        .populate("host", "username email avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments(query),
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Admin thống kê booking
   */
  async getAdminBookingStats() {
    const [statusStats, paymentStats, monthlyStats, refundRequests, cannotAttendRequests] = await Promise.all([
      BookingModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$pricing.total" } } },
      ]),
      BookingModel.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ]),
      BookingModel.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue: { $sum: "$pricing.total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 },
      ]),
      BookingModel.countDocuments({ "refundRequest.status": "pending" }),
      BookingModel.countDocuments({ "cannotAttendRequest.status": "pending" }),
    ]);

    const totalRevenue = statusStats
      .filter((s: any) => s._id === "completed")
      .reduce((sum: number, s: any) => sum + s.revenue, 0);

    return {
      statusStats,
      paymentStats,
      monthlyStats: monthlyStats.reverse(),
      totalRevenue,
      platformFee: Math.round(totalRevenue * 0.05),
      pendingRefunds: refundRequests,
      pendingCannotAttend: cannotAttendRequests,
    };
  }

  /**
   * Admin hủy booking
   */
  async adminCancelBooking(
    bookingId: string,
    adminId: string,
    reason?: string
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.status === "pending" || booking.status === "confirmed",
      ErrorFactory.badRequest("Không thể hủy booking này")
    );

    booking.status = "cancelled";
    booking.cancelledBy = new mongoose.Types.ObjectId(adminId);
    booking.cancelledAt = new Date();
    if (reason) booking.cancellationReason = reason;
    await booking.save();

    // Unblock dates
    await this.unblockDatesForBooking(booking.site.toString(), booking.checkIn, booking.checkOut);

    return booking;
  }

  /**
   * Host xem booking của mình (read-only)
   */
  async getHostBookings(hostId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const query: any = { host: new mongoose.Types.ObjectId(hostId) };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .populate("property", "name location photos slug")
        .populate("site", "name accommodationType photos pricing")
        .populate("guest", "username email avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments(query),
    ]);

    return {
      data: bookings,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ==================== WALLET-BASED ATTENDANCE METHODS ====================

  /**
   * Khách xác nhận đã đến: cộng tiền vào ví host ngay lập tức
   * Hiển thị nút từ checkIn đến checkOut + 5 ngày
   */
  async guestConfirmArrival(
    bookingId: string,
    guestId: string
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query)
      .populate("property", "name")
      .lean();
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.guest.toString() === guestId,
      ErrorFactory.forbidden("Bạn không phải khách của booking này")
    );
    appAssert(
      booking.status === "confirmed",
      ErrorFactory.badRequest("Booking phải ở trạng thái đã xác nhận")
    );
    appAssert(
      booking.paymentStatus === "paid",
      ErrorFactory.badRequest("Booking chưa được thanh toán")
    );
    appAssert(
      !booking.guestConfirmedAttendance,
      ErrorFactory.badRequest("Đã xác nhận đến rồi")
    );
    appAssert(
      !booking.walletCredited,
      ErrorFactory.badRequest("Tiền đã được chuyển vào ví")
    );

    // Kiểm tra thời gian: phải trong khoảng checkIn → checkOut + 5 ngày
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const deadline = new Date(checkOut.getTime() + 5 * 24 * 60 * 60 * 1000);

    appAssert(
      now >= checkIn,
      ErrorFactory.badRequest(
        `Chưa đến thời gian check-in (${checkIn.toLocaleDateString("vi-VN")})`
      )
    );
    appAssert(
      now <= deadline,
      ErrorFactory.badRequest("Thời gian xác nhận đã hết hạn")
    );

    // Cộng ví host
    const walletService = new WalletService();
    await walletService.creditHostWallet(
      booking.host.toString(),
      booking._id.toString(),
      booking.pricing.total
    );

    // Cập nhật booking (BookingModel.findByIdAndUpdate đã được gọi trong creditHostWallet)
    const updated = await BookingModel.findByIdAndUpdate(
      booking._id,
      { guestConfirmedAttendance: true, guestConfirmedAt: now },
      { new: true }
    );

    return updated!;
  }

  /**
   * Khách báo không thể đến:
   * - Tính sẵn refundAmount theo quy tắc thời gian
   * - Mở khóa availability
   * - Lưu cannotAttendRequest với status "pending" (chờ admin duyệt)
   * - Admin sẽ xác nhận và cộng 20% vào ví host
   */
  async guestCannotAttend(
    bookingId: string,
    guestId: string,
    input: {
      reason: string;
      bankAccountName: string;
      bankAccountNumber: string;
      bankName: string;
      evidenceImages?: string[];
    }
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.guest.toString() === guestId,
      ErrorFactory.forbidden("Bạn không phải khách của booking này")
    );
    appAssert(
      booking.status === "confirmed",
      ErrorFactory.badRequest("Booking phải ở trạng thái đã xác nhận")
    );
    appAssert(
      booking.paymentStatus === "paid",
      ErrorFactory.badRequest("Booking chưa được thanh toán")
    );
    appAssert(
      !booking.cannotAttendRequest,
      ErrorFactory.badRequest("Đã gửi yêu cầu không đến trước đó rồi")
    );
    appAssert(
      !booking.walletCredited,
      ErrorFactory.badRequest("Tiền đã được xử lý")
    );

    const now = new Date();

    // Tính refundRate theo thời điểm gửi vs checkIn
    const checkIn = new Date(booking.checkIn);
    const diffMs = checkIn.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // >= 2 ngày trước check-in → hoàn 70% host nhận 20%; < 2 ngày → hoàn 50% host nhận 30%
    let refundRate = 0.5;
    let hostRate = 0.3;
    if (diffDays >= 2) {
      refundRate = 0.7;
      hostRate = 0.2;
    }
    const refundAmount = Math.round(booking.pricing.total * refundRate);
    const hostAmount = Math.round(booking.pricing.total * hostRate);

    booking.cannotAttendRequest = {
      requestedAt: now,
      reason: input.reason,
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankName: input.bankName,
      evidenceImages: input.evidenceImages ?? [],
      status: "pending",
      refundAmount,
    };
    // Store computed amounts on request for admin to see
    (booking.cannotAttendRequest as any).refundRate = refundRate;
    (booking.cannotAttendRequest as any).hostAmount = hostAmount;

    // Chuyển booking thành trạng thái đã hủy ngay lập tức
    booking.status = "cancelled";

    // Mở khóa availability (giải phóng lịch ngay)
    await AvailabilityModel.deleteMany({ booking: booking._id });

    // Gửi thông báo cho host về tình trạng hủy của booking này
    try {
      const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
      const UserModel = (await import("@/models/user.model")).default;
      const guest = await UserModel.findById(guestId);
      const { PropertyModel } = await import("@/models/property.model");
      const property = await PropertyModel.findById(booking.property);

      await notificationService.createGuestCancelledForHost(
        booking.host.toString(),
        booking._id.toString(),
        booking.code!,
        guest?.username || "Khách",
        property?.name || "Khu cắm trại",
        input.reason
      );
    } catch (error) {
      console.error("Failed to send cancellation notification to host:", error);
    }

    await booking.save();
    return booking;
  }

  /**
   * Admin xác nhận đã hoàn tiền cho khách không đến
   * - Cộng 20% vào ví host
   * - Cập nhật cannotAttendRequest.status = "approved" / "rejected"
   * - Gửi notification cho host
   */
  async adminProcessCannotAttend(
    bookingId: string,
    adminId: string,
    approved: boolean,
    adminNote?: string
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.cannotAttendRequest,
      ErrorFactory.badRequest("Booking này chưa có yêu cầu không đến")
    );
    appAssert(
      booking.cannotAttendRequest!.status === "pending",
      ErrorFactory.badRequest("Yêu cầu này đã được xử lý rồi")
    );

    const now = new Date();

    if (approved) {
      // Tính lại refundAmount (dùng thời điểm requestedAt so với checkIn)
      const requestedAt = new Date(booking.cannotAttendRequest!.requestedAt);
      const checkIn = new Date(booking.checkIn);
      const diffMs = checkIn.getTime() - requestedAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let refundRate = 0.5;
      let hostRate = 0.3;
      if (diffDays >= 2) {
        refundRate = 0.7;
        hostRate = 0.2;
      }
      const refundAmount = Math.round(booking.pricing.total * refundRate);
      const hostAmount = Math.round(booking.pricing.total * hostRate);

      // Cộng % vào ví host
      const walletService = new WalletService();
      await walletService.creditHostWalletCannotAttend(
        booking.host.toString(),
        booking._id.toString(),
        booking.pricing.total,
        hostRate
      );

      // Cập nhật booking
      booking.cannotAttendRequest!.status = "approved";
      booking.cannotAttendRequest!.refundAmount = refundAmount;
      booking.cannotAttendRequest!.processedAt = now;
      booking.cannotAttendRequest!.processedBy = new mongoose.Types.ObjectId(adminId);
      if (adminNote) booking.cannotAttendRequest!.adminNote = adminNote;
      booking.refundAmount = refundAmount;
      booking.status = "refunded";

      // Gửi notification cho host
      try {
        const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
        const { PropertyModel } = await import("@/models/property.model");
        const property = await PropertyModel.findById(booking.property);
        await notificationService.createNotification({
          recipient: booking.host.toString(),
          type: "booking_cancelled",
          title: "Khách không đến — Đã xác nhận hoàn tiền",
          message: `Booking #${booking.code} (${property?.name || ""}): Khách không đến, bạn đã nhận ${hostAmount.toLocaleString("vi-VN")}₫ (${Math.round(hostRate * 100)}%) vào ví.`,
          booking: booking._id.toString(),
          link: `/host/bookings/${booking._id}`,
          actionType: "view_booking",
          priority: "high",
          role: "host",
          metadata: { bookingCode: booking.code, hostAmount, refundAmount, refundRate },
        });
      } catch (err) {
        console.error("Failed to send cannot-attend notification to host:", err);
      }
    } else {
      // Rejected
      booking.cannotAttendRequest!.status = "rejected";
      booking.cannotAttendRequest!.processedAt = now;
      booking.cannotAttendRequest!.processedBy = new mongoose.Types.ObjectId(adminId);
      if (adminNote) booking.cannotAttendRequest!.adminNote = adminNote;
      // Trạng thái vẫn là đã hủy (không được hoàn tiền)
      booking.status = "cancelled";
    }

    await booking.save();
    return booking;
  }

  /**
   * Khách gửi yêu cầu hoàn tiền do không hài lòng với cơ sở vật chất (12 tiếng sau check-in)
   * Admin duyệt → hoàn 100%, Host không nhận tiền
   */
  async requestDissatisfaction(
    guestId: string,
    bookingId: string,
    input: RequestDissatisfactionInput
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query);
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.guest.toString() === guestId,
      ErrorFactory.forbidden("Bạn không phải khách của booking này")
    );
    appAssert(
      booking.status === "confirmed",
      ErrorFactory.badRequest("Booking phải ở trạng thái đã xác nhận")
    );
    appAssert(
      booking.paymentStatus === "paid",
      ErrorFactory.badRequest("Booking chưa được thanh toán")
    );
    appAssert(
      !booking.dissatisfactionRequest,
      ErrorFactory.badRequest("Bạn đã gửi yêu cầu hoàn tiền không hài lòng trước đó rồi")
    );

    // Kiểm tra thời gian: từ checkIn đến checkIn + 12 tiếng
    const now = new Date();
    const checkInTime = new Date(booking.checkIn);
    const windowEnd = new Date(checkInTime.getTime() + 12 * 60 * 60 * 1000);
    appAssert(
      now >= checkInTime && now <= windowEnd,
      ErrorFactory.badRequest(
        "Yêu cầu hoàn tiền không hài lòng chỉ được gửi trong vòng 12 tiếng sau khi check-in"
      )
    );

    // Lưu yêu cầu
    booking.dissatisfactionRequest = {
      requestedAt: now,
      reason: input.reason,
      phone: input.phone,
      email: input.email,
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankName: input.bankName,
      evidenceImages: input.evidenceImages,
      status: "pending",
    };
    booking.status = "refund_requested";
    await booking.save();

    return booking;
  }

  /**
   * Admin xử lý yêu cầu hoàn tiền không hài lòng
   * - Approved: đánh dấu refunded, gửi mail thông báo chấp nhận
   * - Rejected: ghi chú lý do, gửi mail thông báo từ chối
   */
  async processDissatisfaction(
    adminId: string,
    bookingId: string,
    input: ProcessDissatisfactionInput
  ): Promise<BookingDocument> {
    const query = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { code: bookingId }] }
      : { code: bookingId };
    const booking = await BookingModel.findOne(query).populate("guest", "name email");
    appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
    appAssert(
      booking.dissatisfactionRequest,
      ErrorFactory.badRequest("Booking này chưa có yêu cầu hoàn tiền không hài lòng")
    );
    appAssert(
      booking.dissatisfactionRequest!.status === "pending",
      ErrorFactory.badRequest("Yêu cầu này đã được xử lý rồi")
    );

    const now = new Date();
    const guest = booking.guest as any;
    const refundAmount = booking.pricing.total;

    booking.dissatisfactionRequest!.status = input.status;
    booking.dissatisfactionRequest!.adminNote = input.adminNote;
    booking.dissatisfactionRequest!.processedAt = now;
    booking.dissatisfactionRequest!.processedBy = new mongoose.Types.ObjectId(adminId);

    if (input.status === "approved") {
      booking.dissatisfactionRequest!.refundAmount = refundAmount;
      booking.status = "refunded";
      booking.paymentStatus = "refunded";
      booking.refundAmount = refundAmount;

      // Gửi email chấp nhận
      try {
        await sendMail({
          to: booking.dissatisfactionRequest!.email || guest?.email,
          subject: "[Cam Trại] Yêu cầu hoàn tiền đã được chấp nhận",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
              <h2 style="color:#059669">✅ Yêu cầu hoàn tiền đã được chấp nhận</h2>
              <p>Xin chào <strong>${guest?.name || booking.fullnameGuest || "Quý khách"}</strong>,</p>
              <p>Chúng tôi đã xem xét và <strong>chấp nhận</strong> yêu cầu hoàn tiền do không hài lòng của bạn đối với booking <strong>#${booking.code}</strong>.</p>
              <div style="background:#ecfdf5;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0">💰 <strong>Số tiền hoàn:</strong> ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(refundAmount)}</p>
                <p style="margin:4px 0 0">🏦 <strong>Tài khoản nhận:</strong> ${booking.dissatisfactionRequest!.bankAccountNumber} - ${booking.dissatisfactionRequest!.bankName}</p>
                <p style="margin:4px 0 0">👤 <strong>Chủ tài khoản:</strong> ${booking.dissatisfactionRequest!.bankAccountName}</p>
              </div>
              ${input.adminNote ? `<p><strong>Ghi chú từ admin:</strong> ${input.adminNote}</p>` : ""}
              <p>Tiền sẽ được chuyển về tài khoản của bạn trong vòng 3-5 ngày làm việc.</p>
              <p style="color:#6b7280;font-size:14px">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Lỗi gửi mail chấp nhận hoàn tiền:", e);
      }
    } else {
      // Rejected → trả lại trạng thái confirmed
      booking.status = "confirmed";

      // Gửi email từ chối
      try {
        await sendMail({
          to: booking.dissatisfactionRequest!.email || guest?.email,
          subject: "[Cam Trại] Yêu cầu hoàn tiền không được chấp nhận",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
              <h2 style="color:#dc2626">❌ Yêu cầu hoàn tiền không được chấp nhận</h2>
              <p>Xin chào <strong>${guest?.name || booking.fullnameGuest || "Quý khách"}</strong>,</p>
              <p>Rất tiếc, sau khi xem xét, chúng tôi <strong>không thể chấp nhận</strong> yêu cầu hoàn tiền của bạn đối với booking <strong>#${booking.code}</strong>.</p>
              ${input.adminNote ? `<div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0"><strong>Lý do:</strong> ${input.adminNote}</p></div>` : ""}
              <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.</p>
              <p style="color:#6b7280;font-size:14px">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Lỗi gửi mail từ chối hoàn tiền:", e);
      }
    }

    await booking.save();
    return booking;
  }

  /**
   * Cronjob: Tự động cộng tiền vào ví host sau 5 ngày khách không xác nhận
   */
  async autoSettleExpiredBookings() {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // Tìm các booking: confirmed + paid + khách chưa xác nhận + chưa cộng ví + đã qua checkIn > 5 ngày
    const expiredBookings = await BookingModel.find({
      status: "confirmed",
      paymentStatus: "paid",
      guestConfirmedAttendance: { $ne: true },
      walletCredited: { $ne: true },
      cannotAttendRequest: { $exists: false },
      checkIn: { $lte: fiveDaysAgo },
    });

    const walletService = new WalletService();
    let settled = 0;

    for (const booking of expiredBookings) {
      try {
        await walletService.creditHostWalletAutoSettle(
          booking.host.toString(),
          (booking._id as mongoose.Types.ObjectId).toString(),
          booking.pricing.total
        );
        await BookingModel.findByIdAndUpdate(booking._id, {
          guestConfirmedAttendance: false,
          walletCredited: true,
          status: "completed",
        });
        settled++;
      } catch (err) {
        console.error(`❌ Lỗi auto-settle booking ${booking._id}:`, err);
      }
    }

    return { settled, total: expiredBookings.length };
  }

  /**
   * Cronjob: Tự động xóa các booking chưa thanh toán có ngày check-in là ngày hôm nay
   */
  async cancelUnpaidBookingsOnCheckinDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Tìm các booking chưa thanh toán và có checkIn trong ngày hôm nay
    const unpaidBookings = await BookingModel.find({
      paymentStatus: { $ne: "paid" },
      checkIn: { $gte: today, $lte: endOfDay },
      status: { $nin: ["cancelled", "completed", "refunded"] },
    });

    let deleted = 0;
    for (const booking of unpaidBookings) {
      try {
        // Mở khóa availability (xóa block đã tạo khi booking)
        await AvailabilityModel.deleteMany({ booking: booking._id });

        // Xóa booking
        await BookingModel.findByIdAndDelete(booking._id);
        deleted++;
      } catch (err) {
        console.error(`❌ Lỗi xóa booking chưa thanh toán ${booking._id}:`, err);
      }
    }

    return { deleted, total: unpaidBookings.length };
  }
}
