"use client";

import { useActionState } from "react";
import { setPhoneAction } from "@/lib/auth/actions";

export default function PhoneForm({ initialValue }: { initialValue: string | null }) {
  const [state, action, pending] = useActionState(setPhoneAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <label htmlFor="phone" className="text-sm font-semibold uppercase tracking-wide text-muted">
        Telefone
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialValue ?? ""}
          maxLength={20}
          placeholder="Necessário para ativar o WhatsApp"
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
      {state?.error && <p className="text-sm font-semibold text-accent">{state.error}</p>}
    </form>
  );
}
