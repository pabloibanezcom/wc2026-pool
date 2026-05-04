import { apiClient } from './client';

export interface PollConfig {
  groupPredictionsDeadline: string | null;
  tournamentPredictionsDeadline: string | null;
}

export async function fetchPollConfig(): Promise<PollConfig> {
  const { data } = await apiClient.get<{ config: PollConfig }>('/config/poll');
  return data.config;
}
