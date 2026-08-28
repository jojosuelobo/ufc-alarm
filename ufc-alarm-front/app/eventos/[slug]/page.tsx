import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveAlarmBoutIds } from "@/lib/alarms/queries";
import EventDetailView from "@/components/EventDetailView";

// Event data is always fetched fresh (ufc-alarm-middleware is the single
// cache layer, see lib/api/citoClient.ts) — ISR here would let the page
// serve a stale event instantly instead of ever showing loading.tsx.
export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

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
