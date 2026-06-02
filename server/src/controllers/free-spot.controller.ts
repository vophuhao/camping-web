import { catchErrors } from "@/errors";
import { ResponseUtil } from "../utils";
import type { FreeSpotService } from "@/services/free-spot.service";
import { mongoIdSchema } from "@/validators";

export default class FreeSpotController {
  constructor(private readonly freeSpotService: FreeSpotService) { }

  getSpots = catchErrors(async (req: any, res: any) => {
    const { page, limit, search, city, terrain, author } = req.query;
    const result = await this.freeSpotService.getSpots({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      city,
      terrain,
      author,
    });

    const totalPages = Math.ceil(result.total / (limit ? parseInt(limit) : 20));
    return ResponseUtil.paginated(
      res,
      result.spots,
      {
        page: result.currentPage,
        limit: limit ? parseInt(limit) : 20,
        total: result.total,
        totalPages,
        hasNext: result.currentPage < totalPages,
        hasPrev: result.currentPage > 1,
      },
      "Lấy danh sách địa điểm thành công"
    );
  });

  getNearby = catchErrors(async (req: any, res: any) => {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ success: false, message: "lat và lng là bắt buộc" });
    }
    const spots = await this.freeSpotService.getNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 50
    );
    return ResponseUtil.success(res, spots, "Lấy địa điểm gần đây thành công");
  });

  getSpotById = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const spot = await this.freeSpotService.getSpotById(id);
    return ResponseUtil.success(res, spot, "Lấy thông tin địa điểm thành công");
  });

  createSpot = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const {
      title,
      description,
      address,
      city,
      province,
      latitude,
      longitude,
      directions,
      terrain,
      amenities,
    } = req.body;

    if (!title || !description || !address || !city || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    const spot = await this.freeSpotService.createSpot(
      userId,
      {
        title,
        description,
        address,
        city,
        province,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        directions,
        terrain,
        amenities: amenities
          ? typeof amenities === "string"
            ? amenities.split(",")
            : amenities
          : [],
      },
      req.files as any
    );

    return ResponseUtil.created(res, spot, "Chia sẻ địa điểm thành công");
  });

  toggleLike = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const { id } = req.params;
    const result = await this.freeSpotService.toggleLike(id, userId);
    return ResponseUtil.success(res, result, "Cập nhật lượt thích thành công");
  });

  getComments = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const spot = await this.freeSpotService.getSpotById(id);
    // Populate user info
    await spot.populate("comments.user", "username avatarUrl");
    return ResponseUtil.success(res, spot.comments ?? [], "Lấy bình luận thành công");
  });

  addComment = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung bình luận không được trống" });
    }
    const result = await this.freeSpotService.addComment(id, userId, content.trim());
    return ResponseUtil.created(res, result, "Bình luận thành công");
  });

  updateSpot = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      province,
      latitude,
      longitude,
      directions,
      terrain,
      amenities,
    } = req.body;

    const updateData: any = {
      title,
      description,
      address,
      city,
      province,
      directions,
      terrain,
    };

    if (latitude) {
      updateData.latitude = parseFloat(latitude);
    }
    if (longitude) {
      updateData.longitude = parseFloat(longitude);
    }
    if (amenities) {
      updateData.amenities = typeof amenities === "string" ? amenities.split(",") : amenities;
    }

    const spot = await this.freeSpotService.updateSpot(
      id,
      userId,
      updateData,
      req.files as any
    );

    return ResponseUtil.success(res, spot, "Cập nhật địa điểm thành công");
  });

  deleteSpot = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const { id } = req.params;
    await this.freeSpotService.deleteSpot(id, userId);
    return ResponseUtil.success(res, null, "Xóa địa điểm thành công");
  });
}
