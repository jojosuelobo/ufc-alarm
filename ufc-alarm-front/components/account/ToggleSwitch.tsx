"use client";

interface ToggleSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  warning?: string;
}

export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  warning,
}: ToggleSwitchProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
            checked ? "bg-accent" : "bg-surface-raised"
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {/* Visual alert instead of blocking the toggle — the field is still
          freely clickable; the warning just flags that saving will fail
          until its prerequisite field is filled in. */}
      {warning && <p className="text-sm font-semibold text-accent">⚠ {warning}</p>}
    </div>
  );
}
