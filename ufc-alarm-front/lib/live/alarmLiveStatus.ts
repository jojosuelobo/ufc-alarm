import "server-only";
import { getActiveAlarmsForUser, type AlarmListItem } from "@/lib/alarms/queries";
import { ALARM_LIVE_WINDOW_POST_HOURS, ALARM_LIVE_WINDOW_PRE_MINUTES } from "@/lib/alarms/constants";
import { getLiveEventStatus, type CitoLiveEventData } from "./citoLiveClient";

export interface AlarmLiveStatus {
  alarmId: number;
  eventSlug: string;
  eventTitle: string;
  boutId: string;
  fighterRedName: string;
  fighterBlueName: string;
  weightClass: string | null;
  isLive: boolean;
}

function isWithinLiveWindow(eventStartsAt: string | null, now: Date): boolean {
  if (!eventStartsAt) return false;
  const starts = new Date(eventStartsAt).getTime();
  const windowStart = starts - ALARM_LIVE_WINDOW_PRE_MINUTES * 60_000;
  const windowEnd = starts + ALARM_LIVE_WINDOW_POST_HOURS * 3_600_000;
  const nowMs = now.getTime();
  return nowMs >= windowStart && nowMs <= windowEnd;
}

function toAlarmLiveStatus(
  alarm: AlarmListItem,
  eventData: CitoLiveEventData | null | undefined,
): AlarmLiveStatus {
  const bout = eventData?.tracking.find((t) => t.fightMetricId === alarm.boutId);
  return {
    alarmId: alarm.id,
    eventSlug: alarm.eventSlug,
    eventTitle: alarm.eventTitle,
    boutId: alarm.boutId,
    fighterRedName: alarm.fighterRedName,
    fighterBlueName: alarm.fighterBlueName,
    weightClass: alarm.weightClass,
    isLive: bout?.status === "live",
  };
}

/**
 * For one user, returns live status for every currently active alarm. Only
 * alarms whose event falls within the live-check window trigger a (cached,
 * cross-user) Cito call — one call per distinct event slug per cache TTL
 * window, regardless of how many alarms/users/tabs are checking it. Alarms
 * outside the window (including those with no known event date) report
 * isLive: false at zero Cito cost. Never throws.
 */
export async function getLiveAlarmStatusForUser(userId: number): Promise<AlarmLiveStatus[]> {
  const alarms = getActiveAlarmsForUser(userId);
  const now = new Date();

  // Dev-only testing aid: Cito can never report a past event as "live"
  // again, so there's no way to exercise the real detect → ring → stop loop
  // without an actual live card. Force specific alarm ids to report
  // isLive: true instead, skipping their Cito lookup entirely. Hard-gated
  // behind NODE_ENV and an unset-by-default env var — never fires in
  // production, and does nothing unless explicitly configured.
  const forcedIds =
    process.env.NODE_ENV !== "production" && process.env.DEV_FORCE_LIVE_ALARM_IDS
      ? new Set(
          process.env.DEV_FORCE_LIVE_ALARM_IDS.split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => !Number.isNaN(id)),
        )
      : null;

  const alarmsNeedingRealCheck = forcedIds
    ? alarms.filter((alarm) => !forcedIds.has(alarm.id))
    : alarms;

  const eligibleSlugs = new Set(
    alarmsNeedingRealCheck
      .filter((alarm) => isWithinLiveWindow(alarm.eventStartsAt, now))
      .map((alarm) => alarm.eventSlug),
  );

  const eventDataBySlug = new Map<string, CitoLiveEventData | null>();
  await Promise.all(
    [...eligibleSlugs].map(async (slug) => {
      eventDataBySlug.set(slug, await getLiveEventStatus(slug));
    }),
  );

  return alarms.map((alarm) => {
    if (forcedIds?.has(alarm.id)) {
      return { ...toAlarmLiveStatus(alarm, null), isLive: true };
    }
    if (!eligibleSlugs.has(alarm.eventSlug)) {
      return toAlarmLiveStatus(alarm, null);
    }
    return toAlarmLiveStatus(alarm, eventDataBySlug.get(alarm.eventSlug));
  });
}
