import mongoose from "mongoose";

export interface WithdrawalDocument extends mongoose.Document {
  host: mongoose.Types.ObjectId; // ref User (host's user id)
  hostRecord: mongoose.Types.ObjectId; // ref Host document
  amount: number;
  status: "pending" | "processing" | "completed" | "rejected";
  // Snapshot thông tin ngân hàng tại thời điểm tạo lệnh rút
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  adminNote?: string;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  walletTransactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new mongoose.Schema<WithdrawalDocument>(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    bankInfo: {
      bankName: { type: String, required: true, maxlength: 100 },
      accountNumber: { type: String, required: true, maxlength: 50 },
      accountHolderName: { type: String, required: true, maxlength: 200 },
    },
    adminNote: { type: String, maxlength: 500 },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
    },
  },
  { timestamps: true }
);

withdrawalSchema.index({ host: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export const WithdrawalModel = mongoose.model<WithdrawalDocument>(
  "Withdrawal",
  withdrawalSchema
);
