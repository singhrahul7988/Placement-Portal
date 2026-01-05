import mongoose, { Document, Schema } from "mongoose";

export interface IPlacementRecord extends Document {
  collegeId: mongoose.Types.ObjectId;
  studentId: string;
  studentName: string;
  department: string;
  classYear: string;
  companyName: string;
  jobProfile: string;
  offersReceived: number;
  ctcLpa: number;
  placedStatus: "Yes" | "No";
  offerDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlacementRecordSchema = new Schema<IPlacementRecord>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    classYear: { type: String, required: true },
    companyName: { type: String, required: true },
    jobProfile: { type: String, required: true },
    offersReceived: { type: Number, default: 0 },
    ctcLpa: { type: Number, default: 0 },
    placedStatus: { type: String, enum: ["Yes", "No"], default: "No" },
    offerDate: { type: Date },
  },
  { timestamps: true }
);

PlacementRecordSchema.index({ collegeId: 1, classYear: 1, department: 1 });

const PlacementRecord = mongoose.model<IPlacementRecord>(
  "PlacementRecord",
  PlacementRecordSchema
);

export default PlacementRecord;
