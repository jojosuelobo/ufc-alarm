import Link from "next/link";
import type { AlarmListItem } from "@/lib/alarms/queries";
import { removeAlarmAction } from "@/lib/alarms/actions";
import { formatWeightClass } from "@/lib/format";

function formatDate(iso: string | null): string {
  if (!iso) return "Data a confirmar";
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AlarmList({ alarms }: { alarms: AlarmListItem[] }) {
  if (alarms.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        Nenhum alarme ativo. Clique no sino de uma luta para ativar um.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {alarms.map((alarm) => (
        <div key={alarm.id} className="flex items-center justify-between gap-4 py-5">
          <div className="min-w-0">
            <Link
              href={`/eventos/${alarm.eventSlug}`}
              className="font-heading text-lg uppercase tracking-tight hover:text-accent"
            >
              {alarm.fighterRedName} vs {alarm.fighterBlueName}
            </Link>
            <p className="mt-0.5 text-sm text-muted">
              {formatWeightClass(alarm.weightClass ?? undefined) ?? alarm.eventTitle}
            </p>
            <p className="text-sm text-muted">{formatDate(alarm.eventStartsAt)}</p>
          </div>
          <form action={removeAlarmAction.bind(null, alarm.id)}>
            <button
              type="submit"
              className="shrink-0 rounded-md border border-border px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted hover:border-accent hover:text-accent"
            >
              Remover
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
