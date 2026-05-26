import mongoose from "mongoose";

export interface WalletTransactionDocument extends mongoose.Document {
  host: mongoose.Types.ObjectId; // ref User (host's user id)
  type: "credit" | "debit"; // cộng / trừ
  amount: number;
  bookingId?: mongoose.Types.ObjectId; // khi type=credit từ booking
  withdrawalId?: mongoose.Types.ObjectId; // khi type=debit từ lệnh rút
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

const walletTransactionSchema = new mongoose.Schema<WalletTransactionDocument>(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal" },
    description: { type: String, required: true, maxlength: 500 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ host: 1, createdAt: -1 });

export const WalletTransactionModel = mongoose.model<WalletTransactionDocument>(
  "WalletTransaction",
  walletTransactionSchema
);
