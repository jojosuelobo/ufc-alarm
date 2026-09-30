"use client";

import { useActionState } from "react";
import { setDiscordWebhookAction } from "@/lib/auth/actions";

export default function DiscordWebhookForm({
  initialValue,
  initialMentionEveryone,
}: {
  initialValue: string | null;
  initialMentionEveryone: boolean;
}) {
  const [state, action, pending] = useActionState(setDiscordWebhookAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="discordWebhookUrl"
          className="text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Webhook do Discord
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="discordWebhookUrl"
            name="discordWebhookUrl"
            type="url"
            defaultValue={initialValue ?? ""}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="discordMentionEveryone"
          defaultChecked={initialMentionEveryone}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        Marcar @everyone nas mensagens (notifica todo mundo do servidor)
      </label>

      {state?.error && <p className="text-sm font-semibold text-accent">{state.error}</p>}
    </form>
  );
}
