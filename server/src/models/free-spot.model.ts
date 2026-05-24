import mongoose from "mongoose";
import { slugify, generateUniqueSlug } from "../utils/slug";

const { Schema, Types } = mongoose;

const freeSpotCommentSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const freeSpotSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String },

  // GeoJSON Point [lng, lat]
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },

  images: [{ type: String }],
  directions: { type: String }, // chi tiết đường đi

  author: { type: Types.ObjectId, ref: "User", required: true },

  terrain: {
    type: String,
    enum: ["mountain", "beach", "forest", "river", "lake", "field", "other"],
    default: "other",
  },
  amenities: [{ type: String }], // "stream_nearby", "firewood", "flat_ground", ...

  likes: [{ type: Types.ObjectId, ref: "User" }],
  likeCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },

  // Embedded comments
  comments: [freeSpotCommentSchema],
  commentCount: { type: Number, default: 0 },

  slug: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["active", "pending", "hidden"],
    default: "active",
  },
  reportCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

// Geospatial index
freeSpotSchema.index({ location: "2dsphere" });
freeSpotSchema.index({ status: 1, createdAt: -1 });
freeSpotSchema.index({ city: 1 });
freeSpotSchema.index({ author: 1 });

// Auto-generate slug
freeSpotSchema.pre("save", async function (this: any, next) {
  try {
    if (!this.isModified("title") && this.slug) return next();
    const base =
      slugify(this.title) || `spot-${this._id?.toString() || Date.now()}`;
    this.slug = await generateUniqueSlug(
      base,
      this.constructor as any,
      this._id
    );
    next();
  } catch (e) {
    next(e instanceof Error ? e : new Error(String(e)));
  }
});

const FreeSpot = mongoose.model("FreeSpot", freeSpotSchema);
export default FreeSpot;
