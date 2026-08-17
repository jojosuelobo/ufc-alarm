export interface CitoEventListResponse {
  success: boolean;
  data: unknown[];
}

export interface CitoEventStatsResponse {
  success: boolean;
  data: unknown;
}

export interface CitoLiveBoutTracking {
  entity_type: string;
  boutId: string;
  fightMetricId: string;
  status: string;
  currentRound?: number;
  currentTime?: string;
  method?: string | null;
  red?: { fighterName: string; fighterSlug: string; outcome?: string | null };
  blue?: { fighterName: string; fighterSlug: string; outcome?: string | null };
}

export interface CitoLiveEventData {
  eventSlug: string;
  status: string;
  recommendedPollSeconds?: number;
  tracking: CitoLiveBoutTracking[];
}

export interface CitoLiveEventResponse {
  success: boolean;
  data: CitoLiveEventData;
}
