import { NextResponse } from "next/server";
import { getActiveDeviceAlarms, toggleDeviceAlarm } from "@/lib/mobile/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim();
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId é obrigatório." }, { status: 400 });
  }

  const alarms = getActiveDeviceAlarms(deviceId);
  return NextResponse.json({ alarms });
}

interface ToggleAlarmBody {
  deviceId?: unknown;
  eventSlug?: unknown;
  eventTitle?: unknown;
  eventStartsAt?: unknown;
  boutId?: unknown;
  weightClass?: unknown;
  fighterRedName?: unknown;
  fighterBlueName?: unknown;
}

function requireString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ToggleAlarmBody | null;

  const deviceId = requireString(body?.deviceId);
  const eventSlug = requireString(body?.eventSlug);
  const eventTitle = requireString(body?.eventTitle);
  const boutId = requireString(body?.boutId);
  const fighterRedName = requireString(body?.fighterRedName);
  const fighterBlueName = requireString(body?.fighterBlueName);

  if (!deviceId || !eventSlug || !eventTitle || !boutId || !fighterRedName || !fighterBlueName) {
    return NextResponse.json(
      {
        error:
          "deviceId, eventSlug, eventTitle, boutId, fighterRedName e fighterBlueName são obrigatórios.",
      },
      { status: 400 },
    );
  }

  const eventStartsAt = requireString(body?.eventStartsAt);
  const weightClass = requireString(body?.weightClass) ?? undefined;

  const result = toggleDeviceAlarm({
    deviceId,
    eventSlug,
    eventTitle,
    eventStartsAt,
    boutId,
    weightClass,
    fighterRedName,
    fighterBlueName,
  });

  return NextResponse.json({ ok: true, active: result.active });
}
