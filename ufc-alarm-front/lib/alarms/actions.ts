"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";

export interface ToggleAlarmInput {
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  boutId: string;
  weightClass?: string;
  fighterRedName: string;
  fighterBlueName: string;
}

export type ToggleAlarmResult =
  | { ok: true; active: boolean }
  | { ok: false; error: "unauthenticated" };

interface AlarmIdRow {
  id: number;
}

export async function toggleAlarmAction(input: ToggleAlarmInput): Promise<ToggleAlarmResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const existing = db
    .prepare(`SELECT id FROM alarms WHERE user_id = ? AND event_slug = ? AND bout_id = ?`)
    .get(user.id, input.eventSlug, input.boutId) as AlarmIdRow | undefined;

  if (existing) {
    db.prepare(`DELETE FROM alarms WHERE id = ?`).run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO alarms
        (user_id, event_slug, bout_id, event_title, event_starts_at, weight_class, fighter_red_name, fighter_blue_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      user.id,
      input.eventSlug,
      input.boutId,
      input.eventTitle,
      input.eventStartsAt,
      input.weightClass ?? null,
      input.fighterRedName,
      input.fighterBlueName,
    );
  }

  revalidatePath("/minha-conta");
  revalidatePath(`/eventos/${input.eventSlug}`);
  revalidatePath("/");

  return { ok: true, active: !existing };
}

export async function removeAlarmAction(alarmId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  db.prepare(`DELETE FROM alarms WHERE id = ? AND user_id = ?`).run(alarmId, user.id);
  revalidatePath("/minha-conta");
}
