import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/api/events";
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

  return <EventDetailView event={event} />;
}
