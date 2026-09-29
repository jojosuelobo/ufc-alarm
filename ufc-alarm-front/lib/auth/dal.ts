import "server-only";
import { cache } from "react";
import { getSessionPayload } from "./session";
import db from "@/lib/db";

export interface SafeUser {
  id: number;
  email: string;
  preferredName: string | null;
  phone: string | null;
  showExtraEvents: boolean;
  notifySite: boolean;
  notifyWhatsapp: boolean;
  notifyDiscord: boolean;
  notifyTelegram: boolean;
}

interface UserRow {
  id: number;
  email: string;
  preferred_name: string | null;
  phone: string | null;
  show_extra_events: number;
  notify_site: number;
  notify_whatsapp: number;
  notify_discord: number;
  notify_telegram: number;
}

export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await getSessionPayload();
  if (!session) return null;

  const row = db
    .prepare(
      `SELECT id, email, preferred_name, phone, show_extra_events,
              notify_site, notify_whatsapp, notify_discord, notify_telegram
       FROM users WHERE id = ?`,
    )
    .get(session.userId) as UserRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    preferredName: row.preferred_name,
    phone: row.phone,
    showExtraEvents: Boolean(row.show_extra_events),
    notifySite: Boolean(row.notify_site),
    notifyWhatsapp: Boolean(row.notify_whatsapp),
    notifyDiscord: Boolean(row.notify_discord),
    notifyTelegram: Boolean(row.notify_telegram),
  };
});
