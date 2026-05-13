import { Platform } from 'react-native';
import { getToken, setToken } from '../store/tokenStorage';

export type ApiScenarioSlug =
  | 'pre-tournament'
  | 'eve'
  | 'group-mid'
  | 'group-late'
  | 'knockout-r32'
  | 'knockout-r16'
  | 'final-eve'
  | 'complete';

export const API_SCENARIO_STORAGE_KEY = 'world-porra.apiScenario';
export const DEFAULT_API_SCENARIO: ApiScenarioSlug = 'pre-tournament';

export const API_SCENARIOS: Array<{ slug: ApiScenarioSlug; label: string }> = [
  { slug: 'pre-tournament', label: 'Pre-tournament' },
  { slug: 'eve', label: 'One day before kickoff' },
  { slug: 'group-mid', label: 'Middle of group stage' },
  { slug: 'group-late', label: 'Late group stage' },
  { slug: 'knockout-r32', label: 'Round of 32 underway' },
  { slug: 'knockout-r16', label: 'Round of 16 underway' },
  { slug: 'final-eve', label: 'Just before the final' },
  { slug: 'complete', label: 'Tournament complete' },
];

function normalizeScenario(value: string | null | undefined): ApiScenarioSlug | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === 'base' || normalized === 'default') return null;
  return API_SCENARIOS.some((scenario) => scenario.slug === normalized) ? (normalized as ApiScenarioSlug) : null;
}

function getUrlScenario(): ApiScenarioSlug | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  try {
    return normalizeScenario(new URL(window.location.href).searchParams.get('scenario'));
  } catch {
    return null;
  }
}

export function getBuildApiScenario(): ApiScenarioSlug | null {
  return normalizeScenario(process.env.EXPO_PUBLIC_API_SCENARIO);
}

export async function getActiveApiScenario(): Promise<ApiScenarioSlug> {
  const urlScenario = getUrlScenario();
  if (urlScenario !== null) return urlScenario;

  const storedScenario = normalizeScenario(await getToken(API_SCENARIO_STORAGE_KEY));
  if (storedScenario !== null) return storedScenario;

  return getBuildApiScenario() ?? DEFAULT_API_SCENARIO;
}

export async function setActiveApiScenario(scenario: ApiScenarioSlug): Promise<void> {
  await setToken(API_SCENARIO_STORAGE_KEY, scenario);
}

export function getScenarioLabel(slug: ApiScenarioSlug): string {
  return API_SCENARIOS.find((scenario) => scenario.slug === slug)?.label ?? slug;
}
