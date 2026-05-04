import { apiClient } from './client';

export interface PollConfig {
  groupPredictionsDeadline: string | null;
  tournamentPredictionsDeadline: string | null;
  groupPredictionsLocked: boolean;
  tournamentPredictionsLocked: boolean;
}

export async function fetchPollConfig(): Promise<PollConfig> {
  const { data } = await apiClient.get<{ config: PollConfig }>('/config/poll');
  return data.config;
}
