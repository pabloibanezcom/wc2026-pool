import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITeamInfo } from './Match';

export interface IGroupPrediction extends Document {
  userId: Types.ObjectId;
  group: string;
  orderedTeams: ITeamInfo[];
  points: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const groupPredictionTeamSchema = new Schema<ITeamInfo>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    crest: { type: String, default: '' },
  },
  { _id: false }
);

const groupPredictionSchema = new Schema<IGroupPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: String, required: true },
    orderedTeams: {
      type: [groupPredictionTeamSchema],
      required: true,
      validate: {
        validator: (teams: ITeamInfo[]) => teams.length >= 2,
        message: 'At least two teams are required',
      },
    },
    points: { type: Number, default: null },
  },
  { timestamps: true }
);

groupPredictionSchema.index({ userId: 1, group: 1 }, { unique: true });

export const GroupPrediction = mongoose.model<IGroupPrediction>('GroupPrediction', groupPredictionSchema);
