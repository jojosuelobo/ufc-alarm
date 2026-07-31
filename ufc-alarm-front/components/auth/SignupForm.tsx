"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/auth/actions";

export default function SignupForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold uppercase tracking-wide text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
        />
        <p className="text-xs text-muted">Mínimo de 8 caracteres.</p>
      </div>

      {state?.error && <p className="text-sm font-semibold text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-accent py-3 font-heading text-lg uppercase tracking-wide text-white disabled:opacity-60"
      >
        {pending ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link
          href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="font-semibold text-accent"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
