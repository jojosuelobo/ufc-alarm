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

export interface NotificationPreferencesInput {
  notifySite: boolean;
  notifyWhatsapp: boolean;
  notifyDiscord: boolean;
  phone: string | null;
  discordWebhookUrl: string | null;
  discordMentionEveryone: boolean;
}

export type NotificationPreferencesResult = { ok: true } | { ok: false; error: string };

// Single save for the whole "como você quer ser notificado?" section — one
// request, one validation pass, one UPDATE. Replaces what used to be three
// separate actions (one per toggle, one for phone, one for the webhook)
// that could leave a channel "on" with its prerequisite field blank (e.g.
// WhatsApp stays enabled after the phone is cleared, since nothing re-ran
// the whatsapp-needs-phone check at the time the phone was removed).
// Validating everything together here means that can't happen.
export async function saveNotificationPreferencesAction(
  input: NotificationPreferencesInput,
): Promise<NotificationPreferencesResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const phoneRaw = input.phone?.trim() ?? "";
  const phone = phoneRaw ? phoneRaw.slice(0, 20) : null;
  if (phone && (phone.length < 8 || phone.length > 20)) {
    return { ok: false, error: "Telefone inválido." };
  }
  if (input.notifyWhatsapp && !phone) {
    return { ok: false, error: "Cadastre um telefone para ativar o WhatsApp." };
  }

  const webhookRaw = input.discordWebhookUrl?.trim() ?? "";
  const discordWebhookUrl = webhookRaw || null;
  if (discordWebhookUrl && !isValidDiscordWebhookUrl(discordWebhookUrl)) {
    return { ok: false, error: "URL de webhook do Discord inválida." };
  }
  if (input.notifyDiscord && !discordWebhookUrl) {
    return { ok: false, error: "Cole a URL de um webhook do Discord para ativar o Discord." };
  }

  // notify_telegram is left untouched here on purpose — the Telegram
  // channel is paused (UI removed, see NotificationPreferencesForm) rather
  // than deleted, since it needs its own bot + chat-linking flow, not just
  // a webhook URL like Discord. Existing values stay as they were.
  db.prepare(
    `UPDATE users SET
      notify_site = ?, notify_whatsapp = ?, notify_discord = ?,
      phone = ?, discord_webhook_url = ?, discord_mention_everyone = ?
     WHERE id = ?`,
  ).run(
    input.notifySite ? 1 : 0,
    input.notifyWhatsapp ? 1 : 0,
    input.notifyDiscord ? 1 : 0,
    phone,
    discordWebhookUrl,
    input.discordMentionEveryone ? 1 : 0,
    user.id,
  );

  revalidatePath("/minha-conta");
  revalidatePath("/eventos");
  revalidatePath("/");

  return { ok: true };
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
