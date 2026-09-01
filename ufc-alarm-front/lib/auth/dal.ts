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
}

interface UserRow {
  id: number;
  email: string;
  preferred_name: string | null;
  phone: string | null;
  show_extra_events: number;
}

export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await getSessionPayload();
  if (!session) return null;

  const row = db
    .prepare(`SELECT id, email, preferred_name, phone, show_extra_events FROM users WHERE id = ?`)
    .get(session.userId) as UserRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    preferredName: row.preferred_name,
    phone: row.phone,
    showExtraEvents: Boolean(row.show_extra_events),
  };
});
