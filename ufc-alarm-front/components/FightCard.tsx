import type { Fight, Fighter } from "@/types/domain";
import { formatWeightClass } from "@/lib/format";
import FighterAvatar from "./FighterAvatar";
import NotificationBellButton from "./NotificationBellButton";

interface FightCardProps {
  fight: Fight;
  highlight?: boolean;
  /** Alternates a subtle background tone between fights in a list, so
   * adjacent fights are easier to tell apart at a glance. Ignored when
   * `highlight` is set (the main event is already visually distinct). */
  alternate?: boolean;
  isLive?: boolean;
  winnerCorner?: "red" | "blue" | null;
  round?: number | null;
  time?: string | null;
  method?: string | null;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  isLoggedIn: boolean;
  activeAlarmBoutIds: Set<string>;
}

function formatOdds(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function FighterBlock({
  fighter,
  size,
  isWinner,
}: {
  fighter: Fighter;
  size: "sm" | "lg";
  isWinner: boolean;
}) {
  const cornerColorClass = fighter.corner === "red" ? "text-corner-red" : "text-corner-blue";

  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      <div className="relative">
        {isWinner && (
          <span className="absolute -left-2 -top-2 z-10 rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Vitória
          </span>
        )}
        <FighterAvatar fighter={fighter} size={size} shape="portrait" />
      </div>
      <p
        className={`font-heading uppercase tracking-tight ${cornerColorClass} ${
          size === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
        }`}
      >
        {fighter.name}
      </p>
      {fighter.record && (
        <p className="text-sm font-semibold text-muted">{fighter.record}</p>
      )}
      {fighter.flagEmoji && fighter.country && (
        <p className="text-base text-muted">
          {fighter.flagEmoji} {fighter.country}
        </p>
      )}
    </div>
  );
}

export default function FightCard({
  fight,
  highlight = false,
  alternate = false,
  isLive = false,
  winnerCorner = null,
  round = null,
  time = null,
  method = null,
  eventSlug,
  eventTitle,
  eventStartsAt,
  isLoggedIn,
  activeAlarmBoutIds,
}: FightCardProps) {
  const weightClass = formatWeightClass(fight.weightClass);
  const isFinished = !isLive && winnerCorner !== null;
  const hasStatsRow = (isLive || isFinished) && (round != null || time || method);

  return (
    <div
      className={
        highlight
          ? ""
          : `rounded-lg px-4 py-10 first:pt-0 last:pb-0 sm:px-6 ${alternate ? "bg-surface" : ""}`
      }
    >
      <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div />
        <div className="flex min-w-0 items-center justify-center gap-2 text-center">
          {weightClass && (
            <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted sm:text-sm">
              {weightClass}
              {fight.titleBout ? " · Disputa de Cinturão" : ""}
            </p>
          )}
          {isLive && (
            <span className="shrink-0 rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Ao vivo
            </span>
          )}
        </div>
        <div className="flex justify-end">
          <NotificationBellButton
            size={highlight ? "lg" : "sm"}
            isLoggedIn={isLoggedIn}
            active={activeAlarmBoutIds.has(fight.boutId)}
            eventSlug={eventSlug}
            eventTitle={eventTitle}
            eventStartsAt={eventStartsAt}
            boutId={fight.boutId}
            weightClass={fight.weightClass}
            fighterRedName={fight.fighterRed.name}
            fighterBlueName={fight.fighterBlue.name}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-14">
        <FighterBlock
          fighter={fight.fighterRed}
          size={highlight ? "lg" : "sm"}
          isWinner={winnerCorner === "red"}
        />
        <span className="font-heading text-3xl text-accent">VS</span>
        <FighterBlock
          fighter={fight.fighterBlue}
          size={highlight ? "lg" : "sm"}
          isWinner={winnerCorner === "blue"}
        />
      </div>

      {hasStatsRow && (
        <div className="mt-4 flex items-center justify-center gap-8 text-center">
          {round != null && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Round</p>
              <p className="font-semibold">{round}</p>
            </div>
          )}
          {time && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Tempo</p>
              <p className="font-semibold">{time}</p>
            </div>
          )}
          {method && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Método</p>
              <p className="font-semibold">{method}</p>
            </div>
          )}
        </div>
      )}

      {fight.odds && (
        <div className="mt-5 flex justify-between text-base text-muted">
          <span>{formatOdds(fight.odds.red)}</span>
          <span>{formatOdds(fight.odds.blue)}</span>
        </div>
      )}
    </div>
  );
}
