"use client";

import { useEffect, useState } from "react";
import type { UpcomingEvent } from "@/types/domain";
import EventCountdown from "./EventCountdown";
import FightCard from "./FightCard";

interface EventDetailViewProps {
  event: UpcomingEvent;
  isLoggedIn: boolean;
  hasPhone: boolean;
  activeAlarmBoutIds: Set<string>;
}

interface LiveBoutStatus {
  boutId: string;
  status: string;
  winnerCorner: "red" | "blue" | null;
  round: number | null;
  time: string | null;
  method: string | null;
}

interface LiveStatusResponse {
  status: string | null;
  bouts: LiveBoutStatus[];
}

// Public per-event live status (GET /api/events/[slug]/live), polled
// independently of the alarm-specific /api/live-status AlarmWatcher uses —
// this drives the "Ao vivo" countdown/card badges for every visitor,
// logged in or not, not just people with an active alarm on this event.
const LIVE_STATUS_POLL_MS = 30_000;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-3xl uppercase tracking-tight sm:text-4xl">
      {children}
    </p>
  );
}

export default function EventDetailView({
  event,
  isLoggedIn,
  hasPhone,
  activeAlarmBoutIds,
}: EventDetailViewProps) {
  const eventStartsAt = event.date ? event.date.toISOString() : null;
  const bellProps = {
    eventSlug: event.slug,
    eventTitle: event.title,
    eventStartsAt,
    isLoggedIn,
    hasPhone,
    activeAlarmBoutIds,
  };

  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/events/${event.slug}/live`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json: LiveStatusResponse = await res.json();
        if (!cancelled) setLiveStatus(json);
      } catch {
        // Fail-soft — keep whatever status is already on screen and retry
        // next tick, same philosophy as AlarmWatcher's poll.
      }
    }
    poll();
    const intervalId = setInterval(poll, LIVE_STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [event.slug]);

  const liveBoutsById = new Map(
    (liveStatus?.bouts ?? []).map((bout) => [bout.boutId, bout] as const),
  );
  const isEventLive =
    liveStatus?.status === "live" ||
    [...liveBoutsById.values()].some((bout) => bout.status === "live");

  function liveDataFor(boutId: string) {
    const bout = liveBoutsById.get(boutId);
    return {
      isLive: bout?.status === "live",
      winnerCorner: bout?.winnerCorner ?? null,
      round: bout?.round ?? null,
      time: bout?.time ?? null,
      method: bout?.method ?? null,
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-10 sm:pt-14 lg:px-16">
      <p className="text-base font-semibold uppercase tracking-widest text-accent">
        {event.dateLabel ?? "Data a confirmar"}
      </p>
      <h1 className="mt-2 font-heading text-5xl uppercase leading-none tracking-tight sm:text-6xl lg:text-7xl">
        {event.title}
      </h1>
      {event.location && (
        <p className="mt-3 text-lg text-muted">{event.location}</p>
      )}

      <div className="mt-10">
        <EventCountdown targetDate={event.date} isLive={isEventLive} />
      </div>

      {event.mainEvent ? (
        <div className="mt-14 border-t border-border pt-10">
          <SectionLabel>Luta principal</SectionLabel>
          <div className="mt-6">
            <FightCard
              fight={event.mainEvent}
              highlight
              {...liveDataFor(event.mainEvent.boutId)}
              {...bellProps}
            />
          </div>
        </div>
      ) : (
        <p className="mt-10 text-center text-base text-muted">
          Card ainda não anunciado.
        </p>
      )}

      {event.mainCard.length > 0 && (
        <section className="mt-16">
          <SectionLabel>Card principal</SectionLabel>
          <div className="mt-2 divide-y divide-border">
            {event.mainCard.map((fight) => (
              <FightCard
                key={fight.boutId}
                fight={fight}
                {...liveDataFor(fight.boutId)}
                {...bellProps}
              />
            ))}
          </div>
        </section>
      )}

      {event.prelimCard.length > 0 && (
        <section className="mt-16">
          <SectionLabel>Preliminares</SectionLabel>
          <div className="mt-2 divide-y divide-border">
            {event.prelimCard.map((fight) => (
              <FightCard
                key={fight.boutId}
                fight={fight}
                {...liveDataFor(fight.boutId)}
                {...bellProps}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
