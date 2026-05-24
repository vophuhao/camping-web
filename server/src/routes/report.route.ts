import { authenticate } from "@/middleware";
import { ReportService } from "@/services/report.service";
import ReportController from "@/controllers/report.controller";
import { Router } from "express";

const reportRoutes = Router();
const reportService = new ReportService();
const reportController = new ReportController(reportService);

// User: submit a report (authenticated)
reportRoutes.post("/", authenticate, reportController.createReport);

// Admin: list all reports
reportRoutes.get("/", authenticate, reportController.getReports);

// Admin: update report status
reportRoutes.patch("/:id", authenticate, reportController.updateReportStatus);

// Admin: manage forum posts
reportRoutes.get("/admin/forum-posts", authenticate, reportController.getAdminForumPosts);
reportRoutes.patch("/admin/forum-posts/:id", authenticate, reportController.updateForumPostStatus);

// Admin: manage free-spots
reportRoutes.get("/admin/free-spots", authenticate, reportController.getAdminFreeSpots);
reportRoutes.patch("/admin/free-spots/:id", authenticate, reportController.updateFreeSpotStatus);

export default reportRoutes;
