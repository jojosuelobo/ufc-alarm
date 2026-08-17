import Image from "next/image";
import type { Fighter } from "@/types/domain";
import { initials } from "@/lib/format";

interface FighterAvatarProps {
  fighter: Fighter;
  size?: "xs" | "sm" | "lg";
  /**
   * "circle" (default) is the small rounded headshot used in list rows.
   * "portrait" is for FightCard: Cito's fight-card photos are tall
   * transparent-background full-body cutouts (~185x727), not square
   * headshots. Cropped into the old small circle, the top-anchored crop
   * window landed mostly on transparent canvas above the head, showing the
   * circle's own background through it. Portrait uses a taller box with the
   * same top-anchored cover crop — since the box is far shorter than the
   * source image, that crop naturally lands on head+shoulders+chest, a
   * bust-up shot, with no background box needed since cover fills it.
   */
  shape?: "circle" | "portrait";
}

const CIRCLE_DIMENSIONS: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "h-16 w-16",
  sm: "h-16 w-16 sm:h-20 sm:w-20",
  lg: "h-28 w-28 sm:h-36 sm:w-36",
};

const PORTRAIT_DIMENSIONS: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "h-24 w-20",
  sm: "h-32 w-24 sm:h-40 sm:w-32",
  lg: "h-48 w-36 sm:h-64 sm:w-48",
};

const INITIALS_TEXT: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "text-base",
  sm: "text-xl",
  lg: "text-2xl",
};

const IMAGE_SIZES: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "80px",
  sm: "128px",
  lg: "192px",
};

export default function FighterAvatar({
  fighter,
  size = "sm",
  shape = "circle",
}: FighterAvatarProps) {
  const isPortrait = shape === "portrait";
  const dimensions = isPortrait ? PORTRAIT_DIMENSIONS[size] : CIRCLE_DIMENSIONS[size];

  return (
    <div
      className={`relative ${dimensions} shrink-0 overflow-hidden ${
        isPortrait ? "" : "rounded-full border-2 border-border bg-surface-raised"
      }`}
    >
      {fighter.photoUrl ? (
        <Image
          src={fighter.photoUrl}
          alt={fighter.name}
          fill
          sizes={IMAGE_SIZES[size]}
          className="object-cover object-top"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-heading text-muted ${
            isPortrait ? "rounded-full bg-surface-raised" : ""
          } ${INITIALS_TEXT[size]}`}
        >
          {initials(fighter.name)}
        </div>
      )}
    </div>
  );
}
