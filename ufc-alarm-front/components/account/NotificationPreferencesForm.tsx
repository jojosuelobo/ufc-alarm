"use client";

import { useState, useTransition } from "react";
import { saveNotificationPreferencesAction } from "@/lib/auth/actions";
import type { SafeUser } from "@/lib/auth/dal";
import ToggleSwitch from "./ToggleSwitch";

export default function NotificationPreferencesForm({ user }: { user: SafeUser }) {
  const [notifySite, setNotifySite] = useState(user.notifySite);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(user.notifyWhatsapp);
  const [notifyDiscord, setNotifyDiscord] = useState(user.notifyDiscord);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(user.discordWebhookUrl ?? "");
  const [mentionEveryone, setMentionEveryone] = useState(user.discordMentionEveryone);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const whatsappNeedsPhone = notifyWhatsapp && !phone.trim();
  const discordNeedsWebhook = notifyDiscord && !discordWebhookUrl.trim();

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await saveNotificationPreferencesAction({
        notifySite,
        notifyWhatsapp,
        notifyDiscord,
        phone: phone.trim() || null,
        discordWebhookUrl: discordWebhookUrl.trim() || null,
        discordMentionEveryone: mentionEveryone,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ToggleSwitch
        label="Notificação pelo site"
        description="O site pisca e toca um som quando a luta começa."
        checked={notifySite}
        onChange={setNotifySite}
      />

      <div className="flex flex-col gap-3">
        <ToggleSwitch
          label="WhatsApp"
          description="Você recebe uma mensagem no WhatsApp assim que a luta for começar."
          checked={notifyWhatsapp}
          onChange={setNotifyWhatsapp}
          warning={whatsappNeedsPhone ? "Cadastre um telefone abaixo para poder salvar." : undefined}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          placeholder="Telefone"
          className="rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-3">
        <ToggleSwitch
          label="Discord"
          description="Você recebe uma mensagem no canal do Discord assim que a luta for começar."
          checked={notifyDiscord}
          onChange={setNotifyDiscord}
          warning={
            discordNeedsWebhook ? "Cole a URL de um webhook abaixo para poder salvar." : undefined
          }
        />
        <input
          type="url"
          value={discordWebhookUrl}
          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={mentionEveryone}
            onChange={(e) => setMentionEveryone(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Marcar @everyone nas mensagens (notifica todo mundo do servidor)
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-accent">{error}</p>}
      {saved && !error && <p className="text-sm font-semibold text-muted">Salvo!</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="self-end rounded-md bg-accent px-6 py-2.5 font-heading text-base uppercase tracking-wide text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
