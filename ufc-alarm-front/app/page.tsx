import { getEventBySlug, getUpcomingEvents } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveAlarmBoutIds } from "@/lib/alarms/queries";
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

  const event = (await getEventBySlug(events[0].slug)) ?? events[0];
  const user = await getCurrentUser();
  const activeAlarmBoutIds = user ? getActiveAlarmBoutIds(user.id, event.slug) : new Set<string>();

  return (
    <EventDetailView
      event={event}
      isLoggedIn={!!user}
      hasPhone={!!user?.phone}
      activeAlarmBoutIds={activeAlarmBoutIds}
    />
  );
}
