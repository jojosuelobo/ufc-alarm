import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLiveAlarmStatusForUser } from "@/lib/live/alarmLiveStatus";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const alarms = await getLiveAlarmStatusForUser(user.id);
  return NextResponse.json({ alarms });
}
