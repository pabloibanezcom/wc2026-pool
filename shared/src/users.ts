export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatarUrl: string;
  totalPoints: number;
  isMaster?: boolean;
  canCreateLeagues?: boolean;
}
