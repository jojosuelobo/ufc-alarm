"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { createSession, deleteSession } from "./session";
import { getCurrentUser } from "./dal";
import { isValidEmail, isValidPassword, safeRedirect } from "./validation";

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
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  const preferredName = preferredNameRaw.slice(0, 80) || null;
  const phone = phoneRaw ? phoneRaw.slice(0, 20) : null;

  if (phone && (phone.length < 8 || phone.length > 20)) {
    return { error: "Telefone inválido." };
  }

  db.prepare(`UPDATE users SET preferred_name = ?, phone = ? WHERE id = ?`).run(
    preferredName,
    phone,
    user.id,
  );

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
