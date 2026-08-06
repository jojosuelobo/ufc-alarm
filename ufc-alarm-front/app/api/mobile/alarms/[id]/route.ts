import { NextResponse } from "next/server";
import { deleteDeviceAlarm } from "@/lib/mobile/queries";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const alarmId = Number(id);
  if (!Number.isInteger(alarmId)) {
    return NextResponse.json({ error: "id inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { deviceId?: unknown } | null;
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId é obrigatório." }, { status: 400 });
  }

  const deleted = deleteDeviceAlarm(alarmId, deviceId);
  if (!deleted) {
    return NextResponse.json({ error: "Alarme não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
