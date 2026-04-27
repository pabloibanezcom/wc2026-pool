import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDatabase, requestJson, startIntegrationServer, stopIntegrationServer } from './helpers/integration';
import { User } from '../src/models/User';

const googleMocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({
    verifyIdToken: googleMocks.verifyIdToken,
  })),
}));

beforeAll(async () => {
  await startIntegrationServer();
});

beforeEach(async () => {
  await clearDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await stopIntegrationServer();
});

describe('misc app and auth routes', () => {
  it('reports a healthy database connection', async () => {
    const response = await requestJson<{ status: string; db: string; timestamp: string }>('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', db: 'connected' });
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('supports dev login outside production', async () => {
    const response = await requestJson<{ token: string; user: { email: string; name: string } }>('/auth/dev', {
      body: {},
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'dev@wc2026.test',
      name: 'Dev Player',
    });
  });

  it('creates a user from a valid Google token payload', async () => {
    googleMocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-user-001',
        email: 'GOOGLE@WC2026.TEST',
        name: 'Google Player',
        picture: 'https://example.test/avatar.png',
      }),
    });

    const response = await requestJson<{ token: string; user: { email: string; name: string; avatarUrl: string } }>(
      '/auth/google',
      { body: { idToken: 'valid-google-token' } }
    );

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'google@wc2026.test',
      name: 'Google Player',
      avatarUrl: 'https://example.test/avatar.png',
    });

    const stored = await User.findOne({ email: 'google@wc2026.test' }).lean();
    expect(stored?.googleId).toBe('google-user-001');
    expect(stored?.avatarUrl).toBe('https://example.test/avatar.png');
  });

  it('links a Google login to an existing email account and rejects failed Google auth', async () => {
    await requestJson('/auth/register', {
      body: { email: 'player@wc2026.test', name: 'Password Player', password: 'valid-password' },
    });

    googleMocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-user-002',
        email: 'player@wc2026.test',
        name: 'Linked Player',
        picture: '',
      }),
    });

    const linked = await requestJson<{ user: { email: string; name: string } }>('/auth/google', {
      body: { idToken: 'valid-google-token' },
    });
    expect(linked.status).toBe(200);
    expect(linked.body.user).toMatchObject({ email: 'player@wc2026.test', name: 'Password Player' });

    googleMocks.verifyIdToken.mockRejectedValueOnce(new Error('invalid token'));
    const failed = await requestJson('/auth/google', {
      body: { idToken: 'bad-google-token' },
    });
    expect(failed.status).toBe(401);
    expect(failed.body).toEqual({ error: 'Authentication failed' });
  });

  it('does not overwrite a custom display name on later Google login', async () => {
    googleMocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-user-003',
        email: 'google-name@wc2026.test',
        name: 'Very Long Google Account Name',
        picture: '',
      }),
    });
    const firstLogin = await requestJson<{ token: string; user: { name: string } }>('/auth/google', {
      body: { idToken: 'first-token' },
    });
    expect(firstLogin.body.user.name).toBe('Very Long Google Account Name');

    const update = await requestJson<{ user: { name: string } }>('/auth/me', {
      method: 'PATCH',
      token: firstLogin.body.token,
      body: { name: 'Pablo' },
    });
    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe('Pablo');

    googleMocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-user-003',
        email: 'google-name@wc2026.test',
        name: 'Very Long Google Account Name',
        picture: '',
      }),
    });
    const secondLogin = await requestJson<{ user: { name: string } }>('/auth/google', {
      body: { idToken: 'second-token' },
    });

    expect(secondLogin.status).toBe(200);
    expect(secondLogin.body.user.name).toBe('Pablo');
  });
});
