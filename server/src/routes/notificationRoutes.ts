import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createReportReadyNotification,
  getNotifications,
  markNotificationsRead,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read", authMiddleware, markNotificationsRead);
router.post("/report-ready", authMiddleware, createReportReadyNotification);

export default router;
