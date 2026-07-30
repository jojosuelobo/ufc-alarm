import Link from "next/link";
import type { UpcomingEvent } from "@/types/domain";
import { relativeDayLabel } from "@/lib/dates";
import FighterAvatar from "./FighterAvatar";

interface EventListItemProps {
  event: UpcomingEvent;
}

export default function EventListItem({ event }: EventListItemProps) {
  const relative = relativeDayLabel(event.date);
  const date = event.date;

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group flex items-center gap-5 py-8 transition hover:bg-surface sm:gap-8 sm:px-6"
    >
      <div className="flex w-20 shrink-0 flex-col items-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">
          {date?.toLocaleDateString("pt-BR", { weekday: "short" }) ?? "?"}
        </span>
        <span className="font-heading text-4xl leading-none">
          {date ? date.getDate() : "--"}
        </span>
        <span className="text-sm uppercase tracking-wider text-muted">
          {date ? date.toLocaleDateString("pt-BR", { month: "short" }) : ""}
        </span>
      </div>

      {event.mainEvent && (
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <FighterAvatar fighter={event.mainEvent.fighterRed} size="xs" />
          <span className="font-heading text-lg text-muted">X</span>
          <FighterAvatar fighter={event.mainEvent.fighterBlue} size="xs" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          {event.promotionLabel}
        </span>
        <p className="mt-0.5 truncate font-heading text-3xl uppercase tracking-tight group-hover:text-accent">
          {event.shortTitle}
        </p>
        {event.location && (
          <p className="mt-1 truncate text-base text-muted">{event.location}</p>
        )}
      </div>

      {relative && (
        <p className="shrink-0 text-base font-bold uppercase tracking-wide text-accent">
          {relative}
        </p>
      )}
    </Link>
  );
}
