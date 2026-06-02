import { catchErrors } from "@/errors";
import { FavoriteService } from "@/services/favorite.service";
import { ResponseUtil } from "../utils";
import { mongoIdSchema } from "@/validators";
import {
  createFavoriteSchema,
  getFavoritesQuerySchema,
  updateFavoriteNotesSchema,
} from "@/validators/favorite.validator";

export default class FavoriteController {
  private favoriteService: FavoriteService;

  constructor() {
    this.favoriteService = new FavoriteService();
  }

  /**
   * POST /favorites
   * Add property/site to favorites
   */
  addToFavorites = catchErrors(async (req, res) => {
    const userId = req.userId;
    const input = createFavoriteSchema.parse(req.body);

    const favorite = await this.favoriteService.addFavorite(userId, input);

    return ResponseUtil.created(res, favorite, "Added to favorites");
  });

  /**
   * DELETE /favorites/:id
   * Remove favorite by ID
   */
  removeFavorite = catchErrors(async (req, res) => {
    const userId = req.userId;
    const id = mongoIdSchema.parse(req.params.id);

    const result = await this.favoriteService.removeFavorite(userId, id);

    return ResponseUtil.success(res, result, result.message);
  });

  /**
   * DELETE /favorites/property/:propertyId
   * Remove favorite by property ID
   */
  removeFavoriteByProperty = catchErrors(async (req, res) => {
    const userId = req.userId;
    const propertyId = mongoIdSchema.parse(req.params.propertyId);

    const result = await this.favoriteService.removeFavoriteByReference(
      userId,
      "property",
      propertyId
    );

    return ResponseUtil.success(res, result, result.message);
  });

  /**
   * DELETE /favorites/site/:siteId
   * Remove favorite by site ID
   */
  removeFavoriteBySite = catchErrors(async (req, res) => {
    const userId = req.userId;
    const siteId = mongoIdSchema.parse(req.params.siteId);

    const result = await this.favoriteService.removeFavoriteByReference(userId, "site", siteId);

    return ResponseUtil.success(res, result, result.message);
  });

  /**
   * GET /favorites
   * Get user's favorites with pagination
   */
  getUserFavorites = catchErrors(async (req, res) => {
    const userId = req.userId;
    const query = getFavoritesQuerySchema.parse(req.query);

    const result = await this.favoriteService.getUserFavorites(userId, query);

    return ResponseUtil.paginated(
      res,
      result.favorites,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNext: result.pagination.page < result.pagination.totalPages,
        hasPrev: result.pagination.page > 1,
      },
      "Lấy danh sách yêu thích thành công"
    );
  });

  /**
   * GET /favorites/check/:refType/:refId
   * Check if property/site is favorited
   */
  checkIsFavorited = catchErrors(async (req, res) => {
    const userId = req.userId;
    const { refType, refId } = req.params as { refType: "property" | "site"; refId: string };
    const validRefId = mongoIdSchema.parse(refId);

    const isFavorited = await this.favoriteService.isFavorited(userId, refType, validRefId);

    return ResponseUtil.success(res, { isFavorited }, "");
  });

  /**
   * PATCH /favorites/:id/notes
   * Update favorite notes
   */
  updateNotes = catchErrors(async (req, res) => {
    const userId = req.userId;
    const id = mongoIdSchema.parse(req.params.id);
    const input = updateFavoriteNotesSchema.parse(req.body);

    const favorite = await this.favoriteService.updateNotes(userId, id, input);

    return ResponseUtil.success(res, favorite, "Notes updated");
  });
}
