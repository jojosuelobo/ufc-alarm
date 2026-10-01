"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import type { SafeUser } from "@/lib/auth/dal";

export default function ProfileForm({ user }: { user: SafeUser }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">E-mail</span>
        <p className="text-base">{user.email}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferredName" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Nome preferido
        </label>
        <input
          id="preferredName"
          name="preferredName"
          type="text"
          defaultValue={user.preferredName ?? ""}
          maxLength={80}
          className="rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {state?.error && <p className="text-sm font-semibold text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-end rounded-md bg-accent px-6 py-2.5 font-heading text-base uppercase tracking-wide text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
