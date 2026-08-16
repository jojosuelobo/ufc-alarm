import type { Fight, Fighter } from "@/types/domain";
import { formatWeightClass } from "@/lib/format";
import FighterAvatar from "./FighterAvatar";
import NotificationBellButton from "./NotificationBellButton";

interface FightCardProps {
  fight: Fight;
  highlight?: boolean;
  isLive?: boolean;
  winnerName?: string | null;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  isLoggedIn: boolean;
  hasPhone: boolean;
  activeAlarmBoutIds: Set<string>;
}

function FighterBlock({
  fighter,
  size,
}: {
  fighter: Fighter;
  size: "sm" | "lg";
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      <FighterAvatar fighter={fighter} size={size} />
      <div>
        <p
          className={`font-heading uppercase tracking-tight ${
            size === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
          }`}
        >
          {fighter.name}
        </p>
        {fighter.record && (
          <p className="mt-1 text-base text-muted">{fighter.record}</p>
        )}
        {fighter.flagEmoji && fighter.country && (
          <p className="mt-0.5 text-base text-muted">
            {fighter.flagEmoji} {fighter.country}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FightCard({
  fight,
  highlight = false,
  isLive = false,
  winnerName = null,
  eventSlug,
  eventTitle,
  eventStartsAt,
  isLoggedIn,
  hasPhone,
  activeAlarmBoutIds,
}: FightCardProps) {
  const weightClass = formatWeightClass(fight.weightClass);

  return (
    <div className={highlight ? "" : "py-10 first:pt-0 last:pb-0"}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {weightClass && (
            <p className="truncate font-heading text-base uppercase tracking-wide sm:text-lg">
              {weightClass}
              {fight.titleBout ? " · Título" : ""}
            </p>
          )}
          {isLive && (
            <span className="shrink-0 rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Ao vivo
            </span>
          )}
          {!isLive && winnerName && (
            <span className="shrink-0 truncate rounded bg-surface-raised px-2 py-0.5 text-xs font-bold text-foreground">
              🏆 {winnerName}
            </span>
          )}
        </div>
        <NotificationBellButton
          size={highlight ? "lg" : "sm"}
          isLoggedIn={isLoggedIn}
          hasPhone={hasPhone}
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

      <div className="flex items-center gap-4 sm:gap-14">
        <FighterBlock fighter={fight.fighterRed} size={highlight ? "lg" : "sm"} />
        <span className="font-heading text-3xl text-accent">VS</span>
        <FighterBlock fighter={fight.fighterBlue} size={highlight ? "lg" : "sm"} />
      </div>

      {fight.odds && (
        <div className="mt-5 flex justify-between text-base text-muted">
          <span>{fight.odds.red > 0 ? `+${fight.odds.red}` : fight.odds.red}</span>
          <span>{fight.odds.blue > 0 ? `+${fight.odds.blue}` : fight.odds.blue}</span>
        </div>
      )}
    </div>
  );
}
