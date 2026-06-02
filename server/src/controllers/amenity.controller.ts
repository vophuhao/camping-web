import { catchErrors } from "@/errors";
import { AmenityService } from "@/services/amenity.service";
import { ResponseUtil } from "../utils";
import { createAmenitySchema, updateAmenitySchema } from "@/validators/amenity.validator";

export default class AmenityController {
  constructor(private readonly amenityService: AmenityService) { }

  // ========== AMENITY ENDPOINTS ==========

  /**
   * Get all amenities
   * @route GET /api/amenities
   */
  getAllAmenities = catchErrors(async (req, res) => {
    const { includeInactive } = req.query as { includeInactive?: string };

    const amenities = await this.amenityService.getAllAmenities(includeInactive === "true");

    return ResponseUtil.success(res, amenities, "Lấy danh sách amenities thành công");
  });

  /**
   * Get amenities by category
   * @route GET /api/amenities/category/:category
   */
  getAmenitiesByCategory = catchErrors(async (req, res) => {
    const { category } = req.params;
    const { includeInactive } = req.query as { includeInactive?: string };

    const amenities = await this.amenityService.getAmenitiesByCategory(
      category || "",
      includeInactive === "true"
    );

    return ResponseUtil.success(res, amenities, "Lấy amenities theo category thành công");
  });

  /**
   * Create amenity (admin only)
   * @route POST /api/amenities
   */
  createAmenity = catchErrors(async (req, res) => {
    const input = createAmenitySchema.parse(req.body);

    const amenity = await this.amenityService.createAmenity(input);

    return ResponseUtil.created(res, amenity, "Tạo amenity thành công");
  });

  /**
   * Update amenity (admin only)
   * @route PATCH /api/amenities/:id
   */
  updateAmenity = catchErrors(async (req, res) => {
    const { id } = req.params;
    const input = updateAmenitySchema.parse(req.body);

    const amenity = await this.amenityService.updateAmenity(id || "", input);

    return ResponseUtil.success(res, amenity, "Cập nhật amenity thành công");
  });

  /**
   * Delete amenity (admin only)
   * @route DELETE /api/amenities/:id
   */
  deleteAmenity = catchErrors(async (req, res) => {
    const { id } = req.params;

    await this.amenityService.deleteAmenity(id || "");

    return ResponseUtil.success(res, null, "Xóa amenity thành công");
  });

  /**
   * Toggle amenity active status (admin only)
   * @route PATCH /api/amenities/:id/toggle-active
   */
  toggleAmenityActive = catchErrors(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const amenity = await this.amenityService.toggleActive(id || "", isActive);

    return ResponseUtil.success(res, amenity, "Cập nhật trạng thái amenity thành công");
  });
}
