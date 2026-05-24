import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const reportSchema = new Schema({
  reporterId: { type: Types.ObjectId, ref: "User", required: true },
  targetId: { type: String, required: true }, // ID of post or free-spot
  targetType: {
    type: String,
    enum: ["post", "free-spot"],
    required: true,
  },
  reason: {
    type: String,
    enum: [
      "spam",
      "inappropriate_content",
      "harassment",
      "fake_information",
      "copyright_violation",
      "other",
    ],
    required: true,
  },
  description: { type: String, maxlength: 1000 },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved", "dismissed"],
    default: "pending",
  },
  resolvedBy: { type: Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
  resolveNote: { type: String },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ targetId: 1, targetType: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
