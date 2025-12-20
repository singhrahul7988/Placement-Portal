import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  companyId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: string;
  ctc: string; // e.g. "12 LPA"
  deadline: Date;
  criteria: {
    minCgpa: number;
    branches: string[];
  };
  rounds: string[];
  status: 'Open' | 'Closed' | 'Interviewing';
  createdAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    ctc: { type: String, required: true },
    deadline: { type: Date, required: true },
    criteria: {
      minCgpa: { type: Number, default: 0 },
      branches: [{ type: String }],
    },
    rounds: [{ type: String }],
    status: { 
      type: String, 
      enum: ['Open', 'Closed', 'Interviewing'], 
      default: 'Open' 
    },
  },
  { timestamps: true }
);

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;