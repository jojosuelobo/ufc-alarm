import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/api/events";
import { CitoApiError } from "@/lib/api/citoClient";

// Consumed by the mobile app (EventsApi.getUpcomingEvents, no user account
// to read a preference from) as well as the browser fetch()es on the web
// app — includeExtraEvents defaults to false either way, mirroring the
// "Exibir eventos extras?" account preference's own default.
export async function GET(request: NextRequest) {
  try {
    const includeExtraEvents = request.nextUrl.searchParams.get("includeExtraEvents") === "true";
    const events = await getUpcomingEvents({ includeExtraEvents });
    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof CitoApiError ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
