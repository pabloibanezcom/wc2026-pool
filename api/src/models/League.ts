import mongoose, { Schema, Document, Types } from 'mongoose';

export const LEAGUE_MAX_MEMBERS = 50;

export interface ILeagueMember {
  userId: Types.ObjectId;
  joinedAt: Date;
  isAdmin: boolean;
}

export interface ILeague extends Document {
  name: string;
  inviteCode: string;
  ownerId: Types.ObjectId;
  members: ILeagueMember[];
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const leagueMemberSchema = new Schema<ILeagueMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
  },
  { _id: false }
);

const leagueSchema = new Schema<ILeague>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    inviteCode: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [leagueMemberSchema],
    maxMembers: { type: Number, default: LEAGUE_MAX_MEMBERS, min: 1, max: LEAGUE_MAX_MEMBERS },
  },
  { timestamps: true }
);

leagueSchema.index({ 'members.userId': 1 });

export const League = mongoose.model<ILeague>('League', leagueSchema);
