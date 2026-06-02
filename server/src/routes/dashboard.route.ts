import { Router } from "express";

import DashboardController from "@/controllers/dashboard.controller";
import { authenticate, requireAdmin } from "@/middleware";

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

// Tất cả routes đều yêu cầu admin
dashboardRoutes.use(authenticate, requireAdmin);

// Overview stats
dashboardRoutes.get("/overview", dashboardController.getOverviewStats);

// Revenue stats
dashboardRoutes.get("/revenue", dashboardController.getRevenueStats);

// Booking stats
dashboardRoutes.get("/bookings", dashboardController.getBookingStats);


// Property stats
dashboardRoutes.get("/properties", dashboardController.getPropertyStats);

// Top properties
dashboardRoutes.get("/top-properties", dashboardController.getTopProperties);

// Top products

// Top hosts
dashboardRoutes.get("/top-hosts", dashboardController.getTopHosts);

// Growth stats
dashboardRoutes.get("/growth", dashboardController.getGrowthStats);

// Revenue report (with host/date filters)
dashboardRoutes.get("/revenue-report", dashboardController.getRevenueReport);

export default dashboardRoutes;