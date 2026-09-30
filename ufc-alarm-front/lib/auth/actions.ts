"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { createSession, deleteSession } from "./session";
import { getCurrentUser } from "./dal";
import { isValidDiscordWebhookUrl, isValidEmail, isValidPassword, safeRedirect } from "./validation";

export type AuthActionState = { error: string } | undefined;

interface UserRow {
  id: number;
  password_hash: string;
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") ?? ""));

  if (!isValidEmail(email)) {
    return { error: "Digite um e-mail válido." };
  }
  if (!isValidPassword(password)) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    return { error: "Já existe uma conta com esse e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let userId: number;
  try {
    const result = db
      .prepare(`INSERT INTO users (email, password_hash) VALUES (?, ?)`)
      .run(email, passwordHash);
    userId = Number(result.lastInsertRowid);
  } catch {
    return { error: "Já existe uma conta com esse e-mail." };
  }

  await createSession(userId);
  redirect(redirectTo);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") ?? ""));

  const row = db
    .prepare(`SELECT id, password_hash FROM users WHERE email = ?`)
    .get(email) as UserRow | undefined;

  const passwordMatches = row ? await bcrypt.compare(password, row.password_hash) : false;

  if (!row || !passwordMatches) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createSession(row.id);
  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/");
}

export async function updateProfileAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const preferredNameRaw = String(formData.get("preferredName") ?? "").trim();
  const preferredName = preferredNameRaw.slice(0, 80) || null;

  db.prepare(`UPDATE users SET preferred_name = ? WHERE id = ?`).run(preferredName, user.id);

  revalidatePath("/minha-conta");
  return;
}

export async function setPhoneAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw ? phoneRaw.slice(0, 20) : null;

  if (phone && (phone.length < 8 || phone.length > 20)) {
    return { error: "Telefone inválido." };
  }

  db.prepare(`UPDATE users SET phone = ? WHERE id = ?`).run(phone, user.id);

  revalidatePath("/minha-conta");
}

const NOTIFICATION_CHANNEL_COLUMNS = {
  site: "notify_site",
  whatsapp: "notify_whatsapp",
  discord: "notify_discord",
  telegram: "notify_telegram",
} as const;

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNEL_COLUMNS;

export async function setNotificationChannelAction(
  channel: NotificationChannel,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error?: "no_phone" | "no_webhook" }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false };
  }

  const column = NOTIFICATION_CHANNEL_COLUMNS[channel];
  if (!column) {
    return { ok: false };
  }

  if (channel === "whatsapp" && enabled && !user.phone) {
    return { ok: false, error: "no_phone" };
  }
  if (channel === "discord" && enabled && !user.discordWebhookUrl) {
    return { ok: false, error: "no_webhook" };
  }

  db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(enabled ? 1 : 0, user.id);

  revalidatePath("/minha-conta");

  return { ok: true };
}

export async function setDiscordWebhookAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const raw = String(formData.get("discordWebhookUrl") ?? "").trim();
  const url = raw || null;
  const mentionEveryone = formData.get("discordMentionEveryone") === "on";

  if (url && !isValidDiscordWebhookUrl(url)) {
    return { error: "URL de webhook do Discord inválida." };
  }

  db.prepare(
    `UPDATE users SET discord_webhook_url = ?, discord_mention_everyone = ? WHERE id = ?`,
  ).run(url, mentionEveryone ? 1 : 0, user.id);

  revalidatePath("/minha-conta");
}

export async function setShowExtraEventsAction(
  showExtraEvents: boolean,
): Promise<{ ok: true } | { ok: false }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false };
  }

  db.prepare(`UPDATE users SET show_extra_events = ? WHERE id = ?`).run(
    showExtraEvents ? 1 : 0,
    user.id,
  );

  revalidatePath("/minha-conta");
  revalidatePath("/eventos");
  revalidatePath("/");

  return { ok: true };
}
