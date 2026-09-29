"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AlarmLiveStatus } from "@/lib/live/alarmLiveStatus";
import { unlockAudio } from "@/lib/audio";
import AlarmRingingOverlay from "./AlarmRingingOverlay";

const POLL_INTERVAL_MS = 5000;

interface LiveStatusResponse {
  alarms: AlarmLiveStatus[];
}

export default function AlarmWatcher({
  userId,
  enabled,
}: {
  userId: number | null;
  enabled: boolean;
}) {
  const [queue, setQueue] = useState<AlarmLiveStatus[]>([]);
  const alertedRef = useRef<Set<number>>(new Set());
  const isFetchingRef = useRef(false);

  const poll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch("/api/live-status", { cache: "no-store" });
      if (!res.ok) return;
      const { alarms }: LiveStatusResponse = await res.json();

      const newlyLive = alarms.filter(
        (alarm) => alarm.isLive && !alertedRef.current.has(alarm.alarmId),
      );
      if (newlyLive.length === 0) return;

      for (const alarm of newlyLive) {
        alertedRef.current.add(alarm.alarmId);
      }
      setQueue((prev) => [...prev, ...newlyLive]);
    } catch {
      // Network hiccup — just try again next tick.
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [userId, enabled, poll]);

  // Broad safety net so the AudioContext is unlocked even in sessions where
  // the user never clicked a notification bell this visit (e.g. the alarm
  // was armed in an earlier session and they just reopened the tab).
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  if (queue.length === 0) return null;

  return (
    <AlarmRingingOverlay
      alert={queue[0]}
      onStop={() => setQueue((prev) => prev.slice(1))}
    />
  );
}
