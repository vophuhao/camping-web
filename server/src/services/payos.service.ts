import { ErrorFactory } from "@/errors";
import { AvailabilityModel, BookingModel } from "@/models";
import appAssert from "../utils/app-assert";
import mongoose from "mongoose";
import { sendBookingSuccessEmail } from "../utils/send-booking-email";



export default class PayOSService {
    constructor() { }


    async handlePayOS(data: any) {

        console.log("Received PayOS webhook data:", data);

        const description = data.data?.description || ""; // Lấy description
        const isBooking = description.includes("BOOKING")
        const isOrder = description.includes("ORDER");
        console.log(data);
        if (isBooking) {
            try {
                const orderCode = data.data?.orderCode;
                const success = data.data?.status === "PAID" || data.success;
                const booking = await BookingModel.findOne({ payOSOrderCode: orderCode })
                    .populate("property", "name location")
                    .populate("site", "name")
                    .populate("guest", "username email fullName name");
                appAssert(booking, ErrorFactory.resourceNotFound("Booking"));
                console.log("Found booking for PayOS webhook:", booking);
                if (success) {
                    booking.paymentStatus = "paid";
                    await booking.save();
                    
                    // Gửi email xác nhận đặt chỗ cho khách hàng
                    try {
                        await sendBookingSuccessEmail(booking);
                    } catch (mailErr) {
                        console.error("Lỗi khi gửi email xác nhận đặt chỗ:", mailErr);
                    }

                    return { success: true, code: "PAYMENT_SUCCESS", message: "Thanh toán thành công", booking };
                } else {
                    console.error("Payment failed for booking with orderCode:", orderCode);
                    booking.paymentStatus = "failed";
                    console.error("đã vô đây");
                    await booking.save();


                    return { success: false, code: "PAYMENT_FAILED", message: "Thanh toán thất bại", booking };
                }
            } catch (err: any) {
                console.error("Error handling PayOS webhook:", err.message);
                return { success: false, code: "WEBHOOK_ERROR", message: err.message };
            }
        }

        else {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const orderCode = data.data?.orderCode;
                const success = data.data?.status === "PAID" || data.success;

                if (!orderCode) {
                    await session.abortTransaction();
                    session.endSession();
                    return { success: false, code: "MISSING_ORDER_CODE", message: "Thiếu orderCode" };
                }


            } catch (err: any) {
                await session.abortTransaction();
                session.endSession();
                return { success: false, code: "WEBHOOK_ERROR", message: err.message };
            }
        }
    }
}