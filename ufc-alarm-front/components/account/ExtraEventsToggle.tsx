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
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide">
          Exibir eventos extras? (DWCS e Road to UFC)
        </p>
        <p className="mt-0.5 text-sm text-muted">
          Quando desativado, esses eventos não aparecem na listagem.
        </p>
      </div>
      {/* Canonical Tailwind switch layout (flex + padding, knob positioned
          purely via flex flow + translate) — no absolute positioning, so
          there's no reliance on the browser's "static position" fallback
          for an unpositioned absolute child, which is what made the
          previous version render inconsistently. */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Exibir eventos extras (DWCS e Road to UFC)"
        onClick={handleToggle}
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
          enabled ? "bg-accent" : "bg-surface-raised"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
