import { catchErrors } from "@/errors";
import { ResponseUtil } from "@/utils";
import { mongoIdSchema } from "@/validators";
import type { ReportService } from "@/services/report.service";

export default class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Create a report
   * @route POST /reports
   */
  createReport = catchErrors(async (req: any, res: any) => {
    const userId = mongoIdSchema.parse(req.userId);
    const { targetId, targetType, reason, description } = req.body;

    if (!targetId || !targetType || !reason) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    if (!["post", "free-spot"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "targetType không hợp lệ",
      });
    }

    const report = await this.reportService.createReport(userId, {
      targetId,
      targetType,
      reason,
      description,
    });

    return ResponseUtil.created(res, report, "Báo cáo đã được gửi thành công");
  });

  /**
   * Get all reports (admin)
   * @route GET /reports
   */
  getReports = catchErrors(async (req: any, res: any) => {
    const { page, limit, status, targetType } = req.query;
    const result = await this.reportService.getReports({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      targetType,
    });

    return ResponseUtil.paginated(
      res,
      result.reports,
      {
        page: result.currentPage,
        limit: limit ? parseInt(limit) : 20,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.currentPage < result.totalPages,
        hasPrev: result.currentPage > 1,
      },
      "Lấy danh sách báo cáo thành công"
    );
  });

  /**
   * Update report status (admin)
   * @route PATCH /reports/:id
   */
  updateReportStatus = catchErrors(async (req: any, res: any) => {
    const adminId = mongoIdSchema.parse(req.userId);
    const { id } = req.params;
    const { status, resolveNote, action } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Thiếu status" });
    }

    const report = await this.reportService.updateReportStatus(
      id,
      adminId,
      status,
      resolveNote,
      action
    );

    return ResponseUtil.success(res, report, "Cập nhật báo cáo thành công");
  });

  /**
   * Admin: Get all forum posts
   * @route GET /reports/admin/forum-posts
   */
  getAdminForumPosts = catchErrors(async (req: any, res: any) => {
    const { page, limit, status, search } = req.query;
    const result = await this.reportService.getAllForumPosts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });

    return ResponseUtil.paginated(
      res,
      result.posts,
      {
        page: result.currentPage,
        limit: limit ? parseInt(limit) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
        hasNext: result.currentPage < Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
        hasPrev: result.currentPage > 1,
      },
      "Lấy danh sách bài viết thành công"
    );
  });

  /**
   * Admin: Update forum post status
   * @route PATCH /reports/admin/forum-posts/:id
   */
  updateForumPostStatus = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const { status, moderationReason } = req.body;

    const post = await this.reportService.updateForumPostStatus(
      id,
      status,
      moderationReason
    );

    return ResponseUtil.success(res, post, "Cập nhật trạng thái bài viết thành công");
  });

  /**
   * Admin: Get all free-spots
   * @route GET /reports/admin/free-spots
   */
  getAdminFreeSpots = catchErrors(async (req: any, res: any) => {
    const { page, limit, status, search } = req.query;
    const result = await this.reportService.getAllFreeSpots({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });

    return ResponseUtil.paginated(
      res,
      result.spots,
      {
        page: result.currentPage,
        limit: limit ? parseInt(limit) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
        hasNext: result.currentPage < Math.ceil(result.total / (limit ? parseInt(limit) : 20)),
        hasPrev: result.currentPage > 1,
      },
      "Lấy danh sách địa điểm thành công"
    );
  });

  /**
   * Admin: Update free-spot status
   * @route PATCH /reports/admin/free-spots/:id
   */
  updateFreeSpotStatus = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const { status, isVerified } = req.body;

    const spot = await this.reportService.updateFreeSpotStatus(id, status, isVerified);

    return ResponseUtil.success(res, spot, "Cập nhật trạng thái địa điểm thành công");
  });
}
