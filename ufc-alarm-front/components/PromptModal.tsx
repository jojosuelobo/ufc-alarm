"use client";

import Link from "next/link";

interface PromptModalProps {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  onClose: () => void;
}

export default function PromptModal({
  title,
  message,
  actionLabel,
  actionHref,
  onClose,
}: PromptModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-background p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-2xl uppercase tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link
          href={actionHref}
          className="mt-5 block w-full rounded-md bg-accent py-2 font-heading uppercase tracking-wide text-white"
        >
          {actionLabel}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
