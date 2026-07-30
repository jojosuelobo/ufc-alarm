import type { UpcomingEvent } from "@/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(date: Date, now: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

/** "Amanhã", "Em 8 dias", "Hoje" — or undefined if the date is unknown/past. */
export function relativeDayLabel(date: Date | null, now = new Date()): string | undefined {
  if (!date) return undefined;
  const diff = daysUntil(date, now);
  if (diff < 0) return undefined;
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return `Em ${diff} dias`;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface EventGroup {
  label: string;
  events: UpcomingEvent[];
}

/**
 * Groups already-sorted (soonest first) upcoming events into "Esta semana"
 * followed by month buckets, mirroring the reference app's calendar tab.
 * Events without a resolvable date fall into a trailing "Data a confirmar" group.
 */
export function groupEventsByPeriod(events: UpcomingEvent[], now = new Date()): EventGroup[] {
  const groups: EventGroup[] = [];
  const thisWeek: UpcomingEvent[] = [];
  const undated: UpcomingEvent[] = [];
  const byMonth = new Map<string, UpcomingEvent[]>();

  for (const event of events) {
    if (!event.date) {
      undated.push(event);
      continue;
    }
    const diff = daysUntil(event.date, now);
    if (diff >= 0 && diff <= 7) {
      thisWeek.push(event);
      continue;
    }
    const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(event);
  }

  if (thisWeek.length > 0) {
    groups.push({ label: "Esta semana", events: thisWeek });
  }

  for (const [key, monthEvents] of byMonth) {
    const monthIndex = Number(key.split("-")[1]);
    groups.push({ label: MONTHS_PT[monthIndex], events: monthEvents });
  }

  if (undated.length > 0) {
    groups.push({ label: "Data a confirmar", events: undated });
  }

  return groups;
}
