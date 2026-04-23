import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  FOOTBALL_DATA_API_KEY: z.string().default(''),
  SYNC_API_KEY: z.string().default(''),
});

export const env = envSchema.parse(process.env);
