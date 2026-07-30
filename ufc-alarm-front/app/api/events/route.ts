import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/api/events";
import { CitoApiError } from "@/lib/api/citoClient";

export async function GET() {
  try {
    const events = await getUpcomingEvents();
    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof CitoApiError ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
