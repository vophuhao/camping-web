import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";
import cron from "node-cron";
import { connectRedis, connectToDatabase } from "./config";
import { APP_ORIGIN, NODE_ENV, OK, PORT } from "./constants";
import { authenticate, errorHandler } from "./middleware";
import {
  addressRoutes,
  amenityRoutes,
  authRoutes,
  bookingRoutes,
  categoryRoutes,
  commentRoutes,
  forumRoutes,
  favoriteRoutes,
  mediaRoutes,
  orderRoutes,
  productRoutes,
  propertyRoutes,
  reviewRoutes,
  siteRoutes,
  userRoutes,
} from "./routes";
import cartRoutes from "./routes/cart.route";
import dashboardHRoutes from "./routes/dashbardH.route";
import dashboardRoutes from "./routes/dashboard.route";
import supportRouter from "./routes/directMessage.route";
import notificationRoutes from "./routes/notification.route";
import payosRoutes from "./routes/payos.route,";
import ratingRoutes from "./routes/rating.route";
import freeSpotRoutes from "./routes/free-spot.route";
import reportRoutes from "./routes/report.route";
import { BookingService, OrderService } from "./services";
import { initializeSocket } from "./socket";
// import dashboardRoutes from "./routes/dashboard.route";

const app = express();

// add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

const bookingService = new BookingService();

// cron.schedule("0 * * * *", async () => {
//   console.log("🔄 Running booking cleanup job...");
//   try {
//     const result = await bookingService.cancelExpiredPendingBookings();
//     console.log(
//       `✅ Cleanup completed: ${result.remindersSent} reminders, ${result.bookingsCancelled} cancelled`
//     );
//   } catch (err) {
//     console.error("❌ Booking cleanup job failed:", err);
//   }
// });
// cron.schedule("*/15 * * * *", async () => {
//   try {

//     const result =   await bookingService.autoCompleteBooking();
//     console.log(`✅ ${result} bookings auto-completed.`);
//   } catch (err) {
//     console.error("❌ L?i khi g?i nh?c nh?:", err);
//   }
 
// });
// health check
app.get("/", (_, res) => {
  return res.status(OK).json({
    status: "healthy",
  });
});

// public routes
app.use("/auth", authRoutes);

// protected routes
app.use("/users", authenticate, userRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/media", authenticate, mediaRoutes);
app.use("/cart", authenticate, cartRoutes);
app.use("/address", authenticate, addressRoutes);
app.use("/support", authenticate, supportRouter);
app.use("/orders", authenticate, orderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/rating", ratingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reviews", reviewRoutes);
app.use("/amenities", amenityRoutes);
app.use("/favorites", authenticate, favoriteRoutes);
app.use("/properties", propertyRoutes);
app.use("/sites", siteRoutes);
app.use("/comments", commentRoutes);
app.use("/forum", forumRoutes);
app.use("/free-spots", freeSpotRoutes);
app.use("/reports", reportRoutes);
app.use("/payos/webhook", payosRoutes);
app.use("/messages", authenticate, supportRouter);
app.use("/dashboard", authenticate, dashboardRoutes);
app.use("/dashboardH", authenticate, dashboardHRoutes);
// app.use("/dashboard", authenticate, dashboardRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initializeSocket(server); // Kh?i t?o socket v?i server

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
  await connectRedis();
});
