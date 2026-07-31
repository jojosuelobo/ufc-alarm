import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveAlarmBoutIds } from "@/lib/alarms/queries";
import EventDetailView from "@/components/EventDetailView";

export const revalidate = 1800;

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
