"use client";

import { useState, useTransition } from "react";
import {
  setNotificationChannelAction,
  type NotificationChannel,
} from "@/lib/auth/actions";

interface NotificationChannelToggleProps {
  channel: NotificationChannel;
  initialValue: boolean;
  label: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
}

export default function NotificationChannelToggle({
  channel,
  initialValue,
  label,
  description,
  disabled = false,
  disabledReason,
}: NotificationChannelToggleProps) {
  const [enabled, setEnabled] = useState(initialValue);
  const [, startTransition] = useTransition();

  function handleToggle() {
    if (disabled) return;
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setNotificationChannelAction(channel, next);
      if (!result.ok) {
        setEnabled(!next);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-sm text-muted">
          {disabled && disabledReason ? disabledReason : description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-disabled={disabled}
        aria-label={label}
        onClick={handleToggle}
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
          disabled ? "cursor-not-allowed opacity-40" : ""
        } ${enabled ? "bg-accent" : "bg-surface-raised"}`}
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
