import { getEventBySlug, getUpcomingEvents } from "@/lib/api/events";
import EventDetailView from "@/components/EventDetailView";

export const revalidate = 1800;

export default async function HomePage() {
  const events = await getUpcomingEvents();

  if (events.length === 0) {
    return (
      <p className="mx-auto max-w-3xl px-6 pt-24 text-center text-sm text-muted">
        Nenhum evento futuro encontrado no momento.
      </p>
    );
  }

  const nearest = await getEventBySlug(events[0].slug);

  return <EventDetailView event={nearest ?? events[0]} />;
}
