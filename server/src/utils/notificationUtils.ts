import mongoose from "mongoose";
import Notification from "../models/Notification";
import User from "../models/User";

export const getCollegeTeamUserIds = async (collegeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    return [];
  }
  const collegeObjectId = new mongoose.Types.ObjectId(collegeId);
  const users = await User.find({
    $or: [
      { _id: collegeObjectId, role: "college" },
      { collegeId: collegeObjectId, role: "college_member" },
    ],
  }).select("_id");

  return users.map((user) => String(user._id));
};

export const createNotificationsForUsers = async (
  userIds: string[],
  payload: {
    type: "company_request" | "drive_posted" | "drive_status" | "report_ready";
    title: string;
    detail: string;
  }
) => {
  if (!userIds.length) return;
  const records = userIds.map((userId) => ({
    userId,
    type: payload.type,
    title: payload.title,
    detail: payload.detail,
    read: false,
  }));
  await Notification.insertMany(records);
};
