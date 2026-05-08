import { describe, expect, it } from 'vitest';
import { League, LEAGUE_MAX_MEMBERS } from '../src/models/League';

describe('League model', () => {
  it('defaults leagues to the maximum member limit', () => {
    const league = new League({
      name: 'Friends',
      inviteCode: 'ABC123',
      ownerId: '000000000000000000000001',
      members: [],
    });

    expect(league.maxMembers).toBe(LEAGUE_MAX_MEMBERS);
  });

  it('rejects league member limits above the maximum', async () => {
    const league = new League({
      name: 'Too Big',
      inviteCode: 'BIG999',
      ownerId: '000000000000000000000001',
      maxMembers: LEAGUE_MAX_MEMBERS + 1,
      members: [],
    });

    await expect(league.validate()).rejects.toThrow();
  });
});
