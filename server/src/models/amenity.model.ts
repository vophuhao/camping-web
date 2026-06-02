import mongoose from "mongoose";

// Amenity model - Tiện nghi campsite
export interface AmenityDocument extends mongoose.Document {
  name: string;
  description?: string;
  icon?: string; // tên icon hoặc URL
  category: "basic" | "comfort" | "safety" | "outdoor" | "special";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const amenitySchema = new mongoose.Schema<AmenityDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["basic", "comfort", "safety", "outdoor", "special"],
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Index for filtering
amenitySchema.index({ name: 1 }, { unique: true });
amenitySchema.index({ category: 1 });
amenitySchema.index({ isActive: 1 });
amenitySchema.index({ category: 1, isActive: 1 });

export const AmenityModel = mongoose.model<AmenityDocument>("Amenity", amenitySchema);
