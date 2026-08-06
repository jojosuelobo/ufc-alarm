"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { toggleAlarmAction } from "@/lib/alarms/actions";
import { unlockAudio } from "@/lib/audio";
import PromptModal from "./PromptModal";

interface NotificationBellButtonProps {
  size?: "sm" | "lg";
  isLoggedIn: boolean;
  hasPhone: boolean;
  active: boolean;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  boutId: string;
  weightClass?: string;
  fighterRedName: string;
  fighterBlueName: string;
}

export default function NotificationBellButton({
  size = "sm",
  isLoggedIn,
  hasPhone,
  active,
  eventSlug,
  eventTitle,
  eventStartsAt,
  boutId,
  weightClass,
  fighterRedName,
  fighterBlueName,
}: NotificationBellButtonProps) {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(active);
  const [prevActive, setPrevActive] = useState(active);
  const [prompt, setPrompt] = useState<"login" | "phone" | null>(null);
  const [, startTransition] = useTransition();

  // Resync local (optimistic) state when the server-derived `active` prop
  // changes — e.g. after a revalidation from another tab/action — without
  // an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  if (active !== prevActive) {
    setPrevActive(active);
    setIsActive(active);
  }

  const dimension = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "lg" ? 20 : 16;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    // A real click here is a real user gesture — good opportunity to unlock
    // the alarm's AudioContext ahead of when it might actually be needed.
    unlockAudio();

    if (!isLoggedIn) {
      setPrompt("login");
      return;
    }
    if (!hasPhone) {
      setPrompt("phone");
      return;
    }

    const nextActive = !isActive;
    setIsActive(nextActive);
    startTransition(async () => {
      const result = await toggleAlarmAction({
        eventSlug,
        eventTitle,
        eventStartsAt,
        boutId,
        weightClass,
        fighterRedName,
        fighterBlueName,
      });
      if (!result.ok) {
        setIsActive(!nextActive);
        setPrompt(result.error === "unauthenticated" ? "login" : "phone");
        return;
      }
      setIsActive(result.active);
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Ativar notificação"
        aria-pressed={isActive}
        onClick={handleClick}
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-full transition ${
          isActive
            ? "bg-accent text-white"
            : "bg-surface-raised text-foreground hover:bg-accent hover:text-white"
        }`}
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

      {prompt === "login" && (
        <PromptModal
          title="Crie uma conta"
          message="Você precisa estar logado para ativar alarmes de luta."
          actionLabel="Entrar ou criar conta"
          actionHref={`/login?redirectTo=${encodeURIComponent(pathname)}`}
          onClose={() => setPrompt(null)}
        />
      )}

      {prompt === "phone" && (
        <PromptModal
          title="Adicione um telefone"
          message="Para receber notificações, adicione um número de telefone em Minha Conta."
          actionLabel="Ir para Minha Conta"
          actionHref="/minha-conta"
          onClose={() => setPrompt(null)}
        />
      )}
    </>
  );
}
