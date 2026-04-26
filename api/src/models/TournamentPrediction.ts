import mongoose, { Schema, Document, Types } from 'mongoose';

interface TeamPick {
  name: string;
  code: string;
}

interface PlayerPick {
  name: string;
  team: string;
  code: string;
  pos: string;
}

export interface ITournamentPrediction extends Document {
  userId: Types.ObjectId;
  champion?: TeamPick;
  runnerUp?: TeamPick;
  semi1?: TeamPick;
  semi2?: TeamPick;
  bestPlayer?: PlayerPick;
  topScorer?: PlayerPick;
  bestYoung?: PlayerPick;
  updatedAt: Date;
}

const teamPickSchema = new Schema<TeamPick>({ name: String, code: String }, { _id: false });
const playerPickSchema = new Schema<PlayerPick>(
  { name: String, team: String, code: String, pos: String },
  { _id: false }
);

const tournamentPredictionSchema = new Schema<ITournamentPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    champion: { type: teamPickSchema, default: undefined },
    runnerUp: { type: teamPickSchema, default: undefined },
    semi1: { type: teamPickSchema, default: undefined },
    semi2: { type: teamPickSchema, default: undefined },
    bestPlayer: { type: playerPickSchema, default: undefined },
    topScorer: { type: playerPickSchema, default: undefined },
    bestYoung: { type: playerPickSchema, default: undefined },
  },
  { timestamps: true }
);

export const TournamentPrediction = mongoose.model<ITournamentPrediction>(
  'TournamentPrediction',
  tournamentPredictionSchema
);
