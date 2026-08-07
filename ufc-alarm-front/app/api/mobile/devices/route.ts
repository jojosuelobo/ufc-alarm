import { NextResponse } from "next/server";
import { upsertDevice } from "@/lib/mobile/queries";

interface RegisterDeviceBody {
  deviceId?: unknown;
  fcmToken?: unknown;
  platform?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterDeviceBody | null;
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId é obrigatório." }, { status: 400 });
  }

  const fcmToken = typeof body?.fcmToken === "string" && body.fcmToken.trim() ? body.fcmToken : null;
  const platform = typeof body?.platform === "string" && body.platform.trim() ? body.platform : "android";

  upsertDevice(deviceId, fcmToken, platform);
  return NextResponse.json({ ok: true });
}
