import { getEventBySlug, getUpcomingEvents } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveAlarmBoutIds } from "@/lib/alarms/queries";
import EventDetailView from "@/components/EventDetailView";

// Event data is always fetched fresh (ufc-alarm-middleware is the single
// cache layer, see lib/api/citoClient.ts) — ISR here would let the page
// serve a stale event instantly instead of ever showing app/loading.tsx.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const events = await getUpcomingEvents({ includeExtraEvents: user?.showExtraEvents });

  if (events.length === 0) {
    return (
      <p className="mx-auto max-w-3xl px-6 pt-24 text-center text-sm text-muted">
        Nenhum evento futuro encontrado no momento.
      </p>
    );
  }

  const event = (await getEventBySlug(events[0].slug)) ?? events[0];
  const activeAlarmBoutIds = user ? getActiveAlarmBoutIds(user.id, event.slug) : new Set<string>();

  return (
    <EventDetailView
      event={event}
      isLoggedIn={!!user}
      activeAlarmBoutIds={activeAlarmBoutIds}
    />
  );
}
