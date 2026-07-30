"use client";

import { useEffect, useState } from "react";

interface EventCountdownProps {
  targetDate: Date | null;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(targetDate: Date): Remaining {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function EventCountdown({ targetDate }: EventCountdownProps) {
  // Starts null on both server and client render so the first paint always
  // matches (avoids a hydration mismatch from computing Date.now() at
  // render time). The real value is filled in client-side after mount.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setRemaining(null);
      return;
    }
    setRemaining(computeRemaining(targetDate));
    const id = setInterval(() => {
      setRemaining(computeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <p className="font-heading text-lg uppercase tracking-wide text-muted">
        Data a confirmar
      </p>
    );
  }

  const units: [string, number][] = [
    ["dias", remaining?.days ?? 0],
    ["hrs", remaining?.hours ?? 0],
    ["min", remaining?.minutes ?? 0],
    ["seg", remaining?.seconds ?? 0],
  ];

  return (
    <div className="flex items-start gap-3 sm:gap-5">
      {units.map(([label, value], i) => (
        <div key={label} className="flex items-start gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <span className="font-heading text-6xl tabular-nums leading-none sm:text-7xl">
              {pad(value)}
            </span>
            <span className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="font-heading text-6xl leading-none text-accent sm:text-7xl">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
