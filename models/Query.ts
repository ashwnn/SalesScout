import mongoose, { Document, Schema } from 'mongoose';

export interface IQuery extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  keywords: string[];
  categories?: string[];
  intervalMinutes: number;
  webhookUrl: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

const querySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    required: true
  }],
  categories: [{
    type: String
  }],
  intervalMinutes: {
    type: Number,
    required: true,
    min: 30 // Minimum 30 minutes
  },
  webhookUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date
  },
  nextRun: {
    type: Date,
    required: true
  }
});

export default mongoose.model<IQuery>('Query', querySchema);