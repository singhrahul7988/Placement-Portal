import { Request, Response } from "express";
import Notification from "../models/Notification";
import User from "../models/User";
import { createNotificationsForUsers, getCollegeTeamUserIds } from "../utils/notificationUtils";

type AuthRequest = Request & { userId?: string };

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    const limit = Number(req.query.limit ?? 50);
    const notifications = await Notification.find({ userId: authReq.userId })
      .sort({ createdAt: -1 })
      .limit(Number.isFinite(limit) ? limit : 50)
      .lean();
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load notifications." });
  }
};

export const markNotificationsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { ids, markAll } = req.body as {
      ids?: string[];
      markAll?: boolean;
    };

    if (markAll) {
      await Notification.updateMany(
        { userId: authReq.userId, read: false },
        { $set: { read: true } }
      );
      res.json({ message: "Notifications marked as read." });
      return;
    }

    if (Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: authReq.userId },
        { $set: { read: true } }
      );
      res.json({ message: "Notifications updated." });
      return;
    }

    res.status(400).json({ message: "No notifications selected." });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update notifications." });
  }
};

export const createReportReadyNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const user = await User.findById(authReq.userId).select("role collegeId name");
    if (!user || !["college", "college_member"].includes(user.role)) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const collegeId = user.role === "college" ? String(user._id) : String(user.collegeId || "");
    if (!collegeId) {
      res.status(400).json({ message: "College profile missing." });
      return;
    }

    const title = String(req.body.title || "Report ready").trim();
    const detail = String(req.body.detail || "A placement report is ready for download.").trim();

    const userIds = await getCollegeTeamUserIds(collegeId);
    await createNotificationsForUsers(userIds, {
      type: "report_ready",
      title,
      detail,
    });

    res.status(201).json({ message: "Notification sent." });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to create notification." });
  }
};
