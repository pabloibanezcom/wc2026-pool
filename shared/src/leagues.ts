import type { User } from './users';

export interface LeagueMember {
  userId: User;
  joinedAt: string;
  isAdmin?: boolean;
  totalPoints?: number;
}

export interface League {
  _id: string;
  name: string;
  inviteCode: string;
  ownerId: User;
  members: LeagueMember[];
  maxMembers: number;
}
