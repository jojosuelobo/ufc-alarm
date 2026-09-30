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
  discordWebhookUrl: string | null;
  discordMentionEveryone: boolean;
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
  discord_webhook_url: string | null;
  discord_mention_everyone: number;
}

export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await getSessionPayload();
  if (!session) return null;

  const row = db
    .prepare(
      `SELECT id, email, preferred_name, phone, show_extra_events,
              notify_site, notify_whatsapp, notify_discord, notify_telegram,
              discord_webhook_url, discord_mention_everyone
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
    discordWebhookUrl: row.discord_webhook_url,
    discordMentionEveryone: Boolean(row.discord_mention_everyone),
  };
});
