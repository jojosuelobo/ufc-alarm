import { getEventBySlug, getUpcomingEvents } from "@/lib/api/events";
import { groupEventsByPeriod } from "@/lib/dates";
import EventListItem from "@/components/EventListItem";

// Event data is always fetched fresh (ufc-alarm-middleware is the single
// cache layer, see lib/api/citoClient.ts) — ISR here would let the page
// serve a stale event list instantly instead of ever showing loading.tsx.
export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const events = await getUpcomingEvents();
  // The list endpoint doesn't include bout/fighter data, so fetch each
  // event's stats (cached in ufc-alarm-middleware) to show the main-event
  // fighter thumbnails in each row.
  const detailedEvents = await Promise.all(
    events.map(async (event) => (await getEventBySlug(event.slug)) ?? event),
  );
  const groups = groupEventsByPeriod(detailedEvents);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-10 sm:pt-14 lg:px-16">
      <h1 className="font-heading text-5xl uppercase tracking-tight sm:text-6xl lg:text-7xl">
        Eventos
      </h1>

      {groups.length === 0 && (
        <p className="mt-10 text-center text-base text-muted">
          Nenhum evento futuro encontrado no momento.
        </p>
      )}

      <div className="mt-12 flex flex-col gap-14">
        {groups.map((group) => (
          <section key={group.label}>
            <div className="mb-1 flex items-center justify-between border-b border-border pb-3">
              <p className="font-heading text-2xl uppercase tracking-wide">
                {group.label}
              </p>
              <p className="text-base text-muted">
                {group.events.length}{" "}
                {group.events.length === 1 ? "evento" : "eventos"}
              </p>
            </div>
            <div className="divide-y divide-border">
              {group.events.map((event) => (
                <EventListItem key={event.slug} event={event} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
