import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

function getSyncToken(req: Request): string | null {
  const headerToken = req.header('x-sync-api-key');
  if (headerToken) return headerToken;

  const authHeader = req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

export function syncAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!env.SYNC_API_KEY) {
    res.status(503).json({ error: 'SYNC_API_KEY is not configured on the server' });
    return;
  }

  const token = getSyncToken(req);
  if (!token || token !== env.SYNC_API_KEY) {
    res.status(401).json({ error: 'Missing or invalid sync API key' });
    return;
  }

  next();
}
