import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearDatabase, requestJson, startIntegrationServer, stopIntegrationServer } from './helpers/integration';
import { User } from '../src/models/User';

beforeAll(async () => {
  await startIntegrationServer();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await stopIntegrationServer();
});

describe('auth routes', () => {
  it('registers a password user, normalizes email, and returns the authenticated profile', async () => {
    const register = await requestJson<{ token: string; user: { id: string; email: string; name: string; isMaster: boolean } }>(
      '/auth/register',
      {
        body: {
          email: 'MASTER@WORLDPORRA.TEST',
          name: 'Master Player',
          password: 'correct-horse-battery',
        },
      }
    );

    expect(register.status).toBe(201);
    expect(register.body.user).toMatchObject({
      email: 'master@worldporra.test',
      name: 'Master Player',
      isMaster: true,
    });
    expect(register.body.token).toEqual(expect.any(String));

    const storedUser = await User.findOne({ email: 'master@worldporra.test' }).select('+passwordHash').lean();
    expect(storedUser?.passwordHash).toEqual(expect.any(String));
    expect(storedUser?.passwordHash).not.toContain('correct-horse-battery');

    const me = await requestJson<{ user: { id: string; email: string } }>('/auth/me', {
      token: register.body.token,
    });
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
      id: register.body.user.id,
      email: 'master@worldporra.test',
    });
  });

  it('rejects invalid registration payloads and duplicate password accounts', async () => {
    const invalid = await requestJson('/auth/register', {
      body: { email: 'not-an-email', name: '', password: 'short' },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toMatchObject({ error: 'Invalid registration data' });

    await requestJson('/auth/register', {
      body: { email: 'player@worldporra.test', name: 'Player', password: 'valid-password' },
    });
    const duplicate = await requestJson('/auth/register', {
      body: { email: 'PLAYER@WORLDPORRA.TEST', name: 'Other', password: 'valid-password' },
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ error: 'An account with this email already exists' });
  });

  it('logs in with a password and rejects bad credentials', async () => {
    await requestJson('/auth/register', {
      body: { email: 'player@worldporra.test', name: 'Player', password: 'valid-password' },
    });

    const badPassword = await requestJson('/auth/login', {
      body: { email: 'player@worldporra.test', password: 'wrong-password' },
    });
    expect(badPassword.status).toBe(401);
    expect(badPassword.body).toEqual({ error: 'Invalid email or password' });

    const login = await requestJson<{ token: string; user: { email: string; name: string } }>('/auth/login', {
      body: { email: 'PLAYER@WORLDPORRA.TEST', password: 'valid-password' },
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    expect(login.body.user).toMatchObject({ email: 'player@worldporra.test', name: 'Player' });
  });

  it('protects authenticated routes from missing and invalid tokens', async () => {
    const missing = await requestJson('/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body).toEqual({ error: 'Missing or invalid Authorization header' });

    const invalid = await requestJson('/auth/me', { token: 'not-a-real-token' });
    expect(invalid.status).toBe(401);
    expect(invalid.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('updates the authenticated user display name', async () => {
    const register = await requestJson<{ token: string; user: { id: string } }>('/auth/register', {
      body: {
        email: 'player@worldporra.test',
        name: 'Long Original Name',
        password: 'valid-password',
      },
    });

    const updated = await requestJson<{ user: { id: string; name: string } }>('/auth/me', {
      method: 'PATCH',
      token: register.body.token,
      body: { name: 'Pablo' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.user).toMatchObject({ id: register.body.user.id, name: 'Pablo' });

    const invalid = await requestJson('/auth/me', {
      method: 'PATCH',
      token: register.body.token,
      body: { name: '' },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toMatchObject({ error: 'Invalid profile data' });
  });
});
