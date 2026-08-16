import { NextResponse } from "next/server";
import { getLiveEventStatus } from "@/lib/live/citoLiveClient";

/**
 * Public (no auth) per-event live status, for the anonymous mobile app —
 * unlike /api/live-status, which is scoped to one signed-in web user's
 * alarms. Bout ids here are `fightMetricId` (matches Fight.boutId), same
 * convention as lib/live/alarmLiveStatus.ts. Backed by citoLiveClient's own
 * TTL cache, so polling this from multiple devices costs one Cito call per
 * event per cache window, not one per request.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getLiveEventStatus(slug);
  return NextResponse.json({
    status: data?.status ?? null,
    bouts: (data?.tracking ?? []).map((t) => ({
      boutId: t.fightMetricId,
      status: t.status,
      // Corner, not name: Cito's live-tracking fighter names (e.g. "Joel
      // Alvarez") aren't guaranteed to match the accented spelling from the
      // event/stats endpoint ("Joel Álvarez") that Fight.fighterRed/Blue
      // come from, so the client resolves the display name itself from its
      // own Fight data, keyed on which corner won.
      winnerCorner:
        t.red?.outcome === "win" ? "red" : t.blue?.outcome === "win" ? "blue" : null,
    })),
  });
}
