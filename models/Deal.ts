import mongoose, { Document, Schema } from 'mongoose';
import { DealType } from '@/types';

export interface DealDocument extends Document, DealType {}

const dealSchema: Schema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  created: { type: Date, required: true },
  last_replied: { type: Date, required: true },
  comments: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  category: { type: String }
});

const DealModel = mongoose.model<DealDocument>('Deal', dealSchema);

export { DealModel };
export default DealModel;