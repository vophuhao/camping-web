import { catchErrors } from "@/errors";
import { ResponseUtil } from "../utils";
import { mongoIdSchema } from "@/validators";
import WalletService from "@/services/wallet.service";

const walletService = new WalletService();

export default class WalletController {
  // Host: xem số dư ví
  getBalance = catchErrors(async (req: any, res: any) => {
    const hostUserId = mongoIdSchema.parse(req.userId);
    const balance = await walletService.getWalletBalance(hostUserId);
    return ResponseUtil.success(res, balance, "Lấy số dư ví thành công");
  });

  // Host: xem lịch sử giao dịch
  getTransactions = catchErrors(async (req: any, res: any) => {
    const hostUserId = mongoIdSchema.parse(req.userId);
    const { page, limit } = req.query;
    const result = await walletService.getWalletTransactions(
      hostUserId,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    return ResponseUtil.success(res, result, "Lấy lịch sử giao dịch thành công");
  });

  // Host: tạo lệnh rút tiền
  createWithdrawal = catchErrors(async (req: any, res: any) => {
    const hostUserId = mongoIdSchema.parse(req.userId);
    const { amount } = req.body;
    const withdrawal = await walletService.createWithdrawalRequest(
      hostUserId,
      Number(amount)
    );
    return ResponseUtil.success(res, withdrawal, "Đã tạo lệnh rút tiền thành công");
  });

  // Host: xem lịch sử lệnh rút
  getWithdrawals = catchErrors(async (req: any, res: any) => {
    const hostUserId = mongoIdSchema.parse(req.userId);
    const { page, limit } = req.query;
    const result = await walletService.getWithdrawals(
      hostUserId,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    return ResponseUtil.success(res, result, "Lấy lịch sử rút tiền thành công");
  });

  // Admin: xem tất cả lệnh rút
  adminGetAllWithdrawals = catchErrors(async (req: any, res: any) => {
    const { status, hostId, page, limit } = req.query;
    const result = await walletService.adminGetAllWithdrawals({
      status,
      hostId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return ResponseUtil.success(res, result, "Lấy danh sách lệnh rút thành công");
  });

  // Admin: xử lý lệnh rút
  adminProcessWithdrawal = catchErrors(async (req: any, res: any) => {
    const { id } = req.params;
    const adminId = req.userId.toString();
    const { approved, adminNote } = req.body;

    const withdrawal = await walletService.adminProcessWithdrawal(
      id || "",
      adminId,
      approved === true || approved === "true",
      adminNote
    );
    return ResponseUtil.success(
      res,
      withdrawal,
      approved ? "Đã duyệt lệnh rút tiền" : "Đã từ chối lệnh rút tiền"
    );
  });
}
