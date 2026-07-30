/**
 * Raw shapes returned by the Cito API (https://api.citoapi.com), as observed from
 * real requests against /api/v1/ufc/events and /api/v1/ufc/events/{slug}/stats.
 * Only fields we actually saw in responses are typed; treat anything not
 * explicitly confirmed as optional.
 */

export interface CitoEventListItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  status: "scheduled" | "completed" | string;
  startsAt: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  locationText: string | null;
  imageUrl: string | null;
  eventDate: string | null;
  eventDateLabel: string | null;
  eventWeekday: string | null;
  hasStats: boolean;
  dataId: string;
}

export interface CitoEventListResponse {
  success: boolean;
  data: CitoEventListItem[];
}

export interface CitoFighterRecord {
  wins: number;
  losses: number;
  draws: number;
  noContest: number;
  text: string;
}

export interface CitoFighterProfile {
  slug: string;
  name: string;
  nickname: string | null;
  championStatus: string;
  division: string | null;
  recordText: string;
  record: CitoFighterRecord;
  country: string | null;
  flag: string | null;
  headshotUrl: string | null;
  imageUrl: string | null;
  status: string;
  isActive: boolean;
}

export interface CitoBoutFighter {
  id: string;
  boutId: string;
  fighterSlug: string;
  fighterName: string;
  corner: "red" | "blue" | string;
  outcome: string | null;
  rankText: string | null;
  country: string | null;
  odds: number | null;
  imageUrl: string | null;
  flag: string | null;
  championStatus: string;
  profile: CitoFighterProfile;
}

export interface CitoBoutOdds {
  red: number | null;
  blue: number | null;
}

export interface CitoBout {
  id: string;
  eventSlug: string;
  cardSection: "Main Card" | "Prelims" | string;
  cardSectionOrder: number;
  cardPosition: string;
  boutOrder: number;
  weightClass: string | null;
  titleBout: boolean;
  status: string;
  isCancelled: boolean;
  odds: CitoBoutOdds;
  fighters: CitoBoutFighter[];
}

export interface CitoEventDetail {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  status: string;
  startsAt: string | null;
  venue: string | null;
  city: string | null;
  locationText: string | null;
  imageUrl: string | null;
  eventDate: string | null;
  eventDateLabel: string | null;
  eventWeekday: string | null;
}

export interface CitoEventStatsResponse {
  success: boolean;
  data: {
    event: CitoEventDetail;
    bouts: CitoBout[];
  };
}
