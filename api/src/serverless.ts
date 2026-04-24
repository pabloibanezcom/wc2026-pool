import { app } from './app';
import { connectDB } from './config/db';

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
