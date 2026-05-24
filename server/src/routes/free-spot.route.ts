import { authenticate, upload } from "@/middleware";
import FreeSpotController from "@/controllers/free-spot.controller";
import { FreeSpotService } from "@/services/free-spot.service";
import { Router } from "express";

const freeSpotRoutes = Router();
const freeSpotService = new FreeSpotService();
const freeSpotController = new FreeSpotController(freeSpotService);

// Public
freeSpotRoutes.get("/", freeSpotController.getSpots);
freeSpotRoutes.get("/nearby", freeSpotController.getNearby);
freeSpotRoutes.get("/:id", freeSpotController.getSpotById);
freeSpotRoutes.get("/:id/comments", freeSpotController.getComments);

// Authenticated
freeSpotRoutes.post(
  "/",
  authenticate,
  upload.fields([{ name: "images", maxCount: 8 }]),
  freeSpotController.createSpot
);
freeSpotRoutes.post("/:id/like", authenticate, freeSpotController.toggleLike);
freeSpotRoutes.post("/:id/comments", authenticate, freeSpotController.addComment);
freeSpotRoutes.put(
  "/:id",
  authenticate,
  upload.fields([{ name: "images", maxCount: 8 }]),
  freeSpotController.updateSpot
);
freeSpotRoutes.delete("/:id", authenticate, freeSpotController.deleteSpot);

export default freeSpotRoutes;
