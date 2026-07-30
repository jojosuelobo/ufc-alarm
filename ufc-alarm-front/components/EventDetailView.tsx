import type { UpcomingEvent } from "@/types/domain";
import EventCountdown from "./EventCountdown";
import FightCard from "./FightCard";

interface EventDetailViewProps {
  event: UpcomingEvent;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-xl uppercase tracking-wide sm:text-2xl">
      {children}
    </p>
  );
}

export default function EventDetailView({ event }: EventDetailViewProps) {
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
        <EventCountdown targetDate={event.date} />
      </div>

      {event.mainEvent ? (
        <div className="mt-14 border-t border-border pt-10">
          <SectionLabel>Luta principal</SectionLabel>
          <div className="mt-6">
            <FightCard fight={event.mainEvent} highlight />
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
              <FightCard key={fight.boutId} fight={fight} />
            ))}
          </div>
        </section>
      )}

      {event.prelimCard.length > 0 && (
        <section className="mt-16">
          <SectionLabel>Preliminares</SectionLabel>
          <div className="mt-2 divide-y divide-border">
            {event.prelimCard.map((fight) => (
              <FightCard key={fight.boutId} fight={fight} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
