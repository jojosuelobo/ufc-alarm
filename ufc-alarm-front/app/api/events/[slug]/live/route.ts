import { NextResponse } from "next/server";
import { findLiveTrackingByFighterNames, getLiveEventStatus } from "@/lib/live/citoLiveClient";
import { getEventBySlug } from "@/lib/api/events";
import { translateMethod } from "@/lib/format";

/**
 * Public (no auth) per-event live status, for the anonymous mobile app —
 * unlike /api/live-status, which is scoped to one signed-in web user's
 * alarms. `boutId` in the response is the hex id from GET
 * /api/cito/events/:slug/stats (matches Fight.boutId, what the client keys
 * its lookup on) — NOT Cito's live-tracking fightMetricId, which is a
 * different id scheme the stats endpoint never exposes. Getting there
 * means also fetching the event's stats (cached, same as any other event
 * page) to join each tracked bout back to its Fight by fighter name, the
 * only field both endpoints share. Backed by citoLiveClient's/citoClient's
 * own TTL caches, so polling this from multiple devices costs at most one
 * Cito call per event per cache window, not one per request.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [data, event] = await Promise.all([getLiveEventStatus(slug), getEventBySlug(slug)]);

  const fights = event
    ? [...(event.mainEvent ? [event.mainEvent] : []), ...event.mainCard, ...event.prelimCard]
    : [];

  const bouts = fights.flatMap((fight) => {
    const t = findLiveTrackingByFighterNames(
      data?.tracking,
      fight.fighterRed.name,
      fight.fighterBlue.name,
    );
    if (!t) return [];
    return [
      {
        boutId: fight.boutId,
        status: t.status,
        // Corner, not name: Cito's live-tracking fighter names (e.g. "Joel
        // Alvarez") aren't guaranteed to match the accented spelling from
        // the event/stats endpoint ("Joel Álvarez") that
        // Fight.fighterRed/Blue come from, so the client resolves the
        // display name itself from its own Fight data, keyed on which
        // corner won.
        winnerCorner:
          t.red?.outcome === "win" ? "red" : t.blue?.outcome === "win" ? "blue" : null,
        round: t.currentRound ?? null,
        time: t.currentTime ?? null,
        method: translateMethod(t.method),
      },
    ];
  });

  return NextResponse.json({ status: data?.status ?? null, bouts });
}
