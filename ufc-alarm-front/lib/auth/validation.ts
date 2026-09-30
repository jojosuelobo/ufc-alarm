const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/** Only allow same-origin relative paths — `redirectTo` comes from a query string an attacker controls. */
export function safeRedirect(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

// Discord webhook URLs get POSTed to server-side by the worker — accepting
// an arbitrary user-supplied URL there would let anyone point our server at
// an internal address (SSRF). Only genuine Discord webhook URLs pass.
const DISCORD_WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export function isValidDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK_RE.test(url);
}
