import { ErrorFactory } from "@/errors";
import { AmenityModel, type AmenityDocument } from "@/models";
import appAssert from "../utils/app-assert";
import type { CreateAmenityInput, UpdateAmenityInput } from "@/validators/amenity.validator";

export class AmenityService {
  /**
   * Get all amenities (active only)
   */
  async getAllAmenities(includeInactive = false): Promise<AmenityDocument[]> {
    const query = includeInactive ? {} : { isActive: true };
    const amenities = await AmenityModel.find(query).sort({ category: 1, name: 1 });
    return amenities;
  }

  /**
   * Get amenities by category
   */
  async getAmenitiesByCategory(
    category: string,
    includeInactive = false
  ): Promise<AmenityDocument[]> {
    const query: any = { category };
    if (!includeInactive) query.isActive = true;

    const amenities = await AmenityModel.find(query).sort({ name: 1 });
    return amenities;
  }

  /**
   * Create amenity (admin only)
   */
  async createAmenity(input: CreateAmenityInput): Promise<AmenityDocument> {
    const amenity = await AmenityModel.create(input);
    return amenity;
  }

  /**
   * Update amenity (admin only)
   */
  async updateAmenity(amenityId: string, input: UpdateAmenityInput): Promise<AmenityDocument> {
    const amenity = await AmenityModel.findByIdAndUpdate(amenityId, input, {
      new: true,
    });
    appAssert(amenity, ErrorFactory.resourceNotFound("Amenity"));
    return amenity!;
  }

  /**
   * Delete amenity (admin only)
   */
  async deleteAmenity(amenityId: string): Promise<void> {
    const result = await AmenityModel.findByIdAndDelete(amenityId);
    appAssert(result, ErrorFactory.resourceNotFound("Amenity"));
  }

  /**
   * Toggle active status
   */
  async toggleActive(amenityId: string, isActive: boolean): Promise<AmenityDocument> {
    const amenity = await AmenityModel.findByIdAndUpdate(amenityId, { isActive }, { new: true });
    appAssert(amenity, ErrorFactory.resourceNotFound("Amenity"));
    return amenity!;
  }
}
