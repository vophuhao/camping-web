import mongoose from "mongoose";

export interface PayoutDocument extends mongoose.Document {
  host: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  bookings: mongoose.Types.ObjectId[];
  grossAmount: number;
  platformFee: number;
  platformFeeRate: number;
  netAmount: number;
  status: "pending" | "processing" | "completed" | "failed";
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  paidAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new mongoose.Schema<PayoutDocument>(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    grossAmount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    platformFeeRate: { type: Number, default: 0.05 }, // 5%
    netAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    bankInfo: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountHolderName: { type: String, required: true },
    },
    paidAt: { type: Date },
    note: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// Indexes
payoutSchema.index({ host: 1, periodStart: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });

export const PayoutModel = mongoose.model<PayoutDocument>("Payout", payoutSchema);
export default PayoutModel;
