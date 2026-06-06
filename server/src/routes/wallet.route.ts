import WalletController from "@/controllers/wallet.controller";
import { authenticate, requireAdmin } from "@/middleware";
import { Router } from "express";

const walletRoutes = Router();
const walletController = new WalletController();

// Host routes
walletRoutes.get("/balance", authenticate, walletController.getBalance);
walletRoutes.get("/transactions", authenticate, walletController.getTransactions);
walletRoutes.post("/withdraw", authenticate, walletController.createWithdrawal);
walletRoutes.get("/withdrawals", authenticate, walletController.getWithdrawals);

// Admin routes
walletRoutes.get("/admin/withdrawals", requireAdmin, walletController.adminGetAllWithdrawals);
walletRoutes.get("/admin/hosts-balances", requireAdmin, walletController.adminGetHostBalances);
walletRoutes.post(
  "/admin/withdrawals/:id/process",
  requireAdmin,
  walletController.adminProcessWithdrawal
);

export default walletRoutes;
