import "server-only";
import { getCitoEventStats, getCitoEvents } from "./citoClient";
import type {
  CitoBout,
  CitoBoutFighter,
  CitoEventListResponse,
  CitoEventStatsResponse,
} from "@/types/cito";
import type { Fight, Fighter, UpcomingEvent } from "@/types/domain";
import { ALARM_LIVE_WINDOW_POST_HOURS } from "@/lib/shared/alarmWindow";

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
    // Cito has a third section, "Early Prelims", in addition to "Main Card"
    // and "Prelims" — treating anything-not-"Prelims" as "main" (the old
    // check) silently swept early-prelim bouts into the main card.
    cardSection: b.cardSection === "Main Card" ? "main" : "prelim",
    cardPosition: b.cardPosition,
    boutOrder: b.boutOrder,
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
 * Fetches upcoming (scheduled, dated) UFC events, sorted soonest-first. An
 * event that has gone live is included too (not just "scheduled") — Cito
 * flips an event's status to "live" once it starts, and excluding that
 * status here used to make the current, in-progress event disappear from
 * this list the moment it started, jumping the home page straight to the
 * *next* scheduled event instead of the one actually airing. A live event's
 * startsAt is already in the past, so it still sorts first (soonest) among
 * everything else in the list, ahead of future events, without any special
 * ordering logic.
 *
 * The Cito events list mixes past and future events plus stale placeholder
 * rows (title "Search results", startsAt null) and is NOT sorted by date.
 * `hasStats=true` filters to events that already have post-fight stats —
 * i.e. events that already happened — so it must not be used for "upcoming".
 *
 * Cito's "live" status is sticky: it doesn't reliably flip to anything else
 * once the card is actually over, so a finished event can sit at "live" for
 * days. Sorting soonest-first then puts that stale event ahead of every
 * genuinely upcoming one, since its startsAt is the oldest in the list —
 * the home page gets stuck showing an event that already ended. A "live"
 * event is only trusted within the same post-start grace window used for
 * alarm live-status checks (`ALARM_LIVE_WINDOW_POST_HOURS`); past that, it's
 * treated as over and dropped like any other non-scheduled event.
 */
export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const res = await getCitoEvents<CitoEventListResponse>({ limit: 50 });
  const now = Date.now();

  return res.data
    .filter((e) => {
      if (e.startsAt === null || e.title === "Search results") return false;
      if (e.status === "scheduled") return true;
      if (e.status === "live") {
        const hoursSinceStart = (now - new Date(e.startsAt).getTime()) / 3_600_000;
        return hoursSinceStart <= ALARM_LIVE_WINDOW_POST_HOURS;
      }
      return false;
    })
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
  // boutOrder is already a single globally-consistent numbering across every
  // section (Main Card 1001-1005, Prelims 2001-2004, Early Prelims
  // 3001-3003, in this event's case) — sorting on it directly gets the
  // whole card in broadcast order without needing to compare cardSection
  // and cardPosition separately (the previous cardPosition string compare
  // broke across sections, e.g. "Early Prelims 1" < "Main Card 1"
  // alphabetically, which misidentified the main event).
  const fights = res.data.bouts
    .map(mapBout)
    .filter((f): f is Fight => f !== null)
    .sort((a, b) => a.boutOrder - b.boutOrder);

  event.mainCard = fights.filter((f) => f.cardSection === "main");
  event.prelimCard = fights.filter((f) => f.cardSection === "prelim");
  event.mainEvent = event.mainCard.shift();

  return event;
}
