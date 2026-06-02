import PayoutController from "@/controllers/payout.controller";
import { authenticate, requireAdmin } from "@/middleware";
import PayoutService from "@/services/payout.service";
import { Router } from "express";

const router = Router();
const payoutService = new PayoutService();
const payoutController = new PayoutController(payoutService);

// Admin routes
router.get("/admin/all", requireAdmin, payoutController.getAllPayouts);
router.get("/admin/unpaid-bookings", requireAdmin, payoutController.getUnpaidBookingsByHost);
router.post("/admin/run", requireAdmin, payoutController.runMonthlyPayout);
router.patch("/admin/:id/complete", requireAdmin, payoutController.markCompleted);

// Host routes
router.get("/host/my", authenticate, payoutController.getMyPayouts);
router.get("/host/revenue", authenticate, payoutController.getRevenueSummary);
router.get("/host/revenue/export", authenticate, payoutController.exportRevenue);

export default router;
