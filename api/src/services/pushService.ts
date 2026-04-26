import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription';
import { env } from '../config/env';
import { logger } from '../config/logger';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendOne(
  sub: { _id: unknown; endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.deleteOne({ _id: sub._id });
      logger.debug({ endpoint: sub.endpoint }, 'Removed stale push subscription');
    } else {
      logger.error({ err }, 'Push send failed');
    }
    return false;
  }
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const subs = await PushSubscription.find({ userId });
  await Promise.allSettled(subs.map((sub) => sendOne(sub, payload)));
}

export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const subs = await PushSubscription.find({ userId: { $in: userIds } });
  await Promise.allSettled(subs.map((sub) => sendOne(sub, payload)));
}

export async function sendToAll(payload: PushPayload): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const subs = await PushSubscription.find({});
  await Promise.allSettled(subs.map((sub) => sendOne(sub, payload)));
}
