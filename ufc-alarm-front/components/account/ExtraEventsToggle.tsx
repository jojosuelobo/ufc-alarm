"use client";

import { useState, useTransition } from "react";
import { setShowExtraEventsAction } from "@/lib/auth/actions";

export default function ExtraEventsToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setShowExtraEventsAction(next);
      if (!result.ok) {
        setEnabled(!next);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-6 rounded-md border border-border px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">
          Exibir eventos extras? (DWCS e Road to UFC)
        </p>
        <p className="mt-1 text-sm text-muted">
          Quando desativado, esses eventos não aparecem na listagem.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Exibir eventos extras (DWCS e Road to UFC)"
        onClick={handleToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-surface-raised"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
