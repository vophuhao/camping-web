import { catchErrors } from "@/errors";
import PayoutService from "@/services/payout.service";
import { ResponseUtil } from "@/utils";

export default class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  // Admin: Chạy tổng kết tháng
  runMonthlyPayout = catchErrors(async (req: any, res: any) => {
    const { month, year } = req.body;
    const m = month || new Date().getMonth(); // previous month (0-indexed, but runMonthlyPayout expects 1-indexed)
    const y = year || new Date().getFullYear();

    // Nếu không truyền tháng, lấy tháng trước
    const targetMonth = month || (new Date().getMonth() === 0 ? 12 : new Date().getMonth());
    const targetYear = month ? y : (new Date().getMonth() === 0 ? y - 1 : y);

    const result = await this.payoutService.runMonthlyPayout(targetMonth, targetYear);
    return ResponseUtil.success(res, result, result.message);
  });

  // Admin: Xem tất cả payout
  getAllPayouts = catchErrors(async (req: any, res: any) => {
    const { status, hostId, month, year, page, limit } = req.query;
    const result = await this.payoutService.getAllPayouts({
      status,
      hostId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return ResponseUtil.success(res, result, "Lấy danh sách payout thành công");
  });

  // Admin: Xác nhận đã chuyển tiền
  markCompleted = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const { note } = req.body;
    const payout = await this.payoutService.markPayoutCompleted(id, note);
    return ResponseUtil.success(res, payout, "Đã xác nhận chuyển tiền");
  });

  // Host: Xem payout của mình
  getMyPayouts = catchErrors(async (req: any, res: any) => {
    const hostId = req.userId.toString();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await this.payoutService.getPayoutsByHost(hostId, page, limit);
    return ResponseUtil.success(res, result, "Lấy lịch sử payout thành công");
  });

  // Host: Xem tổng doanh thu
  getRevenueSummary = catchErrors(async (req: any, res: any) => {
    const hostId = req.userId.toString();
    const { startDate, endDate } = req.query;
    const result = await this.payoutService.getHostRevenueSummary(hostId, startDate, endDate);
    return ResponseUtil.success(res, result, "Lấy thống kê doanh thu thành công");
  });

  // Host: Export CSV
  exportRevenue = catchErrors(async (req: any, res: any) => {
    const hostId = req.userId.toString();
    const { startDate, endDate } = req.query;
    const csv = await this.payoutService.exportHostRevenue(hostId, startDate, endDate);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`);
    // Add BOM for Excel UTF-8 compatibility
    return res.send("\uFEFF" + csv);
  });

  // Admin: Xem tất cả booking chưa thanh toán cho host (nhóm theo host)
  getUnpaidBookingsByHost = catchErrors(async (_req: any, res: any) => {
    const result = await this.payoutService.getUnpaidBookingsByHost();
    return ResponseUtil.success(res, result, "Lấy danh sách booking chưa thanh toán thành công");
  });
}
