import NotificationController from "@/controllers/notification.controller";
import { container, TOKENS } from "@/di";
import { authenticate, requireAdmin } from "@/middleware";
import NotificationService from "@/services/notification.service";
import { Router } from "express";

const router = Router();
const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);
const notificationController = new NotificationController(notificationService);

// User routes - Require authentication
router.get("/", authenticate, notificationController.getNotifications);
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.patch("/:notificationId/read", authenticate, notificationController.markAsRead);
router.patch("/read-all", authenticate, notificationController.markAllAsRead);
router.delete("/:notificationId", authenticate, notificationController.deleteNotification);
router.delete("/", authenticate, notificationController.deleteAllNotifications);

// Admin routes
router.post("/", requireAdmin, notificationController.createNotification);
router.post("/admin/send-bulk", requireAdmin, notificationController.sendBulkToHosts);
router.get("/admin/hosts", requireAdmin, notificationController.getHosts);
router.get("/admin/sent", requireAdmin, notificationController.getAdminSentNotifications);
router.delete("/admin/sent/:notificationId", requireAdmin, notificationController.deleteAdminNotification);
router.delete("/admin/broadcast", requireAdmin, notificationController.deleteAdminBroadcast);

export default router;
