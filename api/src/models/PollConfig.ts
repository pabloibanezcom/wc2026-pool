import mongoose, { Schema, Document } from 'mongoose';

export interface IPollConfig extends Document {
  key: 'global';
  groupPredictionsDeadline: Date | null;
  tournamentPredictionsDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const pollConfigSchema = new Schema<IPollConfig>(
  {
    key: { type: String, enum: ['global'], required: true, unique: true, default: 'global' },
    groupPredictionsDeadline: { type: Date, default: null },
    tournamentPredictionsDeadline: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PollConfig = mongoose.model<IPollConfig>('PollConfig', pollConfigSchema);
