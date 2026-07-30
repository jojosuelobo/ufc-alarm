import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/api/events";
import { CitoApiError } from "@/lib/api/citoClient";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    const message =
      error instanceof CitoApiError ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
