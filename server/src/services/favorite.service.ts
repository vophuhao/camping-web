import { ErrorFactory } from "@/errors";
import { FavoriteModel } from "@/models/availability.model";
import { PropertyModel } from "@/models/property.model";
import { SiteModel } from "@/models/site.model";
import { appAssert } from "../utils";
import {
  CreateFavoriteInput,
  GetFavoritesQuery,
  UpdateFavoriteNotesInput,
} from "@/validators/favorite.validator";
import mongoose from "mongoose";

export class FavoriteService {
  /**
   * Add property or site to user's favorites
   */
  async addFavorite(userId: mongoose.Types.ObjectId, input: CreateFavoriteInput) {
    const { property, site, notes } = input;

    // Validate that the property/site exists
    if (property) {
      const propertyExists = await PropertyModel.findById(property);
      appAssert(propertyExists, ErrorFactory.resourceNotFound("Property"));
      appAssert(propertyExists.isActive, ErrorFactory.badRequest("Property is not active"));
    }

    if (site) {
      const siteExists = await SiteModel.findById(site);
      appAssert(siteExists, ErrorFactory.resourceNotFound("Site"));
      appAssert(siteExists.isActive, ErrorFactory.badRequest("Site is not active"));
    }

    // Check if already favorited
    const existingFavorite = await FavoriteModel.findOne({
      user: userId,
      ...(property ? { property } : { site }),
    });

    appAssert(!existingFavorite, ErrorFactory.conflict("Already in favorites"));

    // Create favorite
    const favorite = await FavoriteModel.create({
      user: userId,
      property,
      site,
      notes,
    });

    return favorite.populate([
      { path: "property", select: "name slug photos pricing stats location" },
      { path: "site", select: "name slug photos pricing propertyRef siteType" },
    ]);
  }

  /**
   * Remove favorite by ID
   */
  async removeFavorite(userId: mongoose.Types.ObjectId, favoriteId: string) {
    const favorite = await FavoriteModel.findOneAndDelete({
      _id: favoriteId,
      user: userId,
    });

    appAssert(favorite, ErrorFactory.resourceNotFound("Favorite"));

    return { message: "Removed from favorites" };
  }

  /**
   * Remove favorite by property or site ID
   */
  async removeFavoriteByReference(
    userId: mongoose.Types.ObjectId,
    refType: "property" | "site",
    refId: string
  ) {
    const filter: any = { user: userId };
    filter[refType] = refId;

    const favorite = await FavoriteModel.findOneAndDelete(filter);

    appAssert(favorite, ErrorFactory.resourceNotFound("Favorite"));

    return { message: "Removed from favorites" };
  }

  /**
   * Get all user's favorites with pagination
   */
  async getUserFavorites(userId: mongoose.Types.ObjectId, query: GetFavoritesQuery) {
    const { type, page, limit } = query;

    const filter: any = { user: userId };

    if (type === "property") {
      filter.property = { $exists: true, $ne: null };
    } else if (type === "site") {
      filter.site = { $exists: true, $ne: null };
    }

    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      FavoriteModel.find(filter)
        .populate({
          path: "property",
          select: "name slug photos pricing stats location propertyType",
        })
        .populate({
          path: "site",
          select: "name slug photos pricing propertyRef siteType capacity",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FavoriteModel.countDocuments(filter),
    ]);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if property or site is favorited by user
   */
  async isFavorited(
    userId: mongoose.Types.ObjectId,
    refType: "property" | "site",
    refId: string
  ): Promise<boolean> {
    const filter: any = { user: userId };
    filter[refType] = refId;

    const favorite = await FavoriteModel.findOne(filter).lean();

    return !!favorite;
  }

  /**
   * Update favorite notes
   */
  async updateNotes(
    userId: mongoose.Types.ObjectId,
    favoriteId: string,
    input: UpdateFavoriteNotesInput
  ) {
    const favorite = await FavoriteModel.findOneAndUpdate(
      { _id: favoriteId, user: userId },
      { notes: input.notes },
      { new: true }
    ).populate([
      { path: "property", select: "name slug photos pricing stats location" },
      { path: "site", select: "name slug photos pricing propertyRef siteType" },
    ]);

    appAssert(favorite, ErrorFactory.resourceNotFound("Favorite"));

    return favorite;
  }

  /**
   * Get favorite count by property or site
   */
  async getFavoriteCount(refType: "property" | "site", refId: string): Promise<number> {
    const filter: any = {};
    filter[refType] = refId;

    return FavoriteModel.countDocuments(filter);
  }
}
