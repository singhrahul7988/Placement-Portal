import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "company_request" | "drive_posted" | "drive_status" | "report_ready";
  title: string;
  detail: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["company_request", "drive_posted", "drive_status", "report_ready"],
      required: true,
    },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

export default Notification;
