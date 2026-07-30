"use client";

import { useState } from "react";
import UnderConstructionModal from "./UnderConstructionModal";

interface NotificationBellButtonProps {
  size?: "sm" | "lg";
}

export default function NotificationBellButton({
  size = "sm",
}: NotificationBellButtonProps) {
  const [open, setOpen] = useState(false);
  const dimension = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "lg" ? 20 : 16;

  return (
    <>
      <button
        type="button"
        aria-label="Ativar notificação"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-surface-raised text-foreground transition hover:bg-accent`}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a6 6 0 0 0-6 6v3.2c0 .6-.2 1.2-.6 1.7L4 15.3c-.7.9-.1 2.2 1 2.2h14c1.1 0 1.7-1.3 1-2.2l-1.4-2.4a2.8 2.8 0 0 1-.6-1.7V8a6 6 0 0 0-6-6Z" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0h-5Z" />
        </svg>
      </button>
      <UnderConstructionModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
