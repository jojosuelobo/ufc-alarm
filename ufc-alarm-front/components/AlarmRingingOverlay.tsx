"use client";

import { useEffect, useRef } from "react";
import type { AlarmLiveStatus } from "@/lib/live/alarmLiveStatus";
import { playAlarmLoop, type AlarmLoopHandle } from "@/lib/audio";
import { formatWeightClass } from "@/lib/format";

interface AlarmRingingOverlayProps {
  alert: AlarmLiveStatus;
  onStop: () => void;
}

export default function AlarmRingingOverlay({ alert, onStop }: AlarmRingingOverlayProps) {
  const handleRef = useRef<AlarmLoopHandle | null>(null);

  useEffect(() => {
    const handle = playAlarmLoop();
    handleRef.current = handle;
    return () => handle.stop();
  }, []);

  function handleStop() {
    handleRef.current?.stop();
    onStop();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-accent px-6 text-white">
      <div className="flex max-w-md flex-col items-center text-center">
        <p className="animate-pulse text-sm font-bold uppercase tracking-widest">
          A luta começou
        </p>
        <h2 className="mt-3 font-heading text-4xl uppercase leading-none tracking-tight sm:text-5xl">
          {alert.fighterRedName}
          <br />
          vs
          <br />
          {alert.fighterBlueName}
        </h2>
        {formatWeightClass(alert.weightClass ?? undefined) && (
          <p className="mt-3 text-base uppercase tracking-wide text-white/80">
            {formatWeightClass(alert.weightClass ?? undefined)}
          </p>
        )}
        <p className="mt-1 text-sm text-white/70">{alert.eventTitle}</p>

        <button
          type="button"
          onClick={handleStop}
          className="mt-10 w-full rounded-md bg-white py-4 font-heading text-2xl uppercase tracking-wide text-accent"
        >
          Parar
        </button>
      </div>
    </div>
  );
}
