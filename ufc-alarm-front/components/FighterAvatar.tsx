import Image from "next/image";
import type { Fighter } from "@/types/domain";
import { initials } from "@/lib/format";

interface FighterAvatarProps {
  fighter: Fighter;
  size?: "xs" | "sm" | "lg";
}

const DIMENSIONS: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "h-16 w-16",
  sm: "h-16 w-16 sm:h-20 sm:w-20",
  lg: "h-28 w-28 sm:h-36 sm:w-36",
};

const INITIALS_TEXT: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "text-base",
  sm: "text-xl",
  lg: "text-2xl",
};

const IMAGE_SIZES: Record<NonNullable<FighterAvatarProps["size"]>, string> = {
  xs: "64px",
  sm: "80px",
  lg: "144px",
};

export default function FighterAvatar({
  fighter,
  size = "sm",
}: FighterAvatarProps) {
  return (
    <div
      className={`relative ${DIMENSIONS[size]} shrink-0 overflow-hidden rounded-full border-2 border-border bg-surface-raised`}
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
          className={`flex h-full w-full items-center justify-center font-heading text-muted ${INITIALS_TEXT[size]}`}
        >
          {initials(fighter.name)}
        </div>
      )}
    </div>
  );
}
