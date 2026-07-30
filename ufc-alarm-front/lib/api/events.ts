import "server-only";
import { getCitoEventStats, getCitoEvents } from "./citoClient";
import type {
  CitoBout,
  CitoBoutFighter,
  CitoEventListResponse,
  CitoEventStatsResponse,
} from "@/types/cito";
import type { Fight, Fighter, UpcomingEvent } from "@/types/domain";

function promotionLabel(title: string): string {
  return /^UFC \d/.test(title) ? "UFC" : "UFC Fight Night";
}

function mapFighter(f: CitoBoutFighter): Fighter {
  return {
    name: f.fighterName,
    nickname: f.profile?.nickname ?? undefined,
    record: f.profile?.recordText ?? undefined,
    photoUrl: f.imageUrl ?? f.profile?.headshotUrl ?? undefined,
    country: f.country ?? undefined,
    flagEmoji: f.flag ?? undefined,
    corner: f.corner === "blue" ? "blue" : "red",
  };
}

function mapBout(b: CitoBout): Fight | null {
  const red = b.fighters.find((f) => f.corner === "red");
  const blue = b.fighters.find((f) => f.corner === "blue");
  if (!red || !blue) return null;

  const odds =
    b.odds?.red != null && b.odds?.blue != null
      ? { red: b.odds.red, blue: b.odds.blue }
      : undefined;

  return {
    boutId: b.id,
    weightClass: b.weightClass ?? undefined,
    titleBout: b.titleBout,
    cardSection: b.cardSection === "Prelims" ? "prelim" : "main",
    cardPosition: b.cardPosition,
    fighterRed: mapFighter(red),
    fighterBlue: mapFighter(blue),
    odds,
  };
}

function mapEventBase(e: {
  slug: string;
  title: string;
  shortTitle: string;
  startsAt: string | null;
  eventDateLabel: string | null;
  venue: string | null;
  locationText: string | null;
  imageUrl: string | null;
}): UpcomingEvent {
  return {
    slug: e.slug,
    title: e.title,
    shortTitle: e.shortTitle,
    promotionLabel: promotionLabel(e.title),
    date: e.startsAt ? new Date(e.startsAt) : null,
    dateLabel: e.eventDateLabel ?? undefined,
    venue: e.venue ?? undefined,
    location: e.locationText ?? undefined,
    posterUrl: e.imageUrl ?? undefined,
    mainCard: [],
    prelimCard: [],
  };
}

/**
 * Fetches upcoming (scheduled, dated) UFC events, sorted soonest-first.
 *
 * The Cito events list mixes past and future events plus stale placeholder
 * rows (title "Search results", startsAt null) and is NOT sorted by date.
 * `hasStats=true` filters to events that already have post-fight stats —
 * i.e. events that already happened — so it must not be used for "upcoming".
 */
export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const res = await getCitoEvents<CitoEventListResponse>({ limit: 50 });

  return res.data
    .filter(
      (e) =>
        e.status === "scheduled" &&
        e.startsAt !== null &&
        e.title !== "Search results",
    )
    .sort(
      (a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
    )
    .map((e) => mapEventBase(e));
}

export async function getEventBySlug(
  slug: string,
): Promise<UpcomingEvent | null> {
  let res: CitoEventStatsResponse;
  try {
    res = await getCitoEventStats<CitoEventStatsResponse>(slug);
  } catch {
    return null;
  }

  const event = mapEventBase(res.data.event);
  const fights = res.data.bouts
    .map(mapBout)
    .filter((f): f is Fight => f !== null)
    .sort((a, b) => {
      if (a.cardSection !== b.cardSection) {
        return a.cardSection === "main" ? -1 : 1;
      }
      return a.cardPosition.localeCompare(b.cardPosition, undefined, {
        numeric: true,
      });
    });

  event.mainCard = fights.filter((f) => f.cardSection === "main");
  event.prelimCard = fights.filter((f) => f.cardSection === "prelim");
  event.mainEvent = event.mainCard.shift();

  return event;
}
