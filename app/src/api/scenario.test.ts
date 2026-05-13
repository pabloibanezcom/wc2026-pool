import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadScenario({
  platform = 'web',
  href,
  storedScenario,
  buildScenario,
}: {
  platform?: string;
  href?: string;
  storedScenario?: string | null;
  buildScenario?: string;
} = {}) {
  vi.resetModules();

  if (buildScenario === undefined) {
    delete process.env.EXPO_PUBLIC_API_SCENARIO;
  } else {
    process.env.EXPO_PUBLIC_API_SCENARIO = buildScenario;
  }

  if (href === undefined) {
    vi.stubGlobal('window', undefined);
  } else {
    vi.stubGlobal('window', { location: { href } });
  }

  vi.doMock('react-native', () => ({
    Platform: { OS: platform },
  }));
  vi.doMock('../store/tokenStorage', () => ({
    getToken: vi.fn().mockResolvedValue(storedScenario ?? null),
    setToken: vi.fn().mockResolvedValue(undefined),
  }));

  return import('./scenario');
}

describe('scenario helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock('react-native');
    vi.doUnmock('../store/tokenStorage');
    delete process.env.EXPO_PUBLIC_API_SCENARIO;
  });

  it('does not expose the plain base test database as a selectable scenario', async () => {
    const { API_SCENARIOS } = await loadScenario();

    expect(API_SCENARIOS.map((scenario) => scenario.slug)).not.toContain('');
    expect(API_SCENARIOS.map((scenario) => scenario.slug)).not.toContain('base');
  });

  it('defaults to pre-tournament when no scenario is configured', async () => {
    const { getActiveApiScenario } = await loadScenario();

    await expect(getActiveApiScenario()).resolves.toBe('pre-tournament');
  });

  it('treats old empty/base stored values as the default scenario', async () => {
    const empty = await loadScenario({ platform: 'ios', storedScenario: '' });
    await expect(empty.getActiveApiScenario()).resolves.toBe('pre-tournament');

    const base = await loadScenario({ platform: 'ios', storedScenario: 'base' });
    await expect(base.getActiveApiScenario()).resolves.toBe('pre-tournament');
  });

  it('prefers explicit URL scenarios over stored scenarios', async () => {
    const { getActiveApiScenario } = await loadScenario({
      href: 'https://app.worldporra.com/?scenario=group-mid',
      storedScenario: 'pre-tournament',
    });

    await expect(getActiveApiScenario()).resolves.toBe('group-mid');
  });
});
