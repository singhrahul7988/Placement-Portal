import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnership extends Document {
  requesterId: mongoose.Types.ObjectId; // Who sent the request
  recipientId: mongoose.Types.ObjectId; // Who received it
  status: 'Pending' | 'Active' | 'Rejected';
  createdAt: Date;
}

const PartnershipSchema: Schema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Active', 'Rejected'], 
      default: 'Pending' 
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests between the same two users
PartnershipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Partnership = mongoose.model<IPartnership>('Partnership', PartnershipSchema);
export default Partnership;